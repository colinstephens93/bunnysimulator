import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGame } from '../store'
import { world, clampToBounds } from '../world'
import { fx } from './Particles'
import { SCALE, rotateBoneInBunnyFrame } from './Bunny'
import { bunnyModel } from '../bunnyModels'

// Two bunny friends that live in the garden. They keep the player's bunny
// company and copy what it does: eat when it eats, sit when it sits, hop when
// it binkies, wave back, come over when it is being petted or gets upset.

const FRIENDS = [
  { id: 'biscuit', name: 'Biscuit', fur: '#a7a7b3', light: '#e4e2ea', angle: 2.3, dist: 0.95, delay: 0.5 },
  { id: 'cocoa', name: 'Cocoa', fur: '#7a5238', light: '#d8b998', angle: -2.2, dist: 1.1, delay: 1.1 }
]

const OVERRIDDEN = ['Head', 'Ear_L', 'Ear_R', 'Jaw']
const SEPARATION = 0.42 // bunnies keep at least this far apart
const REACT_COOLDOWN = 3.5

const _v = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _e = new THREE.Euler()

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
const rand = (a, b) => a + Math.random() * (b - a)

// Where each friend currently stands, so they can keep out of each other's way.
const positions = {}

// Friends chatter in toasts now and then, but never more than once in a while.
let lastToast = -100
let welcomed = false
function say(text, now, gap = 7) {
  if (now - lastToast < gap) return
  lastToast = now
  useGame.getState().toast(text.replaceAll('{me}', useGame.getState().name))
}

let shadowTexture = null
function blobShadow() {
  if (shadowTexture) return shadowTexture
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32)
  grad.addColorStop(0, 'rgba(58,32,16,0.5)')
  grad.addColorStop(1, 'rgba(58,32,16,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  shadowTexture = new THREE.CanvasTexture(c)
  return shadowTexture
}

export default function Friends() {
  return FRIENDS.map((cfg) => <Friend key={cfg.id} cfg={cfg} />)
}

