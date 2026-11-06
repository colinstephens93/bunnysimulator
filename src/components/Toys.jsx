import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store'
import { world, clampToBounds, startGesture } from '../world'
import { fx } from './Particles'
import { sfx } from '../audio'

const GRAVITY = -9

// A woven willow ball the bunny chases and nudges around.
export function Ball() {
  const ref = useRef()
  const spin = useRef(new THREE.Quaternion())
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const x = c.getContext('2d')
    x.fillStyle = '#d9a35f'
    x.fillRect(0, 0, 128, 128)
    x.strokeStyle = '#a8742f'
    x.lineWidth = 6
    for (let i = -128; i < 256; i += 18) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke()
      x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2, 1)
    return t
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const ball = world.ball
    const m = ref.current
    m.visible = ball.active
    if (!ball.active) return
    const r = ball.radius
    // Vertical bounce.
    ball.vy += GRAVITY * dt
    ball.y += ball.vy * dt
    if (ball.y < 0) {
      if (ball.vy < -1.2) sfx.bounce(-ball.vy / 4)
      ball.y = 0
      ball.vy = -ball.vy * 0.45
      if (Math.abs(ball.vy) < 0.4) ball.vy = 0
    }
    // Rolling with friction, bouncing off the play-area edges.
    ball.pos.addScaledVector(ball.vel, dt)
    const b = world.bounds
    if (ball.pos.x < b.minX + r || ball.pos.x > b.maxX - r) { ball.vel.x *= -0.6; sfx.bounce(0.5) }
    if (ball.pos.z < b.minZ + r || ball.pos.z > b.maxZ - r) { ball.vel.z *= -0.6; sfx.bounce(0.5) }
    clampToBounds(ball.pos, r)
    ball.vel.multiplyScalar(Math.max(0, 1 - (ball.y > 0.01 ? 0.3 : 1.6) * dt))
    // Push out of the bunny so they don't overlap.
    const bun = world.bunny.pos
    const dx = ball.pos.x - bun.x
    const dz = ball.pos.z - bun.z
    const d = Math.hypot(dx, dz)
    if (d < 0.17 && d > 1e-4) {
      ball.pos.x = bun.x + (dx / d) * 0.17
      ball.pos.z = bun.z + (dz / d) * 0.17
    }
    const speed = ball.vel.length()
    if (speed > 1e-3) {
      const axis = new THREE.Vector3(ball.vel.z, 0, -ball.vel.x).normalize()
      spin.current.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, (speed * dt) / r))
    }
    m.position.set(ball.pos.x, r + ball.y, ball.pos.z)
    m.quaternion.copy(spin.current)
  })

  return (
    <mesh ref={ref} castShadow visible={false} onPointerDown={(e) => {
      e.stopPropagation()
      startGesture(e, true)
    }}>
      <icosahedronGeometry args={[world.ball.radius, 2]} />
      <meshStandardMaterial map={tex} roughness={0.85} flatShading />
    </mesh>
  )
}

export function kickBall(camera) {
  const ball = world.ball
  const away = new THREE.Vector3().subVectors(ball.pos, camera.position).setY(0).normalize()
  ball.vel.copy(away).multiplyScalar(1.8)
  ball.vy = 2
  sfx.bounce(1)
}

// Swipe: launch the ball along a ground direction. Spawns it at `from` if it
// isn't in play yet.
export function flingBall(from, dir, speed, camera) {
  const ball = world.ball
  if (!ball.active || from) {
    if (from) ball.pos.set(from.x, 0, from.z)
    else {
      // No ground point: launch from just in front of the bunny, camera side.
      const bun = world.bunny.pos
      const toCam = new THREE.Vector3(camera.position.x - bun.x, 0, camera.position.z - bun.z).normalize()
      ball.pos.set(bun.x + toCam.x * 0.5, 0, bun.z + toCam.z * 0.5)
    }
    ball.active = true
    clampToBounds(ball.pos, ball.radius)
    ball.y = Math.max(ball.y, 0.1)
  }
  ball.vel.copy(dir).multiplyScalar(speed)
  ball.vy = 0.8 + speed * 0.35
  sfx.pop()
  fx.burst('sparkle', new THREE.Vector3(ball.pos.x, 0.1, ball.pos.z), 4, { scale: 0.6 })
}

export function throwBall(point) {
  const ball = world.ball
  if (!ball.active) {
    ball.active = true
    ball.pos.set(point.x, 0, point.z)
    clampToBounds(ball.pos, ball.radius)
    ball.y = 1.2
    ball.vy = 0
    ball.vel.set(0, 0, 0)
  } else {
    const dir = new THREE.Vector3(point.x - ball.pos.x, 0, point.z - ball.pos.z)
    ball.vel.copy(dir).multiplyScalar(1.6)
    ball.vy = 1.6
  }
  sfx.pop()
}

