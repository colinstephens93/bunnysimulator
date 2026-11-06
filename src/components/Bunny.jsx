import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const Bunny = forwardRef(({ comfort = 40, irritation = 10, hunger = 30, thirst = 25, cleanliness = 70, bond = 40, onZoneHit, pose = 'stand', called = false }, ref) => {
  const group = useRef()
  const [currentAnim, setCurrentAnim] = useState('Idle')
  const [comeToward, setComeToward] = useState(0)
  const [holdingSit, setHoldingSit] = useState(false)

  const { scene, animations } = useGLTF('/bunny.glb')
  const { actions, mixer } = useAnimations(animations, group)

  // Permanent blink layers
  useEffect(() => {
    const blinkL = actions['IdleBlink_Eye_L']
    const blinkR = actions['IdleBlink_Eye_R']
    if (blinkL) {
      blinkL.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play()
    }
    if (blinkR) {
      blinkR.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play()
    }
    return () => {
      blinkL?.stop()
      blinkR?.stop()
    }
  }, [actions])

  const playClip = useCallback((name, { loop = false, fade = 0.25, hold = false } = {}) => {
    if (!actions[name]) return
    const next = actions[name]
    const current = actions[currentAnim]

    if (current && current !== next) {
      current.fadeOut(fade)
    }

    next.reset()
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
    next.clampWhenFinished = !loop
    next.fadeIn(fade).play()

    setCurrentAnim(name)
    setHoldingSit(hold)
  }, [actions, currentAnim])

  // Default idle
  useEffect(() => {
    playClip('Idle', { loop: true })
  }, []) // eslint-disable-line

  // One-shot finished → return to Idle (unless sitting hold)
  useEffect(() => {
    const onFinished = (e) => {
      if (holdingSit) return
      if (e.action === actions[currentAnim] && currentAnim !== 'Idle') {
        playClip('Idle', { loop: true })
      }
    }
    mixer.addEventListener('finished', onFinished)
    return () => mixer.removeEventListener('finished', onFinished)
  }, [mixer, actions, currentAnim, holdingSit, playClip])

  // Imperative API
  useImperativeHandle(ref, () => ({
    triggerBinky: () => {
      setHoldingSit(false)
      playClip('Jump', { loop: false })
    },
    triggerThump: () => {
      setHoldingSit(false)
      playClip('No', { loop: false })
    },
    come: () => setComeToward(1)
  }))

  // Called from App
  useEffect(() => {
    if (called) setComeToward(1)
  }, [called])

  // Zone reactions
  const handleHead = () => {
    onZoneHit?.('head')
    setHoldingSit(false)
    playClip('Yes', { loop: false })
  }
  const handleHind = () => {
    onZoneHit?.('hind')
    setHoldingSit(false)
    playClip('No', { loop: false })
  }

  // Pose / tricks from App
  useEffect(() => {
    if (pose === 'sit') {
      playClip('Sit', { loop: false, hold: true })
    } else if (pose === 'stand' && holdingSit) {
      setHoldingSit(false)
      playClip('Idle', { loop: true })
    }
  }, [pose]) // eslint-disable-line

  // Come / walk toward user
  useFrame((_, delta) => {
    if (comeToward > 0) {
      setComeToward(v => Math.max(0, v - delta * 0.7))
      if (currentAnim !== 'Walk' && currentAnim !== 'Run') {
        playClip('Walk', { loop: true })
      }
      if (group.current) {
        group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0.55, 0.05)
      }
    } else if (group.current && group.current.position.z !== 0) {
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0, 0.03)
      if (currentAnim === 'Walk' || currentAnim === 'Run') {
        playClip('Idle', { loop: true })
      }
    }
  })

  // Random idle fidget
  useEffect(() => {
    let timeout
    const schedule = () => {
      const delay = 7000 + Math.random() * 7000
      timeout = setTimeout(() => {
        if (currentAnim === 'Idle' && !holdingSit) {
          const fidget = Math.random() > 0.5 ? 'Wave' : 'Yes'
          playClip(fidget, { loop: false })
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [currentAnim, holdingSit, playClip])

  return (
    <group ref={group} position={[0, 0, 0]} scale={1.0}>
      {/* Hit zones — kept identical */}
      <mesh position={[0, 0.55, 0.25]} visible={false} onPointerDown={handleHead}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[0, 0.25, 0]} visible={false} onPointerDown={() => onZoneHit?.('back')}>
        <boxGeometry args={[0.4, 0.25, 0.5]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[0, 0.1, -0.3]} visible={false} onPointerDown={handleHind}>
        <boxGeometry args={[0.3, 0.15, 0.25]} />
        <meshBasicMaterial />
      </mesh>

      <primitive object={scene} />
    </group>
  )
})

useGLTF.preload('/bunny.glb')

export default Bunny
