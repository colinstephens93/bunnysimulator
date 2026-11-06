import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows, useProgress } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import Bunny from './components/Bunny'
import Bedroom from './components/Bedroom'
import Garden from './components/Garden'
import Particles, { fx } from './components/Particles'
import { Ball, Items, throwBall, dropTreat, flingBall, kickBall } from './components/Toys'
import UI from './components/UI'
import { useGame } from './store'
import { world, setScene as setWorldScene, startGesture } from './world'
import { initAudio, setMuted as setAudioMuted, setAudioScene, sfx } from './audio'

const _v = new THREE.Vector3()

// Keeps the orbit target gently following the bunny, and freezes orbiting
// while the player is stroking it.
function CameraRig() {
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useEffect(() => {
    world.controls = controls
  }, [controls])

  useEffect(() => {
    const portrait = size.width < size.height
    camera.fov = portrait ? 62 : 42
    camera.updateProjectionMatrix()
  }, [size, camera])

  useFrame((_, dt) => {
    if (!controls) return
    controls.enabled = !world.petting && !world.holdCamera
    const bun = world.bunny.pos
    _v.set(bun.x * 0.75, 0.3, bun.z * 0.75).sub(controls.target).multiplyScalar(1 - Math.exp(-2.5 * Math.min(dt, 0.05)))
    controls.target.add(_v)
    camera.position.add(_v)
  })
  return null
}

function BunnyShadow() {
  const ref = useRef()
  useFrame(() => {
    ref.current.position.set(world.bunny.pos.x, 0.004, world.bunny.pos.z)
  })
  return (
    <group ref={ref}>
      <ContactShadows scale={1.1} far={0.7} resolution={256} blur={2.2} opacity={0.55} color="#3a2010" />
    </group>
  )
}

// Invisible floor that receives taps (drop treat / toss ball) and swipes
// (fling the ball). The ball mesh starts gestures too, via world.gesture.
function PlaySurface({ scene }) {
  const b = world.bounds
  const w = b.maxX - b.minX + 0.6
  const d = b.maxZ - b.minZ + 0.6
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[(b.minX + b.maxX) / 2, 0.003, (b.minZ + b.maxZ) / 2]}
      onPointerDown={(e) => startGesture(e, false)}
      key={scene}
    >
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

const _right = new THREE.Vector3()
const _fwd = new THREE.Vector3()

function GestureHandler() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    // With the ball tool, a swipe anywhere flings the ball. This runs in the
    // capture phase, before OrbitControls and before 3D object handlers (which
    // may refine the gesture with a ground point, or cancel it on the bunny).
    const down = (e) => {
      if (useGame.getState().tool !== 'toy') return
      world.gesture = { x: e.clientX, y: e.clientY, t: performance.now(), point: null, onBall: false }
      world.holdCamera = true
      if (world.controls) world.controls.enabled = false
    }
    const up = (e) => {
      const g = world.gesture
      world.gesture = null
      world.holdCamera = false
      if (!g) return
      const dx = e.clientX - g.x
      const dy = e.clientY - g.y
      const dist = Math.hypot(dx, dy)
      const ms = Math.max(16, performance.now() - g.t)
      const tool = useGame.getState().tool
      if (dist < 10 && ms < 400) {
        if (g.onBall) kickBall(camera)
        else if (g.point && tool === 'treat') dropTreat(g.point)
        else if (g.point && tool === 'toy') throwBall(g.point)
        return
      }
      if ((tool === 'toy' || g.onBall) && dist > 25) {
        // Convert the screen swipe into a direction on the ground.
        camera.getWorldDirection(_fwd).setY(0).normalize()
        _right.crossVectors(_fwd, camera.up).normalize()
        const dir = _right.multiplyScalar(dx).addScaledVector(_fwd, -dy).normalize()
        const speed = THREE.MathUtils.clamp((dist / ms) * 2.4, 1.2, 5)
        flingBall(g.onBall ? null : g.point, dir, speed, camera)
      }
    }
    gl.domElement.addEventListener('pointerdown', down, true)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      gl.domElement.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [camera, gl])
  return null
}

function Scene() {
  const scene = useGame((s) => s.scene)
  return (
    <>
      {scene === 'bedroom' ? <Bedroom /> : <Garden />}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffc58f" position={[0, 2, -5]} scale={[8, 3, 1]} />
        <Lightformer form="circle" intensity={1.6} color="#fff1e0" position={[3, 3, 4]} scale={3} />
        <Lightformer form="rect" intensity={0.8} color="#ffc9d6" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[5, 2, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#fff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
      </Environment>
      <Bunny />
      <Items />
      <Ball />
      <Particles />
      <PlaySurface scene={scene} />
      <BunnyShadow />
      <GestureHandler />
    </>
  )
}

function StartScreen({ onStart }) {
  const { active, progress } = useProgress()
  const name = useGame((s) => s.name)
  const firstVisit = useGame((s) => s.firstVisit)
  const [draft, setDraft] = useState('')
  const ready = !active && progress >= 100
  const go = () => {
    if (!ready) return
    const n = draft.trim().slice(0, 16)
    if (firstVisit && n) useGame.getState().setName(n)
    onStart()
  }
  return (
    <div className="start">
      <div className="start-card">
        <div className="start-sun" />
        <h1>Golden Hour Bunny</h1>
        <p>{firstVisit ? 'A sleepy little bunny is waiting for a friend. What will you call them?' : `${name} missed you.`}</p>
        {firstVisit && (
          <input
            className="start-name"
            placeholder="Name your bunny"
            value={draft}
            maxLength={16}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
          />
        )}
        <button className="start-btn" disabled={!ready} onClick={go}>
          {ready ? (firstVisit ? `Meet ${draft.trim() || 'your bunny'}` : `Visit ${name}`) : `Loading ${Math.round(progress)}%`}
        </button>
        <small>Best with sound on</small>
      </div>
    </div>
  )
}

export default function App() {
  const [started, setStarted] = useState(false)
  const scene = useGame((s) => s.scene)
  const muted = useGame((s) => s.muted)

  // Needs tick once a second (paused while the tab is hidden).
  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      if (!document.hidden) useGame.getState().tick(1)
    }, 1000)
    return () => clearInterval(id)
  }, [started])

  useEffect(() => {
    const resume = () => initAudio()
    window.addEventListener('pointerdown', resume)
    return () => window.removeEventListener('pointerdown', resume)
  }, [])

  useEffect(() => setAudioMuted(muted), [muted])

  useEffect(() => {
    setWorldScene(scene)
    setAudioScene(scene)
  }, [scene])

  // Celebrate bond level-ups and completed daily goals.
  useEffect(() => useGame.subscribe((s, prev) => {
    if ((s.levelUp && s.levelUp !== prev.levelUp) || s.celebrate !== prev.celebrate) {
      sfx.levelUp()
      fx.burst('confetti', _v.copy(world.bunny.pos).setY(0.5), 70)
      fx.burst('heart', world.bunny.head, 10)
    }
  }), [])

  const start = () => {
    initAudio()
    world.started = true
    setStarted(true)
  }

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.05, 2.35], fov: 42, near: 0.05, far: 120 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[scene === 'bedroom' ? '#2b1a12' : '#ffd9b0']} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          target={[0, 0.3, 0.15]}
          minDistance={1.1}
          maxDistance={4.2}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.15}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
        />
        <CameraRig />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.85} luminanceSmoothing={0.25} />
          <Vignette offset={0.25} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
      {started ? <UI /> : <StartScreen onStart={start} />}
    </>
  )
}
