import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx } from './Particles'
import { sfx } from '../audio'
import { buzz } from '../haptics'
import { useGame } from '../store'

// Sitting plushes propped against the pillows. Each is modelled in unit space
// (feet at y = 0, facing +Z) and wrapped in <Squishy> for the tap reaction.

export const SITTING_PLUSHES = [
  { id: 'kitty', x: -1.12, z: -0.98, yaw: 0.28, label: 'Hello Kitty' },
  { id: 'miffy', x: -0.5, z: -1.0, yaw: 0.12, label: 'Miffy' }
]

const fuzzy = (color, extra = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.95, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff'), ...extra
})

// Springy squash-and-wobble shared by both plushes.
function Squishy({ position, yaw, scale, lean = 0.12, message, children }) {
  const ref = useRef()
  const st = useRef({ x: 0, v: 0, wobble: 0 })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    s.v += (-s.x * 150 - s.v * 8) * dt
    s.x += s.v * dt
    s.wobble = Math.max(0, s.wobble - dt * 1.8)
    const sq = THREE.MathUtils.clamp(s.x, -0.25, 0.25)
    ref.current.scale.set(scale * (1 + sq * 0.45), scale * (1 - sq), scale * (1 + sq * 0.45))
    ref.current.rotation.z = Math.sin(s.wobble * 16) * 0.1 * s.wobble
  })
  const poke = (e) => {
    e.stopPropagation()
    st.current.v += 4.5
    st.current.wobble = 1
    sfx.squeak()
    buzz(10)
    fx.burst('heart', e.point, 2, { scale: 0.8 })
    const g = useGame.getState()
    g.change({ joy: 1 })
    if (Math.random() < 0.35) g.toast(message.replaceAll('{n}', g.name))
  }
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* Lean back slightly against the pillow */}
      <group rotation={[-lean, 0, 0]}>
        <group ref={ref} scale={scale} onPointerDown={poke}>
          {children}
        </group>
      </group>
    </group>
  )
}

function Ellipsoid({ position, scale, material, rotation, cast = true, segments = 28 }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} material={material} castShadow={cast} receiveShadow>
      <sphereGeometry args={[1, segments, Math.round(segments * 0.7)]} />
    </mesh>
  )
}

// ---------------- Hello Kitty ----------------

function HelloKitty() {
  const m = useMemo(() => ({
    white: fuzzy('#fdfcf9'),
    pink: fuzzy('#ef5d96'),
    lightPink: fuzzy('#f8bcd2'),
    red: fuzzy('#e3202f', { sheenColor: new THREE.Color('#ff8a8a') }),
    black: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.35 }),
    yellow: new THREE.MeshStandardMaterial({ color: '#f6d34f', roughness: 0.5 }),
    whisker: new THREE.MeshStandardMaterial({ color: '#5a3a2a', roughness: 0.8 })
  }), [])
  const HEAD_Y = 0.9
  return (
    <group>
      {/* Wide head */}
      <Ellipsoid position={[0, HEAD_Y, 0]} scale={[0.62, 0.45, 0.48]} material={m.white} segments={36} />
      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.37, HEAD_Y + 0.34, -0.02]} rotation={[0, 0, -s * 0.45]} scale={[1, 1, 0.75]} material={m.white} castShadow>
          <coneGeometry args={[0.2, 0.27, 20]} />
        </mesh>
      ))}
      {/* Eyes */}
      {[-1, 1].map((s) => (
        <Ellipsoid key={s} position={[s * 0.21, HEAD_Y + 0.02, 0.443]} scale={[0.045, 0.066, 0.025]} material={m.black} cast={false} segments={14} />
      ))}
      {/* Nose */}
      <Ellipsoid position={[0, HEAD_Y - 0.07, 0.47]} scale={[0.055, 0.038, 0.03]} material={m.yellow} cast={false} segments={14} />
      {/* Whiskers: three per side */}
      {[-1, 1].map((s) => [0.06, -0.02, -0.1].map((dy, i) => (
        <mesh
          key={`${s}${i}`}
          position={[s * 0.6, HEAD_Y + dy, 0.2]}
          rotation={[0, s * 0.75, s * (i - 1) * -0.18]}
          material={m.whisker}
        >
          <boxGeometry args={[0.16, 0.009, 0.009]} />
        </mesh>
      )))}
      {/* Big red bow on her left ear (viewer's right) */}
      <group position={[0.36, HEAD_Y + 0.33, 0.14]} rotation={[0.25, 0, -0.35]}>
        {[-1, 1].map((s) => (
          <Ellipsoid key={s} position={[s * 0.15, 0, 0]} rotation={[0, 0, s * 0.3]} scale={[0.16, 0.13, 0.08]} material={m.red} segments={20} />
        ))}
        <Ellipsoid position={[0, 0, 0.03]} scale={[0.07, 0.075, 0.06]} material={m.red} segments={14} />
      </group>

      {/* Body: light-pink shirt with pink overalls and yellow buttons */}
      <Ellipsoid position={[0, 0.31, 0]} scale={[0.34, 0.31, 0.28]} material={m.pink} />
      <Ellipsoid position={[0, 0.5, -0.01]} scale={[0.32, 0.16, 0.26]} material={m.lightPink} />
      {[-1, 1].map((s) => (
        <Ellipsoid key={s} position={[s * 0.12, 0.44, 0.255]} scale={[0.028, 0.028, 0.015]} material={m.yellow} cast={false} segments={10} />
      ))}
      {/* Arms: pink sleeves, white paws held out */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ellipsoid position={[s * 0.33, 0.47, 0.02]} scale={[0.12, 0.11, 0.11]} material={m.lightPink} segments={16} />
          <Ellipsoid position={[s * 0.42, 0.35, 0.08]} rotation={[0, 0, s * 0.55]} scale={[0.09, 0.14, 0.09]} material={m.white} segments={16} />
        </group>
      ))}
      {/* Legs sticking forward with round white feet */}
      {[-1, 1].map((s) => (
        <Ellipsoid key={s} position={[s * 0.17, 0.12, 0.24]} scale={[0.16, 0.13, 0.21]} material={m.white} segments={20} />
      ))}
    </group>
  )
}

