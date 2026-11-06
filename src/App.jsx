import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import Bunny from './components/Bunny'
import Bed from './components/Bed'
import UI from './components/UI'
import Hand from './components/Hand'

export default function App() {
  const [tool, setTool] = useState('hand')
  const [muted, setMuted] = useState(false)
  const [isLandscape, setIsLandscape] = useState(true)
  const [comfort, setComfort] = useState(40)
  const [irritation, setIrritation] = useState(10)
  const bunnyRef = useRef()
  const lastComfort = useRef(40)
  const lastIrritation = useRef(10)

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

  useEffect(() => {
    const id = setInterval(() => {
      setComfort(c => Math.max(0, c - 0.35))
      setIrritation(i => Math.max(0, i - 0.55))
    }, 180)
    return () => clearInterval(id)
  }, [])

  // Trigger animations on threshold crossings
  useEffect(() => {
    if (comfort > 92 && lastComfort.current <= 92 && bunnyRef.current?.triggerBinky) {
      bunnyRef.current.triggerBinky()
    }
    if (irritation > 65 && lastIrritation.current <= 65 && bunnyRef.current?.triggerThump) {
      bunnyRef.current.triggerThump()
    }
    lastComfort.current = comfort
    lastIrritation.current = irritation
  }, [comfort, irritation])

  const handleZoneHit = useCallback((zone) => {
    if (zone === 'head') {
      setComfort(c => Math.min(100, c + (tool === 'brush' ? 4.5 : 3.2)))
      setIrritation(i => Math.max(0, i - 2))
    } else if (zone === 'back') {
      setComfort(c => Math.min(100, c + (tool === 'brush' ? 3 : 1.8)))
      setIrritation(i => Math.max(0, i - 0.5))
    } else if (zone === 'hind') {
      setIrritation(i => Math.min(100, i + 9))
      setComfort(c => Math.max(0, c - 3))
    }
  }, [tool])

  const handleStroke = useCallback(() => {
    setComfort(c => Math.min(100, c + 1))
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
        <Bunny
          ref={bunnyRef}
          comfort={comfort}
          irritation={irritation}
          onZoneHit={handleZoneHit}
        />
        <Hand tool={tool} onStroke={handleStroke} />
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={8} blur={2.5} far={4} />
        <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>

      <UI tool={tool} setTool={setTool} muted={muted} setMuted={setMuted} />
    </>
  )
}
