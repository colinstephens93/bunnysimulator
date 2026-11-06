import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Bunny({ tool, comfort = 50, irritation = 0 }) {
  const group = useRef()
  const ears = useRef()

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime

    // Breathing
    group.current.position.y = 0.35 + Math.sin(t * 1.1) * 0.015

    // Ear response based on state
    if (ears.current) {
      const earRelax = Math.min(comfort / 100, 1) * 0.4
      const earAlert = Math.min(irritation / 100, 1) * 0.5
      ears.current.rotation.x = 0.2 - earRelax + earAlert * 0.3
    }

    // Slight lean when comforted
    group.current.rotation.x = -Math.min(comfort / 200, 0.15)
  })

  return (
    <group ref={group} position={[0, 0.35, 0]}>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.62, 0.12]} castShadow>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.65} />
      </mesh>
      {/* Ears group */}
      <group ref={ears}>
        <mesh position={[-0.12, 0.92, 0.05]} rotation={[0, 0, -0.15]} castShadow>
          <capsuleGeometry args={[0.05, 0.28, 8, 16]} />
          <meshStandardMaterial color="#f0dcc0" />
        </mesh>
        <mesh position={[0.12, 0.92, 0.05]} rotation={[0, 0, 0.15]} castShadow>
          <capsuleGeometry args={[0.05, 0.28, 8, 16]} />
          <meshStandardMaterial color="#f0dcc0" />
        </mesh>
      </group>
      {/* Eyes — half-close with high comfort */}
      <mesh position={[-0.1, 0.68, 0.22]} scale={[1, comfort > 70 ? 0.4 : 1, 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>
      <mesh position={[0.1, 0.68, 0.22]} scale={[1, comfort > 70 ? 0.4 : 1, 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.58, 0.28]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#e8c4b0" />
      </mesh>
    </group>
  )
}