function Carrot() {
  return (
    <group rotation={[0, 0, Math.PI / 2]} scale={0.9}>
      <mesh castShadow position={[0, 0, 0]}>
        <coneGeometry args={[0.035, 0.14, 12]} />
        <meshStandardMaterial color="#ff8a2b" roughness={0.6} />
      </mesh>
      <group position={[0, 0.08, 0]}>
        {[-0.4, 0, 0.4].map((a, i) => (
          <mesh key={i} rotation={[0, 0, a]} position={[Math.sin(a) * 0.02, 0.025, 0]}>
            <coneGeometry args={[0.008, 0.06, 5]} />
            <meshStandardMaterial color="#5fb04a" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Bowl({ kind }) {
  const geo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      pts.push(new THREE.Vector2(0.07 + Math.sin(t * Math.PI * 0.5) * 0.06, t * 0.06))
    }
    pts.push(new THREE.Vector2(0.125, 0.06), new THREE.Vector2(0.11, 0.055), new THREE.Vector2(0.08, 0.01), new THREE.Vector2(0, 0.012))
    return new THREE.LatheGeometry(pts, 32)
  }, [])
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial color={kind === 'water' ? '#8ec5e8' : '#f3b6c4'} roughness={0.25} clearcoat={1} side={THREE.DoubleSide} />
      </mesh>
      {kind === 'water' ? (
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.105, 32]} />
          <meshPhysicalMaterial color="#9fe0ff" transmission={0.6} roughness={0.05} transparent opacity={0.85} />
        </mesh>
      ) : (
        <group position={[0, 0.045, 0]}>
          {Array.from({ length: 22 }, (_, i) => {
            const a = i * 2.39
            const r = Math.sqrt(i / 22) * 0.09
            return (
              <mesh key={i} position={[Math.cos(a) * r, (i % 3) * 0.006, Math.sin(a) * r]} rotation={[a, i, 0]}>
                <capsuleGeometry args={[0.008, 0.012, 2, 6]} />
                <meshStandardMaterial color={i % 4 === 0 ? '#9ccc65' : '#c8a165'} roughness={0.8} />
              </mesh>
            )
          })}
        </group>
      )}
    </group>
  )
}

function Item({ item }) {
  const ref = useRef()
  const st = useRef({ y: item.kind === 'treat' ? 1.0 : 0.6, vy: 0, scale: 0, bounced: 0 })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    s.scale = Math.min(1, s.scale + dt * 5)
    if (!item.landed) {
      s.vy += GRAVITY * dt
      s.y += s.vy * dt
      if (s.y <= 0) {
        s.y = 0
        if (s.bounced < 1 && item.kind === 'treat') {
          s.vy = 1.2
          s.bounced++
          sfx.bounce(0.6)
        } else {
          s.vy = 0
          item.landed = true // read by the bunny's brain
          fx.burst('sparkle', new THREE.Vector3(item.x, 0.05, item.z), 4, { scale: 0.6 })
        }
      }
    }
    ref.current.position.set(item.x, s.y + (item.kind === 'treat' ? 0.03 : 0), item.z)
    ref.current.scale.setScalar(s.scale)
    if (item.kind === 'treat') ref.current.rotation.y += dt * (item.landed ? 0 : 6)
  })
  return (
    <group ref={ref} rotation={[0, item.rot || 0, 0]}>
      {item.kind === 'treat' ? <Carrot /> : <Bowl kind={item.kind} />}
    </group>
  )
}

export function Items() {
  const items = useGame((s) => s.items)
  return items.map((it) => <Item key={it.id} item={it} />)
}

// Place a bowl in front of the bunny.
export function placeBowl(kind) {
  const g = useGame.getState()
  const existing = g.items.find((i) => i.kind === kind)
  if (existing) return
  const bun = world.bunny
  const side = kind === 'food' ? 1 : -1
  const p = new THREE.Vector3(
    bun.pos.x + Math.sin(bun.yaw + side * 0.6) * 0.5,
    0,
    bun.pos.z + Math.cos(bun.yaw + side * 0.6) * 0.5
  )
  clampToBounds(p, 0.2)
  g.addItem({ kind, x: p.x, z: p.z, rot: Math.random() * 6, landed: false })
  sfx.pop()
}

export function dropTreat(point) {
  const g = useGame.getState()
  if (g.items.filter((i) => i.kind === 'treat').length >= 3) {
    g.toast('That\'s plenty of treats for now')
    return
  }
  const p = new THREE.Vector3(point.x, 0, point.z)
  clampToBounds(p, 0.1)
  g.addItem({ kind: 'treat', x: p.x, z: p.z, rot: Math.random() * 6, landed: false })
  sfx.pop()
}