// ---------------- Miffy ----------------

function Miffy() {
  const m = useMemo(() => ({
    white: fuzzy('#fbfaf6', { sheenRoughness: 0.4 }),
    grey: new THREE.MeshStandardMaterial({ color: '#4b4d52', roughness: 0.5 })
  }), [])
  const HEAD_Y = 0.86
  return (
    <group>
      {/* Head, slightly egg-shaped and wider at the cheeks */}
      <Ellipsoid position={[0, HEAD_Y, 0]} scale={[0.42, 0.37, 0.35]} material={m.white} segments={40} />
      {/* Tall upright ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, HEAD_Y + 0.5, -0.03]} rotation={[0, 0, -s * 0.07]} material={m.white} castShadow>
          <capsuleGeometry args={[0.11, 0.4, 8, 18]} />
        </mesh>
      ))}
      {/* Embroidered eyes */}
      {[-1, 1].map((s) => (
        <Ellipsoid key={s} position={[s * 0.15, HEAD_Y + 0.0, 0.335]} scale={[0.034, 0.048, 0.015]} material={m.grey} cast={false} segments={14} />
      ))}
      {/* X-shaped mouth */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, HEAD_Y - 0.11, 0.36]} rotation={[-0.25, 0, s * 0.55]} material={m.grey}>
          <boxGeometry args={[0.1, 0.014, 0.012]} />
        </mesh>
      ))}

      {/* Body */}
      <Ellipsoid position={[0, 0.36, 0]} scale={[0.3, 0.33, 0.27]} material={m.white} />
      {/* Arms hanging down and out */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.31, 0.38, 0.04]} rotation={[0.15, 0, s * 0.55]} material={m.white} castShadow>
          <capsuleGeometry args={[0.075, 0.2, 6, 14]} />
        </mesh>
      ))}
      {/* Round feet facing forward */}
      {[-1, 1].map((s) => (
        <Ellipsoid key={s} position={[s * 0.16, 0.11, 0.22]} scale={[0.15, 0.13, 0.19]} material={m.white} segments={20} />
      ))}
    </group>
  )
}

export default function SittingPlushes() {
  const [kitty, miffy] = SITTING_PLUSHES
  return (
    <>
      <Squishy position={[kitty.x, 0, kitty.z]} yaw={kitty.yaw} scale={0.3} message="{n} loves cuddling with Hello Kitty">
        <HelloKitty />
      </Squishy>
      <Squishy position={[miffy.x, 0, miffy.z]} yaw={miffy.yaw} scale={0.26} lean={0.1} message="Miffy and {n} are best bunny friends">
        <Miffy />
      </Squishy>
    </>
  )
}
