export default function Bed() {
  return (
    <group>
      {/* Wooden bed frame */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.12, 3.6]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.7} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.22, 3.3]} />
        <meshStandardMaterial color="#efe6dc" roughness={0.92} />
      </mesh>
      {/* Soft duvet */}
      <mesh position={[0, 0.12, 0.2]} receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.1, 2.4]} />
        <meshStandardMaterial color="#f8f3ee" roughness={0.85} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.45, -1.65]} castShadow>
        <boxGeometry args={[4.6, 0.8, 0.12]} />
        <meshStandardMaterial color="#a1887f" roughness={0.65} />
      </mesh>
      {/* Pillows */}
      <mesh position={[-1.4, 0.28, -1.2]} rotation={[0.15, 0.1, 0.05]} castShadow>
        <boxGeometry args={[1.0, 0.18, 0.55]} />
        <meshStandardMaterial color="#fff8f0" roughness={0.9} />
      </mesh>
      <mesh position={[1.3, 0.26, -1.15]} rotation={[0.12, -0.08, -0.04]} castShadow>
        <boxGeometry args={[0.95, 0.16, 0.5]} />
        <meshStandardMaterial color="#fdf6ef" roughness={0.9} />
      </mesh>
      {/* Small nightstand */}
      <mesh position={[2.4, 0.15, -0.8]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.5]} />
        <meshStandardMaterial color="#bcaaa4" roughness={0.6} />
      </mesh>
      {/* Lamp base */}
      <mesh position={[2.4, 0.55, -0.8]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.35, 12]} />
        <meshStandardMaterial color="#d7ccc8" />
      </mesh>
      <mesh position={[2.4, 0.78, -0.8]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fff8e1" emissive="#ffe082" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}