function Friend({ cfg }) {
  const gltf = useGLTF(bunnyModel(useGame((s) => s.settings.bunnyModel)).url)
  const group = useRef()
  const lowPower = useGame((s) => s.settings.lowPower)

  const { model, bones } = useMemo(() => {
    const model = skeletonClone(gltf.scene)
    model.rotation.y = Math.PI // the GLB faces -Z
    const bones = {}
    model.traverse((o) => {
      if (o.isBone) bones[o.name] = o
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        const list = Array.isArray(o.material) ? o.material : [o.material]
        const next = list.map((m) => {
          if (m.name.startsWith('Fur')) {
            return new THREE.MeshPhysicalMaterial({
              name: m.name,
              color: new THREE.Color(m.name === 'Fur_Cream' ? cfg.fur : cfg.light),
              roughness: 0.9,
              sheen: 1,
              sheenRoughness: 0.5,
              sheenColor: new THREE.Color('#fff3df'),
              side: THREE.DoubleSide
            })
          }
          return m.clone()
        })
        o.material = Array.isArray(o.material) ? next : next[0]
      }
    })
    return { model, bones }
  }, [gltf, cfg])

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  const poseBase = useMemo(() => ({}), [model])
  const actions = useMemo(() => {
    const a = {}
    gltf.animations.forEach((clip) => { a[clip.name] = mixer.clipAction(clip) })
    return a
  }, [mixer, gltf])

  const st = useRef(null)
  if (!st.current) {
    const bun = world.bunny.pos
    const pos = new THREE.Vector3(bun.x + Math.sin(cfg.angle) * cfg.dist, 0, bun.z + Math.cos(cfg.angle) * cfg.dist)
    clampToBounds(pos, 0.2)
    positions[cfg.id] = pos
    st.current = {
      pos,
      yaw: Math.atan2(bun.x - pos.x, bun.z - pos.z),
      state: 'idle', stateStart: 0, clip: null, clipDone: false,
      mode: 'social', want: 'social', wantAt: 0,
      slotAngle: cfg.angle, slotDist: cfg.dist, nextAct: 2 + Math.random() * 3,
      target: new THREE.Vector3(), speed: 0.45, arrive: 0.2, onArrive: null, trail: false,
      holdUntil: 0, lookUntil: 0, lookTarget: new THREE.Vector3(), look: { yaw: 0, pitch: 0 },
      spin: 0, spinSpeed: 0, eatPitch: 0, munch: 0, nextMunch: 0,
      earTwitch: [0, 0], nextEarTwitch: 1 + Math.random() * 3,
      seen: {}, pending: [], lastReact: -10, petSince: 0, nodded: false,
      now: 0
    }
  }

  const play = (name, { loop = true, fade = 0.25, speed = 1 } = {}) => {
    const s = st.current
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
    const s = st.current
    actions.IdleBlink_Eye_L?.play()
    actions.IdleBlink_Eye_R?.play()
    play('Idle')
    if (actions.Idle) actions.Idle.time = Math.random() * 3 // so the bunnies don't breathe in unison
    const onFinished = (e) => { if (e.action === actions[s.clip]) s.clipDone = true }
    mixer.addEventListener('finished', onFinished)
    fx.burst('sparkle', _v.set(s.pos.x, 0.25, s.pos.z), 6, { scale: 0.8 })
    if (!welcomed) {
      welcomed = true
      useGame.getState().toast('Biscuit and Cocoa came to play in the garden')
    }
    return () => {
      mixer.removeEventListener('finished', onFinished)
      mixer.stopAllAction()
      delete positions[cfg.id]
    }
  }, [mixer, actions]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- behaviour helpers ----------------

  const setState = (state) => {
    const s = st.current
    s.state = state
    s.stateStart = s.now
  }
  const toIdle = () => {
    const s = st.current
    setState('idle')
    s.trail = false
    s.onArrive = null
    s.munch = 0
    play('Idle', { fade: 0.35 })
  }
  const goTo = (x, z, { speed = 0.45, clip = 'Walk', arrive = 0.15, onArrive = null, trail = false } = {}) => {
    const s = st.current
    s.target.set(x, 0, z)
    clampToBounds(s.target, 0.12)
    s.speed = speed
    s.arrive = arrive
    s.onArrive = onArrive
    s.trail = trail
    setState('move')
    play(clip, { speed: clip === 'Run' ? 0.9 : 1 })
  }
  const react = (clip, opts) => {
    setState('react')
    play(clip, { loop: false, fade: 0.2, ...opts })
  }
  const slot = (out, dist = st.current.slotDist) => {
    const s = st.current
    const m = world.bunny.pos
    return out.set(m.x + Math.sin(s.slotAngle) * dist, 0, m.z + Math.cos(s.slotAngle) * dist)
  }
  const goToSlot = (dist, onArrive) => {
    const s = st.current
    slot(_v, dist)
    clampToBounds(_v, 0.12)
    const far = Math.hypot(_v.x - s.pos.x, _v.z - s.pos.z) > 1.6
    goTo(_v.x, _v.z, { speed: far ? 0.9 : 0.5, clip: far ? 'Run' : 'Walk', arrive: 0.14, onArrive, trail: true })
    s.slotWanted = dist
  }

  // The main bunny just started something; decide how to answer it.
  const onEdge = (kind) => {
    const s = st.current
    const bun = world.bunny
    const at = s.now + cfg.delay + Math.random() * 0.5
    s.pending.push({ at, kind, spin: bun.spinning })
  }

  const answer = (p) => {
    const s = st.current
    s.lastReact = s.now
    if (p.kind === 'jump') {
      if (p.spin) {
        s.spin = Math.PI * 2
        s.spinSpeed = (Math.PI * 2) / 0.8
        say(`${cfg.name} copied the binky!`, s.now)
      }
      fx.burst('sparkle', _v.set(s.pos.x, 0.3, s.pos.z), 6, { scale: 0.8 })
      react('Jump', { speed: 1.05 })
    } else if (p.kind === 'wave') {
      react('Wave', { speed: 0.8 })
      say(`${cfg.name} waved back`, s.now)
    } else if (p.kind === 'pet') {
      s.petSince = s.now
      s.nodded = false
      s.slotDist = 0.55
      goToSlot(0.55)
      say(`${cfg.name} wants cuddles too`, s.now)
    } else if (p.kind === 'upset') {
      s.slotDist = 0.45
      goToSlot(0.45, () => {
        fx.burst('heart', _v.set(s.pos.x, 0.45, s.pos.z), 3)
        react('Yes', { speed: 0.8 })
      })
      say(`${cfg.name} came to cheer {me} up`, s.now)
    }
  }

  const enterMode = (mode) => {
    const s = st.current
    s.mode = mode
    if (mode === 'eat') {
      say(`${cfg.name} wants a nibble too`, s.now)
      goToSlot(0.55, () => {
        const m = world.bunny.pos
        s.yaw = Math.atan2(m.x - s.pos.x, m.z - s.pos.z)
        setState('eat')
        s.nextMunch = s.now
        play('Idle', { fade: 0.3 })
      })
    } else if (mode === 'sit') {
      say(`${cfg.name} sat down next to {me}`, s.now)
      goToSlot(0.8, () => {
        setState('hold')
        play('Sit', { loop: false, fade: 0.3 })
      })
    } else {
      toIdle()
    }
  }

  const idleAct = () => {
    const s = st.current
    const r = Math.random()
    s.nextAct = s.now + rand(4, 9)
    if (r < 0.4) {
      // Wander a little around the player's bunny.
      s.slotAngle = cfg.angle + rand(-0.9, 0.9)
      s.slotDist = cfg.dist + rand(-0.2, 0.3)
    } else if (r < 0.7) {
      s.lookTarget.set(s.pos.x + rand(-2, 2), rand(0, 0.6), s.pos.z + rand(-1, 2))
      s.lookUntil = s.now + rand(1.5, 3)
    } else if (r < 0.85) {
      react('Wave', { speed: 0.7 }) // paw-washing
    } else {
      react('Yes', { speed: 0.9 })
    }
  }

  // ---------------- per-frame update ----------------

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    const now = state.clock.elapsedTime
    s.now = now
    const bun = world.bunny
    const k = (rate) => 1 - Math.exp(-rate * dt)

    // Watch what the player's bunny is doing.
    const seen = {
      eat: bun.state === 'eat',
      sit: bun.state === 'hold' && bun.clip === 'Sit',
      jump: bun.clip === 'Jump' && bun.state === 'react',
      wave: bun.clip === 'Wave' && bun.state === 'react',
      pet: bun.petting,
      upset: bun.upset
    }
    for (const kind of ['jump', 'wave', 'pet', 'upset']) {
      if (seen[kind] && !s.seen[kind] && now - s.lastReact > REACT_COOLDOWN) onEdge(kind)
    }
    s.seen = seen

    const want = seen.eat ? 'eat' : seen.sit ? 'sit' : 'social'
    if (want !== s.want) {
      s.want = want
      s.wantAt = now + cfg.delay + Math.random() * 0.6
    }
    if (s.mode !== s.want && now >= s.wantAt) {
      s.pending.length = 0
      enterMode(s.want)
    }

    // Quick reactions only happen while just hanging out.
    if (s.pending.length) {
      const p = s.pending[0]
      if (s.mode !== 'social' || now - p.at > 2) s.pending.shift()
      else if (now >= p.at && (s.state === 'idle' || s.state === 'move')) {
        s.pending.shift()
        answer(p)
      }
    }

    switch (s.state) {
      case 'idle': {
        if (s.clip !== 'Idle') play('Idle')
        if (s.mode !== 'social') { enterMode(s.mode); break } // e.g. a walk that timed out
        slot(_v)
        const d = Math.hypot(_v.x - s.pos.x, _v.z - s.pos.z)
        if (d > 0.35) goToSlot(s.slotDist)
        else if (now > s.nextAct) idleAct()
        break
      }
      case 'move': {
        if (s.trail) {
          slot(_v, s.slotWanted ?? s.slotDist)
          s.target.copy(_v)
          clampToBounds(s.target, 0.12)
        }
        const dx = s.target.x - s.pos.x
        const dz = s.target.z - s.pos.z
        const dist = Math.hypot(dx, dz)
        if (dist < s.arrive) {
          const cb = s.onArrive
          toIdle()
          cb?.()
          break
        }
        const desired = Math.atan2(dx, dz)
        s.yaw = lerpAngle(s.yaw, desired, k(8))
        const off = Math.abs(angleDiff(s.yaw, desired))
        if (off < 1.1) {
          const v = s.speed * (1 - off / 1.6)
          s.pos.x += Math.sin(s.yaw) * v * dt
          s.pos.z += Math.cos(s.yaw) * v * dt
        }
        if (now - s.stateStart > 7) toIdle()
        break
      }
      case 'eat': {
        s.munch = 1
        if (now > s.nextMunch) {
          s.nextMunch = now + 0.32
          fx.burst('crumb', _v.set(s.pos.x + Math.sin(s.yaw) * 0.2, 0.16, s.pos.z + Math.cos(s.yaw) * 0.2), 2)
        }
        break
      }
      case 'react': {
        if (s.clipDone || now - s.stateStart > 3) toIdle()
        break
      }
      case 'hold':
        break
      default:
        toIdle()
    }

    // After a while of petting, the friend gives a happy nod.
    if (bun.petting && s.petSince && !s.nodded && now - s.petSince > 3 && s.mode === 'social' && s.state === 'idle') {
      s.nodded = true
      fx.burst('heart', _v.set(s.pos.x, 0.45, s.pos.z), 2)
      react('Yes', { speed: 0.9 })
    }

    // Turn on the spot toward the player's bunny when standing around.
    if (s.state !== 'move' && s.spin <= 0) {
      s.yaw = lerpAngle(s.yaw, Math.atan2(bun.pos.x - s.pos.x, bun.pos.z - s.pos.z), k(2.5))
    }
    if (s.spin > 0) {
      const step = Math.min(s.spin, s.spinSpeed * dt)
      s.yaw += step
      s.spin -= step
    }

    // Keep out of each other's way (the friends give way to the player's bunny).
    for (const other of [bun.pos, ...Object.entries(positions).filter(([id]) => id !== cfg.id).map(([, p]) => p)]) {
      const dx = s.pos.x - other.x
      const dz = s.pos.z - other.z
      const d = Math.hypot(dx, dz)
      if (d < SEPARATION) {
        const push = (SEPARATION - d) * (other === bun.pos ? 1 : 0.5)
        const nx = d > 1e-4 ? dx / d : 1
        const nz = d > 1e-4 ? dz / d : 0
        s.pos.x += nx * push
        s.pos.z += nz * push
      }
    }
    clampToBounds(s.pos, 0.1)

    const grp = group.current
    grp.position.copy(s.pos)
    grp.rotation.y = s.yaw

    // Undo last frame's procedural offsets, run the animation, snapshot it.
    for (const name in poseBase) {
      const bone = bones[name]
      if (!bone) continue
      bone.quaternion.copy(poseBase[name].q)
    }
    mixer.update(dt)
    for (const name of OVERRIDDEN) {
      const bone = bones[name]
      if (!bone) continue
      poseBase[name] ??= { q: new THREE.Quaternion() }
      poseBase[name].q.copy(bone.quaternion)
    }

    // ---- procedural layers ----
    s.eatPitch = THREE.MathUtils.lerp(s.eatPitch, s.state === 'eat' ? 0.42 : 0, k(6))
    if (s.state !== 'eat') s.munch = 0

    // Look at the player's bunny, glancing elsewhere now and then.
    let yawT = 0
    let pitchT = 0
    const glance = now < s.lookUntil
    _v.copy(glance ? s.lookTarget : bun.head)
    bones.Head.getWorldPosition(_v2)
    _v.sub(_v2).applyAxisAngle(_v2.set(0, 1, 0), -s.yaw)
    yawT = THREE.MathUtils.clamp(Math.atan2(_v.x, _v.z), -0.8, 0.8)
    pitchT = THREE.MathUtils.clamp(Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.35, 0.35)
    if (s.state === 'move') { yawT *= 0.3; pitchT *= 0.3 }
    s.look.yaw = THREE.MathUtils.lerp(s.look.yaw, yawT, k(5))
    s.look.pitch = THREE.MathUtils.lerp(s.look.pitch, pitchT, k(5))

    grp.updateMatrixWorld(true)
    const gq = grp.getWorldQuaternion(new THREE.Quaternion())
    if (bones.Head) {
      _e.set(-s.look.pitch + s.eatPitch, s.look.yaw, 0, 'YXZ')
      rotateBoneInBunnyFrame(bones.Head, gq, _e)
    }

    if (now > s.nextEarTwitch) {
      s.nextEarTwitch = now + 1.5 + Math.random() * 4
      s.earTwitch[Math.random() < 0.5 ? 0 : 1] = 1
    }
    ;['L', 'R'].forEach((side, i) => {
      const ear = bones[`Ear_${side}`]
      if (!ear) return
      s.earTwitch[i] = Math.max(0, s.earTwitch[i] - dt * 4)
      const twitch = Math.sin(s.earTwitch[i] * Math.PI * 3) * 0.25 * s.earTwitch[i]
      _e.set(twitch, 0, 0, 'XYZ')
      ear.updateWorldMatrix(true, false)
      rotateBoneInBunnyFrame(ear, gq, _e)
    })

    if (bones.Jaw) {
      const wiggle = Math.sin(now * 22 + cfg.angle) * 0.04 * (Math.sin(now * 0.9 + cfg.angle) > 0.2 ? 1 : 0)
      const chew = s.munch ? Math.abs(Math.sin(now * 14)) * 0.22 : 0
      _e.set(chew + wiggle, 0, 0, 'XYZ')
      rotateBoneInBunnyFrame(bones.Jaw, gq, _e)
    }
  })

  return (
    <group ref={group}>
      <group scale={SCALE}>
        <primitive object={model} />
      </group>
      {!lowPower && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} renderOrder={1}>
          <circleGeometry args={[0.3, 24]} />
          <meshBasicMaterial map={blobShadow()} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
