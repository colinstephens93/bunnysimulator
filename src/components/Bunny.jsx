import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { useFrame } from '@react-three/fiber'

const Bunny = forwardRef(({ comfort = 40, irritation = 10, onZoneHit }, ref) => {
  const group = useRef()
  const ears = useRef()
  const body = useRef()
  const [binky, setBinky] = useState(0)
  const [thump, setThump] = useState(0)

  useImperativeHandle(ref, () => ({
    triggerBinky: () => setBinky(1),
    triggerThump: () => setThump(1)
  }))

  const headRef = useRef()
  const backRef = useRef()
  const hindRef = useRef()

  useFrame((state, delta) => {
    if (!group.current) return
    const t = state.clock.elapsedTime

    if (binky > 0) setBinky(v => Math.max(0, v - delta * 0.8))
    if (thump > 0) setThump(v => Math.max(0, v - delta * 1.5))

    const loaf = comfort > 78 ? 0.1 : 0
    let y = 0.35 - loaf + Math.sin(t * 1.05) * 0.01

    if (binky > 0.4) {
      y += Math.sin((1 - binky) * Math.PI) * 0.45
      group.current.rotation.z = Math.sin(t * 12) * 0.25
    } else {
      group.current.rotation.z = comfort > 88 ? Math.sin(t * 0.5) * 0.12 : 0
    }

    if (thump > 0.5) {
      group.current.position.z = -0.15 * thump
      y += 0.08
    } else {
      group.current.position.z = 0
    }

    group.current.position.y = y

    if (ears.current) {
      const earRelax = Math.min(comfort / 100, 1) * 0.6
      const earAlert = Math.min(irritation / 70, 1) * 0.7
      ears.current.rotation.x = 0.12 - earRelax + earAlert * 0.4
    }

    const lean = comfort > 86 ? 0.42 : Math.min(comfort / 160, 0.2)
    group.current.rotation.x = -lean
  })

  const furColor = '#f5e6c8'
  const shellOpacities = [0.35, 0.22, 0.12]

  return (
    <group ref={group} position={[0, 0.35, 0]}>
      {/* Hitboxes */}
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

      {/* Base body + shell fur layers */}
      <mesh ref={body} position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.75} metalness={0.02} />
      </mesh>
      {shellOpacities.map((op, i) => (
        <mesh key={`body-shell-${i}`} position={[0, 0.25, 0]} scale={1 + (i + 1) * 0.018}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial
            color={furColor}
            transparent
            opacity={op}
            roughness={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Base head + shell fur layers */}
      <mesh position={[0, 0.62, 0.12]} castShadow>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.7} />
      </mesh>
      {shellOpacities.map((op, i) => (
        <mesh key={`head-shell-${i}`} position={[0, 0.62, 0.12]} scale={1 + (i + 1) * 0.016}>
          <sphereGeometry args={[0.26, 24, 24]} />
          <meshStandardMaterial
            color={furColor}
            transparent
            opacity={op}
            roughness={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}

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
      <mesh position={[-0.1, 0.68, 0.22]} scale={[1, comfort > 72 ? 0.3 : 1, 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#2a1a12" />
      </mesh>
      <mesh position={[0.1, 0.68, 0.22]} scale={[1, comfort > 72 ? 0.3 : 1, 1]}>
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
