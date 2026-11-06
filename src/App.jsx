import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import Bunny from './components/Bunny'
import Bed from './components/Bed'
import UI from './components/UI'

export default function App() {
  const [tool, setTool] = useState('hand') // 'hand' | 'brush'
  const [muted, setMuted] = useState(false)
  const [isLandscape, setIsLandscape] = useState(true)

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return (
    <>
      {!isLandscape && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          color: '#f5e6d3',
          fontSize: '1.25rem',
          textAlign: 'center',
          padding: '2rem'
        }}>
          Rotate your phone to landscape for the best experience
        </div>
      )}

      <Canvas
        camera={{ position: [0, 1.2, 3.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#2a1f14']} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 6, 2]}
          intensity={1.8}
          color="#ffd6a5"
          castShadow
        />
        <Environment preset="sunset" />
        <Bed />
        <Bunny tool={tool} />
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={8} blur={2.5} far={4} />
        <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>

      <UI tool={tool} setTool={setTool} muted={muted} setMuted={setMuted} />
    </>
  )
}
