import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { fx } from './Particles'
import { sfx } from '../audio'
import { buzz } from '../haptics'
import { useGame } from '../store'

// A mini stacking-style duck plush that lives on the bed. Modelled in unit
// space lying on its side (long axis = Z, face at +Z) and scaled down.
export const PLUSH_POS = [1.0, -1.2, -0.5] // x, yaw, z (face turned toward the bed centre)
const SIZE = 0.12

const WHITE = new THREE.Color('#fbfbf8')
const BLUE = new THREE.Color('#47aee8')

// Rounded-cylinder body with the blue "shirt" band baked into vertex colours.
function bodyGeometry() {
  const R = 1
  const H = 1.25 // half length
  const r = 0.55 // edge rounding
  const pts = []
  pts.push(new THREE.Vector2(0, -H))
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2)
    pts.push(new THREE.Vector2(R - r + Math.cos(a) * r, -H + r + Math.sin(a) * r))
  }
  for (let i = 1; i < 16; i++) pts.push(new THREE.Vector2(R, -H + r + (i / 16) * (2 * (H - r))))
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2)
    pts.push(new THREE.Vector2(R - r + Math.cos(a) * r, H - r + Math.sin(a) * r))
  }
  pts.push(new THREE.Vector2(0, H))
  const g = new THREE.LatheGeometry(pts, 48)
  // Lathe spins around Y; lay it down so the long axis is Z (face at +Z).
  g.rotateX(Math.PI / 2)
  // Slightly squash vertically and flatten the bottom, like a stuffed toy resting.
  const pos = g.attributes.position
  const colors = []
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i)
    if (y < -0.75) y = -0.75 + (y + 0.75) * 0.35
    pos.setY(i, y * 0.92)
    const z = pos.getZ(i)
    // Blue band from the back half up to just behind the face.
    const t = THREE.MathUtils.smoothstep(z, -0.62, -0.5) * (1 - THREE.MathUtils.smoothstep(z, 0.18, 0.3))
    c.copy(WHITE).lerp(BLUE, t)
    colors.push(c.r, c.g, c.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

export default function Plush() {
  const group = useRef()
  const squish = useRef({ v: 0, x: 0, wobble: 0 })
  const geo = useMemo(bodyGeometry, [])
  const fabric = useMemo(() => new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff')
  }), [])
  const felt = (color) => <meshStandardMaterial color={color} roughness={0.9} />

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = squish.current
    // Springy squash when tapped.
    s.v += (-s.x * 160 - s.v * 9) * dt
    s.x += s.v * dt
    s.wobble = Math.max(0, s.wobble - dt * 2)
    const sq = THREE.MathUtils.clamp(s.x, -0.3, 0.3)
    group.current.scale.set(SIZE * (1 + sq * 0.5), SIZE * (1 - sq), SIZE * (1 + sq * 0.3))
    group.current.rotation.z = Math.sin(s.wobble * 18) * 0.08 * s.wobble
  })

  const poke = (e) => {
    e.stopPropagation()
    squish.current.v += 5
    squish.current.wobble = 1
    sfx.squeak()
    buzz(10)
    fx.burst('heart', e.point, 2, { scale: 0.7 })
    const g = useGame.getState()
    g.change({ joy: 1 })
    if (Math.random() < 0.35) g.toast(`${g.name} likes snuggling the little duck plush`)
  }

  return (
    <group position={[PLUSH_POS[0], 0, PLUSH_POS[2]]} rotation={[0, PLUSH_POS[1], 0]}>
      <group ref={group} position={[0, 0.092, 0]} scale={SIZE} onPointerDown={poke}>
        <mesh geometry={geo} material={fabric} castShadow receiveShadow />

        {/* Face on the front end */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.33, 0.02, 1.24]} scale={[0.115, 0.15, 0.045]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#141414" roughness={0.3} />
            </mesh>
            <mesh position={[side * 0.35, 0.07, 1.28]} scale={[0.03, 0.035, 0.02]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[side * 0.58, -0.17, 1.245]} rotation={[0, side * 0.35, 0]}>
              <circleGeometry args={[0.11, 20]} />
              <meshStandardMaterial color="#f7a3c0" roughness={1} />
            </mesh>
          </group>
        ))}
        {/* Flat felt bill */}
        <mesh position={[0, -0.25, 1.25]} scale={[0.46, 0.14, 0.13]}>
          <sphereGeometry args={[1, 24, 12]} />
          {felt('#f7823a')}
        </mesh>
        <mesh position={[0, -0.3, 1.32]} scale={[0.38, 0.06, 0.07]}>
          <sphereGeometry args={[1, 16, 8]} />
          {felt('#e86f2a')}
        </mesh>

        {/* Little tilted sailor hat */}
        <group position={[0.22, 0.9, 0.7]} rotation={[-0.3, 0.3, -0.18]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 28]} />
            {felt('#62b9e3')}
          </mesh>
          <mesh position={[0, 0.07, -0.05]} castShadow>
            <cylinderGeometry args={[0.24, 0.28, 0.12, 20]} />
            {felt('#62b9e3')}
          </mesh>
          <mesh position={[0.08, 0.04, -0.46]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.18, 0.04, 0.2]} />
            {felt('#4fa6d3')}
          </mesh>
        </group>

        {/* Red bow under the chin */}
        <group position={[0, -0.8, 1.02]} rotation={[0.5, 0, 0]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.16, 0, 0]} rotation={[0, 0, side * 0.5]} scale={[0.17, 0.1, 0.06]}>
              <sphereGeometry args={[1, 12, 8]} />
              {felt('#e2262f')}
            </mesh>
          ))}
          <mesh scale={[0.07, 0.07, 0.07]}>
            <sphereGeometry args={[1, 10, 8]} />
            {felt('#c81e27')}
          </mesh>
        </group>

        {/* Orange feet peeking out at the back */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.42, -0.72, -0.95]} rotation={[0, side * 0.3, 0]} scale={[0.26, 0.08, 0.3]} castShadow>
            <sphereGeometry args={[1, 14, 8]} />
            {felt('#f7823a')}
          </mesh>
        ))}
        {/* Tiny tail tuft */}
        <mesh position={[0, 0.25, -1.24]} scale={[0.16, 0.12, 0.08]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#fbfbf8" roughness={1} />
        </mesh>
      </group>
    </group>
  )
}
