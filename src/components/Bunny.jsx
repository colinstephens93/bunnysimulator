import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'

const Bunny = forwardRef(({ comfort = 40, irritation = 10, onZoneHit }, ref) => {
  const group = useRef()
  const ears = useRef()
  const body = useRef()

  useImperativeHandle(ref, () => ({
    getZones: () => ({
      head: headRef.current,
      back: backRef.current,
      hind: hindRef.current
    })
  }))

  const headRef = useRef()
  const backRef = useRef()
  const hindRef = useRef()

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime

    // Breathing + loaf lowering
    const loaf = comfort > 75 ? 0.08 : 0
    group.current.position.y = 0.35 - loaf + Math.sin(t * 1.1) * 0.012

    // Ear response
    if (ears.current) {
      const earRelax = Math.min(comfort / 100, 1) * 0.55
      const earAlert = Math.min(irritation / 80, 1) * 0.6
      ears.current.rotation.x = 0.15 - earRelax + earAlert * 0.35
    }

    // Posture: lean / flop hint
    const lean = comfort > 85 ? 0.35 : Math.min(comfort / 180, 0.18)
    group.current.rotation.x = -lean
    if (comfort > 90) group.current.rotation.z = Math.sin(t * 0.4) * 0.08
  })

  return (
    <group ref={group} position={[0, 0.35, 0]}>
      {/* Invisible hitboxes */}
      <mesh ref={headRef} position={[0, 0.65, 0.15]} visible={false} onPointerDown={() => onZoneHit?.('head')}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
      <mesh ref={backRef} position={[0, 0.32, 0]} visible={false} onPointerDown={() => onZoneHit?.('back')}>
        <boxGeometry args={[0.5, 0.3, 0.6]} />
        <meshBasicMaterial />
      </mesh>
      <mesh ref={hindRef} position={[0, 0.15, -0.25]} visible={false} onPointerDown={() => onZoneHit?.('hind')}>
        <boxGeometry args={[0.4, 0.2, 0.35]} />
        <meshBasicMaterial />
      </mesh>

      {/* Body */}
      <mesh ref={body} position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.62, 0.12]} castShadow>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.65} />
      </mesh>
      {/* Ears */}
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
      {/* Eyes */}
      <mesh position={[-0.1, 0.68, 0.22]} scale={[1, comfort > 70 ? 0.35 : 1, 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>
      <mesh position={[0.1, 0.68, 0.22]} scale={[1, comfort > 70 ? 0.35 : 1, 1]}>
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
})

export default Bunny
