import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pooled, instanced particle bursts. Anything can call fx.burst(...) and the
// <Particles/> component drains the queue inside the render loop.
const queue = []
export const fx = {
  burst(type, pos, count = 1, opts = {}) {
    queue.push({ type, pos: pos.clone ? pos.clone() : new THREE.Vector3(...pos), count, opts })
  }
}

function heartGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.35)
  s.bezierCurveTo(-0.15, -0.15, -0.5, 0.0, -0.5, 0.28)
  s.bezierCurveTo(-0.5, 0.55, -0.15, 0.62, 0, 0.38)
  s.bezierCurveTo(0.15, 0.62, 0.5, 0.55, 0.5, 0.28)
  s.bezierCurveTo(0.5, 0.0, 0.15, -0.15, 0, -0.35)
  const g = new THREE.ShapeGeometry(s, 10)
  return g
}

function starGeometry() {
  const s = new THREE.Shape()
  const pts = 8
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2 + Math.PI / 2
    const r = i % 2 === 0 ? 0.5 : 0.14
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)
  }
  return new THREE.ShapeGeometry(s)
}

const TYPES = {
  heart: {
    geo: heartGeometry,
    max: 80,
    colors: ['#ff6b9a', '#ff8fb3', '#ff4f86', '#ffb3c9'],
    life: [1.0, 1.5],
    size: [0.06, 0.1],
    vel: (v) => v.set((Math.random() - 0.5) * 0.4, 0.45 + Math.random() * 0.35, (Math.random() - 0.5) * 0.4),
    gravity: 0.25,
    drag: 0.6,
    billboard: true,
    glow: 1.4
  },
  sparkle: {
    geo: starGeometry,
    max: 80,
    colors: ['#fff6c2', '#ffe27a', '#ffffff', '#ffd1f0'],
    life: [0.5, 0.9],
    size: [0.05, 0.09],
    vel: (v) => v.set((Math.random() - 0.5) * 1.2, Math.random() * 1.0 + 0.2, (Math.random() - 0.5) * 1.2),
    gravity: -0.6,
    drag: 2.2,
    billboard: true,
    spin: 4,
    glow: 3
  },
  puff: {
    geo: () => new THREE.IcosahedronGeometry(0.5, 1),
    max: 60,
    colors: ['#fff4e2', '#f6e3c4', '#ffffff'],
    life: [0.9, 1.6],
    size: [0.025, 0.05],
    vel: (v) => v.set((Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5),
    gravity: 0.05,
    drag: 1.2,
    glow: 1
  },
  grump: {
    geo: () => new THREE.IcosahedronGeometry(0.5, 1),
    max: 30,
    colors: ['#9a8f86', '#b5aca4', '#80766e'],
    life: [0.6, 1.0],
    size: [0.04, 0.07],
    vel: (v) => v.set((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.4, (Math.random() - 0.5) * 0.8),
    gravity: 0.1,
    drag: 1.8,
    glow: 1
  },
  crumb: {
    geo: () => new THREE.BoxGeometry(0.5, 0.5, 0.5),
    max: 60,
    colors: ['#ff9b3d', '#f57c1f', '#8bc34a', '#e8c48a'],
    life: [0.5, 0.8],
    size: [0.012, 0.022],
    vel: (v) => v.set((Math.random() - 0.5) * 0.7, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.7),
    gravity: -3.5,
    drag: 0.2,
    spin: 8,
    glow: 1
  },
  confetti: {
    geo: () => new THREE.PlaneGeometry(1, 0.55),
    max: 160,
    colors: ['#ff6b9a', '#ffd166', '#7bdff2', '#b2f7a1', '#c3a6ff', '#ffffff'],
    life: [1.6, 2.4],
    size: [0.025, 0.04],
    vel: (v) => {
      const a = Math.random() * Math.PI * 2
      const r = 0.4 + Math.random() * 1.0
      return v.set(Math.cos(a) * r, 1.6 + Math.random() * 1.4, Math.sin(a) * r)
    },
    gravity: -2.2,
    drag: 1.4,
    spin: 9,
    glow: 1.2
  },
  drop: {
    geo: () => new THREE.SphereGeometry(0.5, 8, 6),
    max: 30,
    colors: ['#9fdcff', '#c9ecff'],
    life: [0.35, 0.6],
    size: [0.01, 0.018],
    vel: (v) => v.set((Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 0.5),
    gravity: -3.5,
    drag: 0.2,
    glow: 1.2
  }
}

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()

function ParticleType({ type, cfg }) {
  const mesh = useRef()
  const geo = useMemo(() => cfg.geo(), [cfg])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), [])
  const pool = useMemo(() => Array.from({ length: cfg.max }, () => ({
    alive: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, max: 1, size: 0.05, rot: 0, spin: 0, axis: new THREE.Vector3(0, 0, 1)
  })), [cfg])
  const cursor = useRef(0)

  useLayoutEffect(() => {
    // Allocate instance colors up front so the shader compiles with them.
    for (let i = 0; i < cfg.max; i++) mesh.current.setColorAt(i, tmpColor.set('#ffffff'))
    tmpObj.scale.setScalar(0)
    tmpObj.updateMatrix()
    for (let i = 0; i < cfg.max; i++) mesh.current.setMatrixAt(i, tmpObj.matrix)
  }, [cfg])

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const m = mesh.current
    if (!m) return
    // Spawn queued bursts of this type.
    for (let qi = queue.length - 1; qi >= 0; qi--) {
      const q = queue[qi]
      if (q.type !== type) continue
      queue.splice(qi, 1)
      for (let i = 0; i < q.count; i++) {
        const idx = cursor.current
        const p = pool[idx]
        cursor.current = (cursor.current + 1) % pool.length
        p.alive = true
        p.pos.copy(q.pos).add(new THREE.Vector3((Math.random() - 0.5) * (q.opts.spread ?? 0.05), (Math.random() - 0.5) * (q.opts.spread ?? 0.05), (Math.random() - 0.5) * (q.opts.spread ?? 0.05)))
        cfg.vel(p.vel)
        if (q.opts.speed) p.vel.multiplyScalar(q.opts.speed)
        p.max = p.life = cfg.life[0] + Math.random() * (cfg.life[1] - cfg.life[0])
        p.size = (cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0])) * (q.opts.scale ?? 1)
        p.rot = Math.random() * Math.PI * 2
        p.spin = (Math.random() - 0.5) * (cfg.spin || 0.6)
        p.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
        const col = q.opts.color || cfg.colors[Math.floor(Math.random() * cfg.colors.length)]
        tmpColor.set(col).multiplyScalar(cfg.glow)
        m.setColorAt(idx, tmpColor)
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }

    let n = 0
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]
      if (p.alive) {
        p.life -= dt
        if (p.life <= 0) p.alive = false
      }
      if (!p.alive) {
        tmpObj.scale.setScalar(0)
        tmpObj.updateMatrix()
        m.setMatrixAt(i, tmpObj.matrix)
        continue
      }
      n++
      p.vel.y += cfg.gravity * dt
      p.vel.multiplyScalar(Math.max(0, 1 - cfg.drag * dt))
      p.pos.addScaledVector(p.vel, dt)
      p.rot += p.spin * dt
      const age = 1 - p.life / p.max
      // Pop in, then shrink out.
      const s = p.size * Math.min(1, age * 6) * (age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1)
      tmpObj.position.copy(p.pos)
      if (cfg.billboard) {
        tmpObj.quaternion.copy(camera.quaternion)
        tmpObj.rotateZ(Math.sin(p.rot) * 0.35)
      } else {
        tmpObj.quaternion.setFromAxisAngle(p.axis, p.rot)
      }
      tmpObj.scale.setScalar(s)
      tmpObj.updateMatrix()
      m.setMatrixAt(i, tmpObj.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    m.visible = n > 0
  })

  return <instancedMesh ref={mesh} args={[geo, mat, cfg.max]} frustumCulled={false} renderOrder={10} />
}

export default function Particles() {
  return (
    <>
      {Object.entries(TYPES).map(([type, cfg]) => <ParticleType key={type} type={type} cfg={cfg} />)}
    </>
  )
}
