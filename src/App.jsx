import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import Bunny from './components/Bunny'
import Bed from './components/Bed'
import UI from './components/UI'
import Hand from './components/Hand'
import Audio from './components/Audio'

function Outdoor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#7cb342" roughness={0.85} />
      </mesh>
      {/* Simple bushes */}
      {[[-3, -1.2], [2.5, -1.8], [-1.5, -2.5], [3.2, -0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} castShadow>
          <sphereGeometry args={[0.45 + (i % 2) * 0.15, 12, 12]} />
          <meshStandardMaterial color={i % 2 ? '#558b2f' : '#689f38'} />
        </mesh>
      ))}
    </group>
  )
}

export default function App() {
  const [tool, setTool] = useState('hand')
  const [muted, setMuted] = useState(false)
  const [isLandscape, setIsLandscape] = useState(true)
  const [mode, setMode] = useState('home')
  const [pose, setPose] = useState('stand')
  const [called, setCalled] = useState(false)
  const [bunnyName] = useState('Bun')

  const [comfort, setComfort] = useState(50)
  const [irritation, setIrritation] = useState(5)
  const [hunger, setHunger] = useState(30)
  const [thirst, setThirst] = useState(25)
  const [cleanliness, setCleanliness] = useState(70)
  const [bond, setBond] = useState(40)

  const bunnyRef = useRef()
  const lastComfort = useRef(50)
  const lastIrritation = useRef(5)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('goldenHourBunny')
      if (saved) {
        const data = JSON.parse(saved)
        setComfort(data.comfort ?? 50)
        setHunger(data.hunger ?? 30)
        setThirst(data.thirst ?? 25)
        setCleanliness(data.cleanliness ?? 70)
        setBond(data.bond ?? 40)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    localStorage.setItem('goldenHourBunny', JSON.stringify({ comfort, hunger, thirst, cleanliness, bond }))
  }, [comfort, hunger, thirst, cleanliness, bond])

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight)
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setHunger(h => Math.min(100, h + 0.35))
      setThirst(t => Math.min(100, t + 0.45))
      setCleanliness(c => Math.max(0, c - 0.12))
      setComfort(c => Math.max(0, c - 0.2))
      setIrritation(i => Math.max(0, i - 0.35))
      if (hunger > 70 || thirst > 70 || cleanliness < 30) {
        setBond(b => Math.max(0, b - 0.15))
      }
    }, 220)
    return () => clearInterval(id)
  }, [hunger, thirst, cleanliness])

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
    const gain = tool === 'brush' ? 3.5 : 2.4
    if (zone === 'head') {
      setComfort(c => Math.min(100, c + gain))
      setBond(b => Math.min(100, b + 0.8))
      setIrritation(i => Math.max(0, i - 1.5))
    } else if (zone === 'back') {
      setComfort(c => Math.min(100, c + gain * 0.7))
      setBond(b => Math.min(100, b + 0.5))
      if (tool === 'brush') setCleanliness(c => Math.min(100, c + 1.2))
    } else if (zone === 'hind') {
      setIrritation(i => Math.min(100, i + 7))
      setComfort(c => Math.max(0, c - 2))
    }
  }, [tool])

  const handleCare = useCallback((action) => {
    if (action === 'feed') {
      setHunger(h => Math.max(0, h - 45))
      setComfort(c => Math.min(100, c + 8))
      setBond(b => Math.min(100, b + 3))
    } else if (action === 'water') {
      setThirst(t => Math.max(0, t - 50))
      setComfort(c => Math.min(100, c + 6))
      setBond(b => Math.min(100, b + 2))
    } else if (action === 'brush') {
      setCleanliness(c => Math.min(100, c + 25))
      setComfort(c => Math.min(100, c + 5))
      setBond(b => Math.min(100, b + 2))
    } else if (action === 'treat') {
      setHunger(h => Math.max(0, h - 15))
      setComfort(c => Math.min(100, c + 12))
      setBond(b => Math.min(100, b + 6))
    }
    bunnyRef.current?.reactHappy?.()
  }, [])

  const handleTrick = useCallback((trick) => {
    if (trick === 'lie') {
      // No dedicated Lie clip — treat as Sit for now
      setPose('sit')
    } else {
      setPose(trick)
    }
    setBond(b => Math.min(100, b + 1.5))
    setComfort(c => Math.min(100, c + 3))
    setTimeout(() => setPose('stand'), 3200)
  }, [])

  const handleCall = useCallback(() => {
    setCalled(true)
    bunnyRef.current?.come?.()
    setTimeout(() => setCalled(false), 2200)
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

      <Audio muted={muted} tool={tool} />

      <Canvas
        camera={{ position: [0, 1.15, mode === 'walk' ? 4.0 : 3.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[mode === 'walk' ? '#87ceeb' : '#2a1f14']} />
        <ambientLight intensity={mode === 'walk' ? 0.6 : 0.4} />
        <directionalLight
          position={[4, 6, 2]}
          intensity={mode === 'walk' ? 1.5 : 1.9}
          color={mode === 'walk' ? '#fff8e1' : '#ffd6a5'}
          castShadow
        />
        <Environment preset={mode === 'walk' ? 'park' : 'sunset'} />
        {mode === 'home' ? <Bed /> : <Outdoor />}
        <Bunny
          ref={bunnyRef}
          comfort={comfort}
          irritation={irritation}
          hunger={hunger}
          thirst={thirst}
          cleanliness={cleanliness}
          bond={bond}
          pose={pose}
          called={called}
          onZoneHit={handleZoneHit}
        />
        <Hand tool={tool} onStroke={() => setComfort(c => Math.min(100, c + 0.8))} />
        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={8} blur={2.5} far={4} />
        <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      <UI
        tool={tool}
        setTool={setTool}
        muted={muted}
        setMuted={setMuted}
        hunger={hunger}
        thirst={thirst}
        cleanliness={cleanliness}
        bond={bond}
        mode={mode}
        setMode={setMode}
        onCare={handleCare}
        onTrick={handleTrick}
        onCall={handleCall}
        bunnyName={bunnyName}
      />
    </>
  )
}
