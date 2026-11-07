import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGame, TREATS } from '../store'
import { buzz } from '../haptics'
import { world, clampToBounds } from '../world'
import { fx } from './Particles'
import { sfx } from '../audio'
import Icon from './Icons'

const SCALE = 1.25

// How much the bunny enjoys being touched in each area (negative = dislikes).
const PREFS = { face: 1.5, head: 1.3, back: 1.0, ears: 0.45, rump: -1, feet: -1 }
const ZONE_OF_BONE = {
  Head: 'head', Neck: 'head', Jaw: 'face',
  Ear_L: 'ears', Ear_Tip_L: 'ears', Ear_R: 'ears', Ear_Tip_R: 'ears',
  Chest: 'back', Spine: 'back', Leg_FL_Upper: 'back', Leg_FR_Upper: 'back',
  Tail: 'rump', Leg_BL: 'rump', Leg_BR: 'rump', Leg_BL_Upper: 'rump', Leg_BR_Upper: 'rump',
  Leg_FL: 'feet', Leg_FR: 'feet'
}
const LIKE_LINES = {
  face: ['{n} loves cheek rubs', 'Nose rubs! {n} is in heaven', '{n} leans into your hand'],
  head: ['Forehead strokes are {n}\'s favourite', '{n} closes their eyes happily', 'So soft...'],
  back: ['Long back strokes, just right', '{n} flops a little lower'],
  ears: ['Gently! Ears are sensitive', 'Try the forehead instead']
}
const DISLIKE_LINES = {
  rump: '{n} would rather not be touched there',
  feet: 'Bunnies don\'t love paw touches',
  rough: 'Slower, gentler strokes'
}

const OVERRIDDEN = ['Head', 'Ear_L', 'Ear_R', 'Jaw', 'Tail', 'Eye_L', 'Eye_R']
const TICK_DIST = 0.07 // world units of stroke per "pet"
const ROUGH_SPEED = 3.4 // world units / second

const _v = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()
const _e = new THREE.Euler()
const DIRTY = new THREE.Color('#8a7663')

const lerpAngle = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}
const angleDiff = (a, b) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return d
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const fmt = (s) => s.replaceAll('{n}', useGame.getState().name)

// Rotate a bone by an offset expressed in the bunny's own frame (x = side,
// y = up, z = forward), layered on top of whatever the animation set.
function rotateBoneInBunnyFrame(bone, groupQuat, euler) {
  _q.setFromEuler(euler)
  _q.premultiply(groupQuat).multiply(_q2.copy(groupQuat).invert()) // to world
  bone.parent.getWorldQuaternion(_q2)
  const parentInv = _q2.clone().invert()
  _q.premultiply(parentInv).multiply(_q2) // to parent space
  bone.quaternion.premultiply(_q)
}

// Accessories are modelled in the bunny's rest-pose space, then parented to a
// bone so they follow the animation.
function buildAccessories(bones) {
  const std = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), ...extra })
  const out = {}
  const place = (id, boneName, group, pos, rot = [0, 0, 0]) => {
    const bone = bones[boneName]
    if (!bone) return
    group.position.set(...pos)
    group.rotation.set(...rot)
    group.visible = false
    group.traverse((o) => { if (o.isMesh) o.castShadow = true })
    bone.attach(group)
    out[id] = group
  }

  // Ribbon bow by the left ear.
  const bow = new THREE.Group()
  const pink = std('#ff6f9f')
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), pink)
    loop.scale.set(0.034, 0.022, 0.012)
    loop.position.set(side * 0.03, 0, 0)
    loop.rotation.z = side * 0.35
    bow.add(loop)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.006), pink)
    tail.position.set(side * 0.012, -0.022, 0)
    tail.rotation.z = side * 0.4
    bow.add(tail)
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), std('#ff4f86'))
  bow.add(knot)
  place('bow', 'Head', bow, [0.07, 0.53, 0.15], [0.1, 0, -0.45])

  // Flower crown.
  const crown = new THREE.Group()
  const vine = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.009, 8, 40), std('#6fae5a'))
  vine.rotation.x = Math.PI / 2
  crown.add(vine)
  const petals = ['#ffb3c9', '#fff3a0', '#ffffff', '#c9b3ff', '#ffc48a']
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.019, 1), std(petals[i % petals.length]))
    f.position.set(Math.cos(a) * 0.1, 0.008, Math.sin(a) * 0.1)
    f.scale.set(1, 0.7, 1)
    crown.add(f)
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), std('#ffcf4a'))
    c.position.set(Math.cos(a) * 0.1, 0.022, Math.sin(a) * 0.1)
    crown.add(c)
  }
  place('crown', 'Head', crown, [0, 0.515, 0.15], [0.22, 0, 0])

  // Party hat.
  const hat = new THREE.Group()
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 24), std('#7bdff2'))
  hat.add(cone)
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.006, 8, 24), std('#ff7eb3'))
  stripe.rotation.x = Math.PI / 2
  stripe.position.y = -0.02
  hat.add(stripe)
  const pom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.018, 2), std('#ffd166'))
  pom.position.y = 0.07
  hat.add(pom)
  place('hat', 'Head', hat, [-0.025, 0.6, 0.16], [0.1, 0, 0.25])

  // Knitted scarf.
  const scarf = new THREE.Group()
  const red = std('#e8615a', { roughness: 0.95 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.032, 10, 32), red)
  ring.rotation.x = Math.PI / 2
  ring.scale.set(1, 1.05, 1)
  scarf.add(ring)
  const end = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.07, 4, 8), red)
  end.position.set(0.06, -0.05, 0.11)
  end.rotation.set(0.3, 0, 0.25)
  scarf.add(end)
  const fringe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.02, 10), std('#fff1e0'))
  fringe.position.set(0.075, -0.1, 0.125)
  fringe.rotation.set(0.3, 0, 0.25)
  scarf.add(fringe)
  place('scarf', 'Neck', scarf, [0, 0.29, 0.06], [0.28, 0, 0])

  return out
}

