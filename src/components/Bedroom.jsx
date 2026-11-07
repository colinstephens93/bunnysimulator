import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { quiltTexture, knitTexture, woodTexture, rugTexture, plasterTexture, skyTexture, nightSkyTexture, beamTexture } from '../textures'
import { useGame } from '../store'
import Plush from './Plush'
import SittingPlushes from './SittingPlushes'

const FLOOR_Y = -0.78

function Curtain({ x, flip = 1 }) {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.75, 2.5, 24, 1)
    g.userData.base = g.attributes.position.array.slice()
    return g
  }, [])
  useFrame(({ clock }) => {
    const pos = geo.attributes.position
    const base = geo.userData.base
    const t = clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const bx = base[i * 3]
      const by = base[i * 3 + 1]
      const sway = (1 - (by + 1.25) / 2.5) * Math.sin(t * 0.8 + bx * 3) * 0.03
      pos.setZ(i, Math.sin(bx * 22) * 0.04 + sway)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <mesh ref={ref} geometry={geo} position={[x, 1.55, -1.82]} scale={[flip, 1, 1]}>
      <meshStandardMaterial color="#fff1e4" roughness={0.9} transparent opacity={0.82} side={THREE.DoubleSide} emissive="#ffb98a" emissiveIntensity={0.25} />
    </mesh>
  )
}

function FairyLights() {
  const bulbs = useMemo(() => {
    const out = []
    const n = 26
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const x = -2.9 + t * 5.8
      const sag = Math.sin(t * Math.PI * 3) ** 2 * 0.22
      out.push([x, 2.55 - sag, -1.84])
    }
    return out
  }, [])
  const mats = useRef([])
  useFrame(({ clock }) => {
    mats.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = 2.4 + Math.sin(clock.elapsedTime * 1.5 + i * 1.7) * 0.8
    })
  })
  const curve = useMemo(() => new THREE.CatmullRomCurve3(bulbs.map((b) => new THREE.Vector3(b[0], b[1] + 0.03, b[2]))), [bulbs])
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 120, 0.006, 4, false]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
      {bulbs.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial
            ref={(m) => (mats.current[i] = m)}
            color="#fff2cc"
            emissive={['#ffcc7a', '#ffb3a1', '#ffe9a8'][i % 3]}
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function Plant({ position }) {
  const leaves = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2 + Math.random() * 0.4
    const tilt = 0.5 + Math.random() * 0.5
    return { a, tilt, len: 0.35 + Math.random() * 0.25 }
  }), [])
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.22, 0.17, 0.4, 24]} />
        <meshStandardMaterial color="#d97b58" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 24]} />
        <meshStandardMaterial color="#4a3020" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.4, 0]} rotation={[0, l.a, 0]}>
          <group rotation={[l.tilt, 0, 0]}>
            <mesh castShadow position={[0, l.len / 2, 0]} scale={[0.12, l.len / 2, 0.02]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color={i % 2 ? '#4f9a54' : '#62b064'} roughness={0.6} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function Frame({ position, color, inner }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.62, 0.78, 0.04]} radius={0.015} castShadow>
        <meshStandardMaterial color="#f7efe6" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[0.48, 0.64]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {inner}
    </group>
  )
}

