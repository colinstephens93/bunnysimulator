export default function Outdoor() {
  return (
    <group>
      {/* Grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#81c784" roughness={0.9} />
      </mesh>
      {/* Dirt path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 1.2]}>
        <planeGeometry args={[1.4, 6]} />
        <meshStandardMaterial color="#a1887f" roughness={0.95} />
      </mesh>
      {/* Bushes */}
      {[
        [-4.2, -2.5], [3.8, -3.2], [-2.8, -4], [4.5, -1.5],
        [-5, 1.2], [5.2, 0.8], [-3.5, 2.5], [2.8, 3.2]
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} castShadow>
          <sphereGeometry args={[0.5 + (i % 3) * 0.15, 14, 14]} />
          <meshStandardMaterial color={['#66bb6a', '#558b2f', '#7cb342'][i % 3]} />
        </mesh>
      ))}
      {/* Small trees */}
      <group position={[-6, 0, -1]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 1.2, 8]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshStandardMaterial color="#43a047" />
        </mesh>
      </group>
      <group position={[6.5, 0, -2]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 1.4, 8]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.8, 12, 12]} />
          <meshStandardMaterial color="#388e3c" />
        </mesh>
      </group>
      {/* Flowers */}
      {[[-1.2, -0.8], [0.8, -1.1], [1.5, 0.4], [-0.6, 0.9]].map(([x, z], i) => (
        <mesh key={`f${i}`} position={[x, 0.08, z]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={['#f48fb1', '#fff176', '#ce93d8', '#ffcc80'][i]} />
        </mesh>
      ))}
    </group>
  )
}
