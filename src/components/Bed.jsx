export default function Bed() {
  return (
    <group>
      {/* Mattress */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.25, 3.2]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.9} />
      </mesh>
      {/* Duvet / soft top */}
      <mesh position={[0, 0.08, 0.2]} receiveShadow>
        <boxGeometry args={[4.2, 0.12, 2.6]} />
        <meshStandardMaterial color="#f4ebe3" roughness={0.85} />
      </mesh>
      {/* Pillows */}
      <mesh position={[-1.4, 0.22, -1.1]} rotation={[0.1, 0, 0.05]} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.55]} />
        <meshStandardMaterial color="#f8f1ea" />
      </mesh>
      <mesh position={[1.3, 0.2, -1.05]} rotation={[0.08, 0, -0.04]} castShadow>
        <boxGeometry args={[0.85, 0.16, 0.5]} />
        <meshStandardMaterial color="#f6efe6" />
      </mesh>
    </group>
  )
}
