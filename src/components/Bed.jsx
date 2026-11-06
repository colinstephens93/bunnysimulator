export default function Bed() {
  return (
    <group>
      {/* Mattress */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.28, 3.4]} />
        <meshStandardMaterial color="#e6d2bf" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Duvet / soft top */}
      <mesh position={[0, 0.09, 0.15]} receiveShadow>
        <boxGeometry args={[4.3, 0.14, 2.7]} />
        <meshStandardMaterial color="#f7f0e8" roughness={0.88} />
      </mesh>
      {/* Pillows */}
      <mesh position={[-1.45, 0.24, -1.15]} rotation={[0.12, 0.05, 0.06]} castShadow>
        <boxGeometry args={[0.95, 0.2, 0.58]} />
        <meshStandardMaterial color="#fbf6f1" roughness={0.9} />
      </mesh>
      <mesh position={[1.35, 0.22, -1.1]} rotation={[0.1, -0.04, -0.05]} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.52]} />
        <meshStandardMaterial color="#f9f4ee" roughness={0.9} />
      </mesh>
    </group>
  )
}