export default function Bunny() {
  const gltf = useGLTF('/bunny.glb')
  const group = useRef()
  const body = useRef()

  const { model, bones, furMats, blushMat, accessories } = useMemo(() => {
    const model = skeletonClone(gltf.scene)
    model.rotation.y = Math.PI // the GLB faces -Z; turn it toward the camera
    const bones = {}
    const furMats = []
    model.traverse((o) => {
      if (o.isBone || o.name === 'Eye_L' || o.name === 'Eye_R') bones[o.name] = o
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        const list = Array.isArray(o.material) ? o.material : [o.material]
        const next = list.map((m) => {
          if (m.name.startsWith('Fur')) {
            const base = m.color.clone()
            if (m.name === 'Fur_Cream') base.lerp(new THREE.Color(0.95, 0.72, 0.45), 0.25)
            const pm = new THREE.MeshPhysicalMaterial({
              name: m.name,
              color: base.clone(),
              roughness: 0.9,
              sheen: 1,
              sheenRoughness: 0.5,
              sheenColor: new THREE.Color('#fff3df'),
              side: THREE.DoubleSide
            })
            pm.userData.base = base
            furMats.push(pm)
            return pm
          }
          const c = m.clone()
          if (m.name === 'Pink') c.roughness = 0.55
          return c
        })
        o.material = Array.isArray(o.material) ? next : next[0]
      }
    })

    // Rosy cheeks that fade in when the bunny is happy.
    model.updateMatrixWorld(true)
    const blushMat = new THREE.MeshBasicMaterial({ color: '#ff7f9f', transparent: true, opacity: 0, depthWrite: false })
    for (const side of ['L', 'R']) {
      const eye = bones[`Eye_${side}`]
      if (!eye || !bones.Head) continue
      const p = eye.getWorldPosition(new THREE.Vector3())
      const sx = Math.sign(p.x) || 1
      p.add(new THREE.Vector3(sx * 0.014, -0.045, -0.008))
      const center = bones.Head.getWorldPosition(new THREE.Vector3())
      const out = p.clone().sub(center).setY(0).normalize()
      p.addScaledVector(out, 0.006)
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), blushMat)
      m.position.copy(p)
      m.lookAt(p.clone().add(out))
      m.renderOrder = 2
      bones.Head.attach(m)
    }
    const accessories = buildAccessories(bones)
    return { model, bones, furMats, blushMat, accessories }
  }, [gltf])

  // Show the accessories the player chose.
  const wardrobe = useGame((st) => st.wardrobe)
  useEffect(() => {
    for (const id in accessories) accessories[id].visible = wardrobe.head === id || wardrobe.neck === id
  }, [wardrobe, accessories])
  useEffect(() => useGame.subscribe((st, prev) => {
    if (st.wardrobe !== prev.wardrobe) {
      fx.burst('sparkle', _v.copy(world.bunny.head).add(_v2.set(0, 0.12, 0)), 12)
      sfx.sparkle()
      const s = b.current
      if (s.state === 'idle' || s.state === 'hold') { setState('react'); play('Yes', { loop: false, fade: 0.2 }) }
    }
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  const poseBase = useMemo(() => ({}), [model])
  const actions = useMemo(() => {
    const a = {}
    gltf.animations.forEach((clip) => { a[clip.name] = mixer.clipAction(clip) })
    return a
  }, [mixer, gltf])

  // All behaviour state lives in one mutable object (no per-frame React renders).
  const b = useRef(null)
  if (!b.current) {
    b.current = {
      state: 'idle', stateStart: 0, clip: null, clipDone: false,
      moveTarget: new THREE.Vector3(), follow: null, speed: 0.5, arrive: 0.2, onArrive: null,
      nextIdleAct: 3, holdUntil: 0, lookUntil: 0, lookTarget: new THREE.Vector3(), lookMode: 'none',
      look: { yaw: 0, pitch: 0, roll: 0 },
      squint: 1, earBack: 0, blush: 0, munch: 0, eatPitch: 0,
      squash: 0, squashV: 0, spin: 0, spinSpeed: 0,
      petDown: false, downAt: 0, downPoint: new THREE.Vector3(), lastPoint: new THREE.Vector3(), lastTime: 0,
      moved: 0, accum: 0, speedAvg: 0, zone: null, touchLocal: new THREE.Vector3(),
      streak: 0, lastTickAt: -10, annoy: 0, upsetUntil: 0, lastToast: -10, lastBinky: -30,
      eat: null, eatUntil: 0, nextMunch: 0,
      nudges: 0, nudgeCooldown: 0, tiredUntil: 0,
      twirlUntil: 0, earTwitch: [0, 0], nextEarTwitch: 2,
      now: 0, dirtyTimer: 0, greeted: false
    }
  }

  const play = (name, { loop = true, fade = 0.25, speed = 1 } = {}) => {
    const s = b.current
    const next = actions[name]
    if (!next) return
    if (s.clip === name && loop) { next.timeScale = speed; return }
    const prev = actions[s.clip]
    next.reset()
    next.enabled = true
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
    next.clampWhenFinished = !loop
    next.timeScale = speed
    next.setEffectiveWeight(1)
    if (prev && prev !== next) next.crossFadeFrom(prev, fade, false)
    else next.fadeIn(fade)
    next.play()
    s.clip = name
    s.clipDone = false
  }

  useEffect(() => {
    const s = b.current
    actions.IdleBlink_Eye_L?.play()
    actions.IdleBlink_Eye_R?.play()
    play('Idle')
    const onFinished = (e) => { if (e.action === actions[s.clip]) s.clipDone = true }
    mixer.addEventListener('finished', onFinished)
    return () => {
      mixer.removeEventListener('finished', onFinished)
      mixer.stopAllAction()
    }
  }, [mixer, actions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset behaviour when the scene changes.
  useEffect(() => useGame.subscribe((st, prev) => {
    if (st.scene !== prev.scene) {
      const s = b.current
      s.state = 'idle'
      s.eat = null
      s.munch = 0
      play('Idle')
    }
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- behaviour helpers ----------------

  const toast = (text, gap = 3, kind) => {
    const s = b.current
    if (s.now - s.lastToast < gap) return
    s.lastToast = s.now
    useGame.getState().toast(fmt(text), kind)
  }

  const setState = (state) => {
    const s = b.current
    s.state = state
    s.stateStart = s.now
  }

  const toIdle = () => {
    const s = b.current
    setState('idle')
    s.follow = null
    s.onArrive = null
    s.loaf = false
    play('Idle', { fade: 0.35 })
  }

  const goTo = (x, z, { speed = 0.5, clip = 'Walk', arrive = 0.15, onArrive = null, follow = null, clipSpeed = 1 } = {}) => {
    const s = b.current
    s.moveTarget.set(x, 0, z)
    clampToBounds(s.moveTarget, 0.12)
    s.follow = follow
    s.speed = speed
    s.arrive = arrive
    s.onArrive = onArrive
    setState('move')
    play(clip, { speed: clipSpeed })
  }

  const react = (clip, opts) => {
    setState('react')
    play(clip, { loop: false, fade: 0.2, ...opts })
  }

  const hold = (clip, seconds) => {
    const s = b.current
    setState('hold')
    s.holdUntil = s.now + seconds
    play(clip, { loop: false, fade: 0.3 })
  }

  const mouthPos = (out) => {
    const bun = world.bunny
    return out.set(bun.pos.x + Math.sin(bun.yaw) * 0.2, 0.16, bun.pos.z + Math.cos(bun.yaw) * 0.2)
  }

  const startEat = (item) => {
    const s = b.current
    const bun = world.bunny
    if (item.x !== undefined) bun.yaw = Math.atan2(item.x - bun.pos.x, item.z - bun.pos.z)
    setState('eat')
    s.eat = item
    s.eatUntil = s.now + (item.kind === 'treat' ? 1.8 : 3.2)
    s.nextMunch = s.now
    play('Idle', { fade: 0.3 })
  }

  const finishEat = () => {
    const s = b.current
    const g = useGame.getState()
    const item = s.eat
    s.eat = null
    s.munch = 0
    if (item.id) g.removeItem(item.id)
    g.progress(item.kind === 'treat' ? 'treat' : 'meal')
    if (item.kind === 'treat') {
      const t = TREATS.find((x) => x.id === item.treat) || TREATS[0]
      g.change({ food: t.food, joy: t.joy, bond: item.hand ? 3 : 1.5 })
      if (s.makeUp) {
        s.makeUp = false
        g.change({ bond: 1, joy: 10 })
        toast('All is forgiven. {n} snuggles up again', 0)
      } else if (item.hand) toast(t.id === 'carrot' ? '{n} nibbled it right from your hand' : t.line, 0)
      else if (t.line) toast(t.line, 2)
      if (t.id === 'strawberry' && s.now - s.lastBinky > 12) {
        fx.burst('heart', _v.copy(world.bunny.head).add(_v2.set(0, 0.12, 0)), 5)
        binky()
        return
      }
    } else if (item.kind === 'food') {
      g.change({ food: 45, joy: 5, bond: 1 })
      toast('Yum! {n} cleaned the bowl', 0)
    } else {
      g.change({ water: 50, joy: 4, bond: 1 })
      toast('Ahh, refreshing', 0)
    }
    fx.burst('heart', _v.copy(world.bunny.head).add(_v2.set(0, 0.12, 0)), 5)
    fx.burst('sparkle', mouthPos(_v), 6)
    sfx.happy()
    react('Yes')
  }

  const nudgeBall = () => {
    const s = b.current
    const ball = world.ball
    const bun = world.bunny
    const dir = _v.copy(ball.pos).sub(bun.pos).setY(0)
    if (dir.lengthSq() < 1e-4) dir.set(Math.sin(bun.yaw), 0, Math.cos(bun.yaw))
    dir.normalize().applyAxisAngle(_v2.set(0, 1, 0), (Math.random() - 0.5) * 1.2)
    ball.vel.copy(dir).multiplyScalar(1.4 + Math.random() * 0.9)
    ball.vy = 1.3 + Math.random() * 0.6
    s.nudges++
    s.nudgeCooldown = s.now + 1.0
    fx.burst('sparkle', ball.pos, 8)
    sfx.happy()
    buzz(12)
    useGame.getState().change({ joy: 4, bond: 0.6 })
    useGame.getState().progress('fetch')
    react('Jump', { speed: 1.1 })
    if (s.nudges % 6 === 0) {
      s.tiredUntil = s.now + 7
      s.afterReact = () => { hold('Sit', 6); s.loaf = true }
      toast('{n} is taking a little break', 0)
    } else if (s.nudges % 3 === 0) {
      toast(pick(['{n} loves this game!', 'Zoomies!', 'What a good bun']), 2)
    }
  }

  const binky = () => {
    const s = b.current
    s.lastBinky = s.now
    s.petDown = false
    world.petting = false
    s.spin = Math.PI * 2
    s.spinSpeed = (Math.PI * 2) / 0.7
    react('Jump', { speed: 1.0 })
    fx.burst('confetti', _v.copy(world.bunny.pos).setY(0.4), 50)
    fx.burst('heart', world.bunny.head, 8)
    sfx.binky()
    buzz([20, 40, 30])
    toast('Binky! {n} is overjoyed', 0, 'big')
    useGame.getState().change({ bond: 2 })
  }

  const upset = (kind) => {
    const s = b.current
    s.annoy = 0
    s.upsetUntil = s.now + 3
    s.streak = 0
    s.petDown = false
    world.petting = false
    useGame.getState().change({ joy: -6 })
    fx.burst('grump', world.bunny.head, 6)
    sfx.thump()
    buzz(40)
    s.makeUp = true
    toast(DISLIKE_LINES[kind] || DISLIKE_LINES.rough, 0)
    if (!s.makeUpTipShown) {
      s.makeUpTipShown = true
      setTimeout(() => useGame.getState().toast('Tip: offer a treat to make up'), 2600)
    }
    react('No')
    s.afterReact = () => {
      // Hop a short distance away from the camera.
      const bun = world.bunny
      const away = Math.random() < 0.5 ? -1 : 1
      goTo(bun.pos.x + away * 0.5, bun.pos.z - 0.35, { speed: 0.9, clip: 'Run' })
    }
  }

  const runTrick = (id, camera) => {
    const s = b.current
    const g = useGame.getState()
    if (g.needs.food < 12 || g.needs.water < 12) {
      toast('{n} is too hungry and thirsty for tricks', 0)
      sfx.nope()
      return
    }
    s.eat = null
    s.munch = 0
    g.progress('trick')
    const bun = world.bunny
    const reward = () => {
      g.change({ joy: 4, bond: 1.2 })
      fx.burst('sparkle', _v.copy(bun.head).add(_v2.set(0, 0.15, 0)), 10)
    }
    if (id === 'come') {
      const dir = _v.set(camera.position.x - bun.pos.x, 0, camera.position.z - bun.pos.z)
      const dist = dir.length()
      dir.normalize().multiplyScalar(Math.max(0, Math.min(dist - 1.7, 1.4)))
      s.lookMode = 'camera'
      s.lookUntil = s.now + 4
      goTo(bun.pos.x + dir.x, bun.pos.z + dir.z, {
        speed: 0.7,
        clip: 'Walk',
        clipSpeed: 1.2,
        onArrive: () => {
          bun.yaw = Math.atan2(camera.position.x - bun.pos.x, camera.position.z - bun.pos.z)
          fx.burst('heart', bun.head, 4)
          sfx.happy()
          g.change({ joy: 3, bond: 0.8 })
          react('Yes')
        }
      })
      return
    }
    // Face the camera before performing.
    bun.yaw = Math.atan2(camera.position.x - bun.pos.x, camera.position.z - bun.pos.z)
    s.lookMode = 'camera'
    s.lookUntil = s.now + 3
    reward()
    if (id === 'sit') { hold('Sit', 3); sfx.happy() }
    else if (id === 'wave') { react('Wave'); sfx.happy() }
    else if (id === 'binky') binky()
    else if (id === 'twirl') {
      setState('twirl')
      s.twirlUntil = s.now + 1.3
      s.spin = Math.PI * 2
      s.spinSpeed = (Math.PI * 2) / 1.3
      play('Walk', { speed: 1.6 })
      sfx.binky()
    }
  }

  const idleAct = (camera) => {
    const s = b.current
    const g = useGame.getState()
    const r = Math.random()
    s.nextIdleAct = s.now + 3.5 + Math.random() * 4.5
    if (g.night && g.scene === 'bedroom' && Math.random() < 0.55) {
      // Late at night the bunny mostly dozes in a loaf.
      hold('Sit', 6 + Math.random() * 4)
      s.loaf = true
      s.nextIdleAct = s.now + 8
      if (Math.random() < 0.5) sfx.yawn()
      return
    }
    if (g.scene === 'bedroom' && Math.random() < 0.12) {
      // Visit one of the plushes on the bed and give it a nuzzle.
      const [px, pz, ax, az] = pick([
        [1.0, -0.5, 0.68, -0.38], // duck
        [-1.12, -0.98, -1.0, -0.62], // Hello Kitty
        [-0.5, -1.0, -0.45, -0.62] // Miffy
      ])
      goTo(ax, az, {
        speed: 0.5,
        arrive: 0.08,
        onArrive: () => {
          world.bunny.yaw = Math.atan2(px - world.bunny.pos.x, pz - world.bunny.pos.z)
          fx.burst('heart', _v.set((px + ax) / 2, 0.3, (pz + az) / 2), 3, { scale: 0.8 })
          react('Yes', { speed: 0.8 })
        }
      })
      return
    }
    if (r < 0.32) {
      // Wander, mostly staying near the middle where it is easy to pet.
      const bun = world.bunny
      const x = THREE.MathUtils.clamp(bun.pos.x + (Math.random() - 0.5) * 1.2, -0.8, 0.8)
      const z = THREE.MathUtils.clamp(bun.pos.z + (Math.random() - 0.5) * 0.9, -0.5, 0.6)
      goTo(x, z, { speed: 0.45 })
    } else if (r < 0.58) {
      s.lookMode = 'point'
      s.lookTarget.set(world.bunny.pos.x + (Math.random() - 0.5) * 3, Math.random() * 0.8, world.bunny.pos.z + (Math.random() - 0.3) * 3)
      s.lookUntil = s.now + 2 + Math.random() * 2
    } else if (r < 0.78) {
      s.lookMode = 'camera'
      s.lookUntil = s.now + 2.5
      if (g.needs.joy > 70 && Math.random() < 0.5) react('Yes', { speed: 0.9 })
    } else if (r < 0.9) {
      react('Wave', { speed: 0.7 }) // paw-washing groom
    } else {
      hold('Sit', 4 + Math.random() * 3)
      s.loaf = true
    }
  }

  // ---------------- petting ----------------

  const classify = (point) => {
    let best = null
    let bestD = Infinity
    for (const name in ZONE_OF_BONE) {
      const bone = bones[name]
      if (!bone) continue
      bone.getWorldPosition(_v2)
      const d = _v2.distanceToSquared(point)
      if (d < bestD) { bestD = d; best = name }
    }
    let zone = ZONE_OF_BONE[best] || 'back'
    if (zone === 'head') {
      const lp = group.current.worldToLocal(_v.copy(point))
      const hp = group.current.worldToLocal(bones.Head.getWorldPosition(_v2))
      if (lp.z > hp.z + 0.06) zone = 'face'
    }
    return zone
  }

  const petTick = (zone, point) => {
    const s = b.current
    const g = useGame.getState()
    const pref = PREFS[zone]
    if (s.now < s.upsetUntil) return
    if (pref < 0) {
      s.annoy += 1
      fx.burst('grump', point, 1)
      sfx.nope()
      if (s.annoy >= 3) upset(zone)
      else toast(DISLIKE_LINES[zone], 2.5)
      return
    }
    s.streak += 1
    s.lastTickAt = s.now
    const brush = g.tool === 'brush'
    g.change({ joy: 1.8 * pref, bond: 0.14 * pref })
    g.progress(brush ? 'brush' : 'pet')
    s.squashV -= 0.6
    if (brush) {
      const cleanGain = zone === 'back' || zone === 'head' ? 1.6 : 0.6
      g.change({ clean: cleanGain })
      fx.burst('puff', point, 2)
      if (s.streak % 3 === 0) fx.burst('sparkle', point, 2, { scale: 0.7 })
      sfx.brush()
      if (g.needs.clean >= 99.5 && s.streak > 3) toast('{n}\'s coat is gleaming', 6)
    } else {
      fx.burst('heart', point, zone === 'face' || zone === 'head' ? 2 : 1)
      buzz(6)
      sfx.pet(Math.floor(s.streak / 3) % 11)
    }
    if (s.streak === 4) toast(pick(LIKE_LINES[zone]), 4)
    if (s.streak === 18) { toast('{n} is melting...', 0); sfx.purr() }
    if (s.streak > 18 && s.streak % 10 === 0) sfx.purr()
    if (s.streak === 40) toast('Tooth purrs! The happiest bunny sound', 0)
    if (g.hint === 'pet' && s.streak >= 8) g.setHint('tools')
    if (s.streak >= 30 && g.needs.joy >= 95 && s.now - s.lastBinky > 25) binky()
  }

  const onPointerDown = (e) => {
    e.stopPropagation()
    const s = b.current
    const g = useGame.getState()
    world.gesture = null // touching the bunny is never a ball swipe
    world.holdCamera = false
    s.nextIdleAct = s.now + 6
    if (g.tool === 'treat') {
      if (s.state !== 'eat') {
        startEat({ kind: 'treat', treat: g.treatKind, hand: true })
        sfx.pop()
      }
      return
    }
    if (s.state === 'move' && !s.follow) toIdle()
    s.petDown = true
    world.petting = true
    if (world.controls) world.controls.enabled = false
    s.downAt = s.now
    s.downPoint.copy(e.point)
    s.lastPoint.copy(e.point)
    s.lastTime = s.now
    s.moved = 0
    s.accum = 0
    s.speedAvg = 0
    s.zone = classify(e.point)
    group.current.worldToLocal(s.touchLocal.copy(e.point))
  }

  const onPointerMove = (e) => {
    const s = b.current
    if (!s.petDown) return
    e.stopPropagation()
    const dt = Math.max(1 / 120, s.now - s.lastTime)
    const d = e.point.distanceTo(s.lastPoint)
    if (d < 0.003) return
    s.speedAvg = THREE.MathUtils.lerp(s.speedAvg, d / dt, 0.35)
    s.lastPoint.copy(e.point)
    s.lastTime = s.now
    s.moved += d
    s.accum += d
    s.zone = classify(e.point)
    group.current.worldToLocal(s.touchLocal.copy(e.point))
    if (s.speedAvg > ROUGH_SPEED && s.moved > 0.15) {
      s.speedAvg = 0
      s.annoy += 1
      if (s.annoy >= 3) upset('rough')
      else { toast(DISLIKE_LINES.rough, 2.5); sfx.nope() }
      return
    }
    if (s.accum > TICK_DIST) {
      s.accum = 0
      petTick(s.zone, e.point)
    }
  }

  useEffect(() => {
    const up = () => {
      const s = b.current
      if (!s.petDown) return
      s.petDown = false
      world.petting = false
      // A quick tap (not a stroke).
      if (s.moved < 0.03 && s.now - s.downAt < 0.35 && s.now > s.upsetUntil) {
        const zone = s.zone
        if (zone === 'face') {
          sfx.boop()
          buzz(15)
          fx.burst('heart', s.downPoint, 3)
          s.squashV -= 1.4
          useGame.getState().change({ joy: 2, bond: 0.3 })
          useGame.getState().progress('boop')
          toast(pick(['Boop!', 'Nose boop!', '*wiggles nose*']), 1)
        } else if (PREFS[zone] > 0) {
          fx.burst('heart', s.downPoint, 1)
          sfx.pet(0)
          s.squashV -= 0.8
          useGame.getState().change({ joy: 0.8 })
          if (useGame.getState().hint === 'pet') toast('Try stroking slowly instead of tapping', 4)
        } else {
          petTick(zone, s.downPoint)
        }
      }
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- per-frame update ----------------

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = b.current
    s.now = state.clock.elapsedTime
    const now = s.now
    const g = useGame.getState()
    const bun = world.bunny
    const camera = state.camera

    // Commands from the UI.
    while (world.commands.length) {
      const cmd = world.commands.shift()
      if (cmd.type === 'trick') runTrick(cmd.id, camera)
      else if (cmd.type === 'goto') {
        s.eat = null
        s.munch = 0
        s.lookMode = 'camera'
        s.lookUntil = now + 3
        goTo(cmd.x, cmd.z, {
          speed: 0.9,
          clip: 'Run',
          clipSpeed: 0.9,
          onArrive: () => {
            bun.yaw = Math.atan2(camera.position.x - bun.pos.x, camera.position.z - bun.pos.z)
            fx.burst('heart', bun.head, 3)
            sfx.happy()
            react('Yes')
          }
        })
      } else if (cmd.type === 'pose') {
        // Photo pose: stop, face the camera and look cute.
        s.eat = null
        s.munch = 0
        bun.yaw = Math.atan2(camera.position.x - bun.pos.x, camera.position.z - bun.pos.z)
        s.lookMode = 'camera'
        s.lookUntil = now + 4
        s.nextIdleAct = now + 6
        hold('Idle', 2.5)
        play('Idle')
      }
    }

    // First-visit greeting: hop toward the camera.
    if (!s.greeted && world.started) {
      s.greeted = true
      if (g.firstVisit) runTrick('come', camera)
      else { s.lookMode = 'camera'; s.lookUntil = now + 3; react('Yes') }
    }

    if (s.petDown && now - s.lastTickAt > 1.5) s.streak = Math.max(0, s.streak - 1)
    if (!s.petDown && now - s.lastTickAt > 2) s.streak = 0
    if (now - s.lastTickAt > 2) s.annoy = Math.max(0, s.annoy - dt * 0.5)
    const dozing = g.night && s.state === 'hold' && s.loaf
    g.setBubble(now < s.tiredUntil || dozing ? 'tired' : s.streak >= 18 ? 'melting' : null)

    if (s.spin > 0) {
      const step = Math.min(s.spin, s.spinSpeed * dt)
      bun.yaw += step
      s.spin -= step
    }

    switch (s.state) {
      case 'idle': {
        if (s.clip !== 'Idle') play('Idle')
        if (s.petDown) break
        if (g.items.length) {
          let best = null
          let bd = Infinity
          for (const it of g.items) {
            if (!it.landed) continue
            const d = (it.x - bun.pos.x) ** 2 + (it.z - bun.pos.z) ** 2
            if (d < bd) { bd = d; best = it }
          }
          if (best) {
            const reach = best.kind === 'treat' ? 0.24 : 0.36
            goTo(best.x, best.z, { speed: 0.75, clip: 'Run', clipSpeed: 0.8, arrive: reach, onArrive: () => startEat(best) })
            break
          }
        }
        const ball = world.ball
        if (ball.active && now > s.tiredUntil && now > s.nudgeCooldown && ball.vel.length() < 1.6) {
          goTo(ball.pos.x, ball.pos.z, {
            speed: 1.15,
            clip: 'Run',
            arrive: 0.24,
            follow: () => world.ball.pos,
            onArrive: () => (world.ball.active ? nudgeBall() : toIdle())
          })
          break
        }
        if (now > s.nextIdleAct) idleAct(camera)
        break
      }
      case 'move': {
        const target = s.follow ? s.follow() : s.moveTarget
        if (s.follow) {
          if (!world.ball.active) { toIdle(); break }
          s.moveTarget.copy(target)
          clampToBounds(s.moveTarget, 0.05)
        }
        const dx = s.moveTarget.x - bun.pos.x
        const dz = s.moveTarget.z - bun.pos.z
        const dist = Math.hypot(dx, dz)
        if (dist < s.arrive) {
          const cb = s.onArrive
          toIdle()
          cb?.()
          break
        }
        const desired = Math.atan2(dx, dz)
        bun.yaw = lerpAngle(bun.yaw, desired, 1 - Math.exp(-8 * dt))
        const off = Math.abs(angleDiff(bun.yaw, desired))
        if (off < 1.1) {
          const v = s.speed * (1 - off / 1.6)
          bun.pos.x += Math.sin(bun.yaw) * v * dt
          bun.pos.z += Math.cos(bun.yaw) * v * dt
          clampToBounds(bun.pos, 0.1)
        }
        if (now - s.stateStart > 7) toIdle()
        break
      }
      case 'eat': {
        s.munch = 1
        if (now > s.nextMunch) {
          s.nextMunch = now + 0.32
          const mouth = mouthPos(_v)
          if (s.eat.kind === 'water') { sfx.drink(); fx.burst('drop', mouth, 2) }
          else { sfx.munch(); fx.burst('crumb', mouth, 3) }
        }
        if (now > s.eatUntil) finishEat()
        break
      }
      case 'react': {
        if (s.clipDone || now - s.stateStart > 3) {
          const after = s.afterReact
          s.afterReact = null
          toIdle()
          after?.()
        }
        break
      }
      case 'hold': {
        if (now > s.holdUntil) toIdle()
        break
      }
      case 'twirl': {
        if (now > s.twirlUntil) {
          sfx.happy()
          fx.burst('heart', bun.head, 5)
          react('Yes')
        }
        break
      }
      default:
        toIdle()
    }

    // Transform.
    const grp = group.current
    grp.position.copy(bun.pos)
    grp.rotation.y = bun.yaw

    // Squash & stretch spring (pets make the bunny squish down a little).
    s.squashV += (-s.squash * 140 - s.squashV * 11) * dt
    s.squash += s.squashV * dt
    const sq = THREE.MathUtils.clamp(s.squash, -0.12, 0.12)
    body.current.scale.set(1 - sq * 0.6, 1 + sq, 1 - sq * 0.6)

    // The mixer only writes a bone when its animated value changes, so undo
    // last frame's procedural offsets before updating, then snapshot the
    // clean animated pose for next frame.
    for (const name in poseBase) {
      const bone = bones[name]
      if (!bone) continue
      bone.quaternion.copy(poseBase[name].q)
      bone.scale.copy(poseBase[name].s)
    }
    mixer.update(dt)
    for (const name of OVERRIDDEN) {
      const bone = bones[name]
      if (!bone) continue
      poseBase[name] ??= { q: new THREE.Quaternion(), s: new THREE.Vector3() }
      poseBase[name].q.copy(bone.quaternion)
      poseBase[name].s.copy(bone.scale)
    }

    // ---- procedural layers on top of the animation ----
    const liked = s.petDown && PREFS[s.zone] > 0 && now >= s.upsetUntil
    const melt = Math.min(1, s.streak / 18)
    const sleepy = now < s.tiredUntil || (s.state === 'hold' && s.loaf) || (g.night && s.state === 'idle' && !s.petDown)
    const upsetNow = now < s.upsetUntil
    const k = (rate) => 1 - Math.exp(-rate * dt)

    const squintTarget = upsetNow ? 1.15 : liked ? THREE.MathUtils.lerp(0.55, 0.1, melt) : sleepy ? 0.3 : g.needs.joy > 85 ? 0.8 : 1
    s.squint = THREE.MathUtils.lerp(s.squint, squintTarget, k(8))
    const earTarget = upsetNow ? 1.0 : liked ? 0.35 + 0.65 * melt : sleepy ? 0.6 : 0
    s.earBack = THREE.MathUtils.lerp(s.earBack, earTarget, k(5))
    const blushTarget = liked ? 0.35 + 0.4 * melt : g.needs.joy > 80 ? 0.35 : 0
    s.blush = THREE.MathUtils.lerp(s.blush, blushTarget, k(4))
    blushMat.opacity = s.blush
    s.eatPitch = THREE.MathUtils.lerp(s.eatPitch, s.state === 'eat' ? 0.42 : 0, k(6))
    if (s.state !== 'eat') s.munch = 0

    // Where should the head point?
    let yawT = 0
    let pitchT = 0
    let rollT = 0
    if (liked) {
      // Nuzzle up into the hand, tilting toward it.
      yawT = THREE.MathUtils.clamp(s.touchLocal.x * 2.5, -0.5, 0.5)
      pitchT = 0.12 + 0.12 * melt
      rollT = THREE.MathUtils.clamp(-s.touchLocal.x * 3, -0.3, 0.3)
    } else if (now < s.lookUntil || s.lookMode === 'ball') {
      const target = s.lookMode === 'camera' ? camera.position : s.lookTarget
      _v.copy(target).sub(bun.head)
      _v.applyAxisAngle(_v2.set(0, 1, 0), -bun.yaw)
      yawT = THREE.MathUtils.clamp(Math.atan2(_v.x, _v.z), -0.8, 0.8)
      pitchT = THREE.MathUtils.clamp(Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.35, 0.35)
    }
    if (world.ball.active && s.state === 'idle' && !s.petDown && now >= s.lookUntil) {
      _v.copy(world.ball.pos).sub(bun.head)
      _v.applyAxisAngle(_v2.set(0, 1, 0), -bun.yaw)
      yawT = THREE.MathUtils.clamp(Math.atan2(_v.x, _v.z), -0.8, 0.8)
      pitchT = THREE.MathUtils.clamp(Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.35, 0.2)
    }
    if (s.state !== 'idle' && s.state !== 'hold' && !liked) { yawT *= 0.3; pitchT *= 0.3 }
    s.look.yaw = THREE.MathUtils.lerp(s.look.yaw, yawT, k(5))
    s.look.pitch = THREE.MathUtils.lerp(s.look.pitch, pitchT, k(5))
    s.look.roll = THREE.MathUtils.lerp(s.look.roll, rollT, k(5))

    grp.updateMatrixWorld(true)
    const gq = grp.getWorldQuaternion(new THREE.Quaternion())
    if (bones.Head) {
      _e.set(-s.look.pitch + s.eatPitch, s.look.yaw, s.look.roll, 'YXZ')
      rotateBoneInBunnyFrame(bones.Head, gq, _e)
    }

    // Ears: relax backward when content, little random flicks otherwise.
    if (now > s.nextEarTwitch) {
      s.nextEarTwitch = now + 1.5 + Math.random() * 4
      s.earTwitch[Math.random() < 0.5 ? 0 : 1] = 1
    }
    ;['L', 'R'].forEach((side, i) => {
      const ear = bones[`Ear_${side}`]
      if (!ear) return
      s.earTwitch[i] = Math.max(0, s.earTwitch[i] - dt * 4)
      const twitch = Math.sin(s.earTwitch[i] * Math.PI * 3) * 0.25 * s.earTwitch[i]
      const sx = side === 'L' ? 1 : -1
      _e.set(-s.earBack * 0.55 + twitch, 0, -sx * s.earBack * 0.22, 'XYZ')
      ear.updateWorldMatrix(true, false)
      rotateBoneInBunnyFrame(ear, gq, _e)
    })

    // Jaw: munching while eating, plus a constant tiny nose wiggle.
    if (bones.Jaw) {
      const wiggle = Math.sin(now * 22) * 0.04 * (Math.sin(now * 0.9) > 0.2 ? 1 : 0)
      const chew = s.munch ? Math.abs(Math.sin(now * 14)) * 0.22 : 0
      _e.set(chew + wiggle, 0, 0, 'XYZ')
      rotateBoneInBunnyFrame(bones.Jaw, gq, _e)
    }

    // Happy tail wiggle.
    if (bones.Tail && (liked || s.state === 'move')) {
      _e.set(0, Math.sin(now * 18) * 0.25, 0, 'XYZ')
      rotateBoneInBunnyFrame(bones.Tail, gq, _e)
    }

    // Eyes.
    if (bones.Eye_L) bones.Eye_L.scale.y *= s.squint
    if (bones.Eye_R) bones.Eye_R.scale.y *= s.squint

    bones.Head?.getWorldPosition(bun.head)

    // A scruffy coat looks a little dull.
    s.dirtyTimer -= dt
    if (s.dirtyTimer <= 0) {
      s.dirtyTimer = 0.5
      const dirt = Math.max(0, 1 - g.needs.clean / 60) * 0.5
      for (const m of furMats) m.color.copy(m.userData.base).lerp(DIRTY, dirt)
    }
  })

  return (
    <group ref={group} onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
      <group ref={body} scale={SCALE}>
        <primitive object={model} />
      </group>
      <Bubble />
    </group>
  )
}

function Bubble() {
  const icon = useGame((s) => {
    if (s.bubble === 'tired') return 'zzz'
    if (s.bubble === 'melting') return 'heart'
    if (s.needs.food < 25) return 'carrot'
    if (s.needs.water < 25) return 'drop'
    if (s.needs.clean < 20) return 'brush'
    return null
  })
  if (!icon) return null
  return (
    <Html position={[0, 0.95, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`bubble bubble-${icon}`}>
        {icon === 'zzz' ? <span className="zzz">z<small>z</small><small>z</small></span> : <Icon name={icon} size={22} />}
      </div>
    </Html>
  )
}

useGLTF.preload('/bunny.glb')
