import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Bunny({ tool }) {
  const group = useRef()

  useFrame((state) => {
    if (group.current) {
      // Subtle breathing / idle
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.02
    }
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
      {/* Ears */}
      <mesh position={[-0.12, 0.92, 0.05]} rotation={[0.2, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.05, 0.28, 8, 16]} />
        <meshStandardMaterial color="#f0dcc0" />
      </mesh>
      <mesh position={[0.12, 0.92, 0.05]} rotation={[0.2, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.05, 0.28, 8, 16]} />
        <meshStandardMaterial color="#f0dcc0" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.68, 0.22]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>
      <mesh position={[0.1, 0.68, 0.22]}>
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