export default function Bedroom() {
  const quilt = useMemo(quiltTexture, [])
  const knit = useMemo(knitTexture, [])
  const wood = useMemo(woodTexture, [])
  const rug = useMemo(rugTexture, [])
  const plaster = useMemo(plasterTexture, [])
  const night = useGame((st) => st.night)
  const daySky = useMemo(skyTexture, [])
  const nightSky = useMemo(nightSkyTexture, [])
  const sky = night ? nightSky : daySky
  const beam = useMemo(beamTexture, [])

  return (
    <group>
      <fog attach="fog" args={[night ? '#15101f' : '#4a2c1e', 7, 15]} />
      <hemisphereLight args={night ? ['#7d80c0', '#2a1e2a', 0.5] : ['#ffd9b5', '#6e4a3a', 0.75]} />
      <directionalLight
        position={[-2.5, 4.5, -4.5]}
        intensity={night ? 1.1 : 3.2}
        color={night ? '#a9b8ff' : '#ffb46e'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-camera-near={1}
        shadow-camera-far={14}
      />
      <directionalLight position={[2, 3, 5]} intensity={night ? 0.35 : 0.9} color={night ? '#c4c8ff' : '#ffe6d0'} />
      <pointLight position={[2.45, 0.75, -1.25]} intensity={night ? 5 : 2.2} distance={night ? 6 : 4} decay={2} color="#ffb26b" />

      {/* Room shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={wood} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.5, -1.95]} receiveShadow>
        <planeGeometry args={[12, 4.6]} />
        <meshStandardMaterial map={plaster} roughness={0.95} />
      </mesh>
      <mesh position={[-4.2, 1.5, 1]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 4.6]} />
        <meshStandardMaterial map={plaster} color="#f0d6c0" roughness={0.95} />
      </mesh>
      <mesh position={[4.2, 1.5, 1]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 4.6]} />
        <meshStandardMaterial map={plaster} color="#f0d6c0" roughness={0.95} />
      </mesh>
      {/* Skirting board */}
      <mesh position={[0, FLOOR_Y + 0.06, -1.93]}>
        <boxGeometry args={[12, 0.12, 0.03]} />
        <meshStandardMaterial color="#f5ece2" />
      </mesh>

      {/* Window with a golden-hour sky */}
      <group position={[0, 1.6, -1.94]}>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[2.4, 1.6]} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
        {[[0, 0.82, 2.56, 0.08], [0, -0.82, 2.56, 0.08], [-1.24, 0, 0.08, 1.72], [1.24, 0, 0.08, 1.72], [0, 0, 0.05, 1.6], [0, 0.05, 2.4, 0.05]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.04]} castShadow>
            <boxGeometry args={[w, h, 0.07]} />
            <meshStandardMaterial color="#fbf4ec" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, -0.9, 0.1]} castShadow>
          <boxGeometry args={[2.7, 0.06, 0.2]} />
          <meshStandardMaterial color="#fbf4ec" roughness={0.5} />
        </mesh>
      </group>
      <Curtain x={-1.55} />
      <Curtain x={1.55} flip={-1} />
      <FairyLights />

      {/* Sunbeams through the window */}
      {[-0.6, 0.15, 0.8].map((x, i) => (
        <mesh key={i} position={[x + 0.4, 0.9, -0.9]} rotation={[-0.75, 0.25, -0.1]}>
          <planeGeometry args={[0.55 - i * 0.08, 3]} />
          <meshBasicMaterial map={beam} color={night ? '#9fb0ff' : '#ffffff'} transparent opacity={night ? 0.035 : 0.07} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
      <Sparkles count={70} scale={[3.2, 2, 2.4]} position={[0, 0.9, -0.3]} size={2.2} speed={0.25} opacity={0.7} color="#ffe2b0" />

      {/* Bed: duvet top is y = 0, which is where the bunny stands */}
      <group>
        <RoundedBox args={[3.9, 0.3, 3.7]} radius={0.06} position={[0, -0.55, -0.05]} castShadow receiveShadow>
          <meshStandardMaterial color="#9a6a48" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[3.7, 0.36, 3.45]} radius={0.12} smoothness={4} position={[0, -0.27, -0.05]} receiveShadow>
          <meshStandardMaterial color="#f4ece4" roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[3.85, 0.16, 2.85]} radius={0.07} smoothness={4} position={[0, -0.08, 0.32]} receiveShadow castShadow>
          <meshStandardMaterial map={quilt} roughness={0.92} />
        </RoundedBox>
        {/* Knitted throw across the foot of the bed */}
        <RoundedBox args={[3.95, 0.06, 0.62]} radius={0.025} position={[0, 0.005, 1.55]} receiveShadow castShadow>
          <meshStandardMaterial map={knit} roughness={1} />
        </RoundedBox>
        {/* Upholstered headboard */}
        <RoundedBox args={[3.95, 1.55, 0.18]} radius={0.08} smoothness={4} position={[0, 0.1, -1.78]} castShadow receiveShadow>
          <meshStandardMaterial color="#c99a86" roughness={0.9} />
        </RoundedBox>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-1.5 + (i % 6) * 0.6, 0.3 + Math.floor(i / 6) * 0.4, -1.685]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#b0806c" />
          </mesh>
        ))}
        {/* Pillows */}
        <RoundedBox args={[1.25, 0.26, 0.6]} radius={0.12} smoothness={5} position={[-0.85, 0.13, -1.35]} rotation={[0.35, 0.05, 0.03]} castShadow receiveShadow>
          <meshStandardMaterial color="#fffaf4" roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[1.25, 0.26, 0.6]} radius={0.12} smoothness={5} position={[0.85, 0.13, -1.35]} rotation={[0.35, -0.05, -0.03]} castShadow receiveShadow>
          <meshStandardMaterial color="#fffaf4" roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[0.6, 0.22, 0.45]} radius={0.1} smoothness={5} position={[-0.05, 0.16, -1.22]} rotation={[0.3, 0.3, 0.05]} castShadow receiveShadow>
          <meshStandardMaterial color="#e9a8a0" roughness={0.95} />
        </RoundedBox>
      </group>

      {/* Nightstand + lamp + books + mug */}
      <group position={[2.45, FLOOR_Y, -1.25]}>
        <RoundedBox args={[0.7, 0.9, 0.55]} radius={0.03} position={[0, 0.45, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e7d3bd" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.55, 0.28]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#c9a36c" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-0.1, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 0.3, 20]} />
          <meshStandardMaterial color="#9fc2b0" roughness={0.4} />
        </mesh>
        <mesh position={[-0.1, 1.38, 0]}>
          <cylinderGeometry args={[0.12, 0.2, 0.26, 24, 1, true]} />
          <meshStandardMaterial color="#fff1d6" emissive="#ffc27a" emissiveIntensity={1.6} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.18, 0.93 + i * 0.05, 0.05]} rotation={[0, i * 0.2, 0]} castShadow>
            <boxGeometry args={[0.26, 0.045, 0.2]} />
            <meshStandardMaterial color={['#c96f53', '#7c9cbf', '#e8c56b'][i]} roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0.18, 1.12, 0.1]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 16]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.3} />
        </mesh>
      </group>

      <Plush />
      <SittingPlushes />

      <Plant position={[-2.55, FLOOR_Y, -1.35]} />

      <Frame position={[-2.75, 1.65, -1.92]} color="#e9b8a0" inner={
        <mesh position={[0, 0.02, 0.03]}><circleGeometry args={[0.13, 24]} /><meshStandardMaterial color="#f6dd9a" /></mesh>
      } />
      <Frame position={[2.75, 1.75, -1.92]} color="#a9c4b4" inner={
        <mesh position={[0, -0.05, 0.03]}><coneGeometry args={[0.16, 0.28, 3]} /><meshStandardMaterial color="#6f9a83" /></mesh>
      } />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.01, 2.4]} receiveShadow>
        <planeGeometry args={[3.4, 1.8]} />
        <meshStandardMaterial map={rug} roughness={1} />
      </mesh>
    </group>
  )
}
