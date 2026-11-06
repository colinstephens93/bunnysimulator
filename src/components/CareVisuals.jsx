import { useState, useEffect } from 'react'

export default function CareVisuals({ action, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (action) {
      setVisible(true)
      const t = setTimeout(() => {
        setVisible(false)
        onDone?.()
      }, 2200)
      return () => clearTimeout(t)
    }
  }, [action, onDone])

  if (!visible || !action) return null

  const pos = action === 'feed' ? [0.4, 0.15, 0.6] : action === 'water' ? [-0.4, 0.12, 0.6] : [0, 0.18, 0.7]

  return (
    <group position={pos}>
      {action === 'feed' && (
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 16]} />
          <meshStandardMaterial color="#d7ccc8" />
        </mesh>
      )}
      {action === 'water' && (
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
          <meshStandardMaterial color="#81d4fa" transparent opacity={0.8} />
        </mesh>
      )}
      {action === 'treat' && (
        <mesh castShadow>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color="#ffcc80" />
        </mesh>
      )}
    </group>
  )
}
