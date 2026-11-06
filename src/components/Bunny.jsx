import { useRef, forwardRef, useImperativeHandle, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const Bunny = forwardRef(({ comfort = 40, irritation = 10, hunger = 30, thirst = 25, cleanliness = 70, bond = 40, onZoneHit, pose = 'stand', called = false }, ref) => {
  const group = useRef()
  const [binky, setBinky] = useState(0)
  const [thump, setThump] = useState(0)
  const [comeToward, setComeToward] = useState(0)

  const { scene } = useGLTF('/bunny.glb')
  const model = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          child.material = child.material.clone()
          child.material.color = new THREE.Color('#f3e0c0')
          child.material.roughness = 0.8
          child.material.metalness = 0.0
        }
      }
    })
    return cloned
  }, [scene])

  useImperativeHandle(ref, () => ({
    triggerBinky: () => setBinky(1),
    triggerThump: () => setThump(1),
    come: () => setComeToward(1)
  }))

  useEffect(() => {
    if (called) setComeToward(1)
  }, [called])

  useFrame((state, delta) => {
    if (!group.current) return
    const t = state.clock.elapsedTime

    if (binky > 0) setBinky(v => Math.max(0, v - delta * 0.8))
    if (thump > 0) setThump(v => Math.max(0, v - delta * 1.5))
    if (comeToward > 0) setComeToward(v => Math.max(0, v - delta * 0.6))

    const hungryLean = hunger > 60 ? 0.15 : 0
    const dirtyShake = cleanliness < 40 ? Math.sin(t * 8) * 0.03 : 0
    const loaf = comfort > 78 && hunger < 50 && pose === 'stand' ? 0.08 : 0

    let y = 0.0 - loaf + Math.sin(t * 1.05) * 0.01 + dirtyShake
    let rotX = (comfort > 86 ? 0.3 : Math.min(comfort / 180, 0.15)) + hungryLean

    // Pose overrides
    if (pose === 'sit') {
      y -= 0.12
      rotX = -0.55
    } else if (pose === 'lie') {
      y -= 0.18
      rotX = -0.85
    }

    if (binky > 0.4) {
      y += Math.sin((1 - binky) * Math.PI) * 0.4
      group.current.rotation.z = Math.sin(t * 12) * 0.2
    } else {
      group.current.rotation.z = (comfort > 88 ? Math.sin(t * 0.5) * 0.1 : 0) + dirtyShake * 2
    }

    if (thump > 0.5) {
      group.current.position.z = -0.12 * thump
      y += 0.06
    } else if (comeToward > 0) {
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0.6, 0.04)
    } else {
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0, 0.02)
    }

    // Hungry look-around
    if (hunger > 75 && pose === 'stand') {
      group.current.rotation.y = Math.sin(t * 0.8) * 0.4
    } else {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.05)
    }

    group.current.position.y = y
    group.current.rotation.x = -rotX
  })

  return (
    <group ref={group} position={[0, 0, 0]} scale={0.8}>
      <mesh position={[0, 0.55, 0.25]} visible={false} onPointerDown={() => onZoneHit?.('head')}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[0, 0.25, 0]} visible={false} onPointerDown={() => onZoneHit?.('back')}>
        <boxGeometry args={[0.4, 0.25, 0.5]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[0, 0.1, -0.3]} visible={false} onPointerDown={() => onZoneHit?.('hind')}>
        <boxGeometry args={[0.3, 0.15, 0.25]} />
        <meshBasicMaterial />
      </mesh>

      <primitive object={model} />
    </group>
  )
})

useGLTF.preload('/bunny.glb')

export default Bunny
