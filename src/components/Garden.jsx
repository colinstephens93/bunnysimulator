import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Sparkles, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ginghamTexture } from '../textures'

const BLANKET = { w: 2.6, d: 2.0, x: 0, z: 0.05 }

function Grass({ count = 3500 }) {
  const ref = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.035, 0.22, 1, 4)
    g.translate(0, 0.11, 0)
    const pos = g.attributes.position
    const colors = []
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 0.22
      pos.setX(i, pos.getX(i) * (1 - y * 0.9)) // taper to a point
      const c = new THREE.Color('#3f7d2c').lerp(new THREE.Color('#b7e07a'), y)
      colors.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float h = position.y / 0.22;
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float w = sin(uTime * 1.6 + wp.x * 1.3 + wp.z * 0.9) + 0.5 * sin(uTime * 3.1 + wp.x * 3.0);
          transformed.x += w * 0.035 * h * h;
          transformed.z += w * 0.02 * h * h;`)
    }
    return m
  }, [uniforms])

  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    let i = 0
    while (i < count) {
      const x = (Math.random() - 0.5) * 14
      const z = -6 + Math.random() * 9
      // Keep the picnic blanket clear.
      if (Math.abs(x - BLANKET.x) < BLANKET.w / 2 + 0.05 && Math.abs(z - BLANKET.z) < BLANKET.d / 2 + 0.05) continue
      o.position.set(x, 0, z)
      o.rotation.set(0, Math.random() * Math.PI, 0)
      o.scale.setScalar(0.7 + Math.random() * 0.8)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
      ref.current.setColorAt(i, c.setHSL(0.24 + Math.random() * 0.06, 0.5, 0.75 + Math.random() * 0.25))
      i++
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count])

  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime })
  return <instancedMesh ref={ref} args={[geo, mat, count]} receiveShadow />
}

function Flowers({ count = 120 }) {
  const heads = useRef()
  const stems = useRef()
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    const palette = ['#ff8fb1', '#fff176', '#ffffff', '#c3a6ff', '#ffb36b']
    let i = 0
    while (i < count) {
      const x = (Math.random() - 0.5) * 12
      const z = -5.5 + Math.random() * 8
      if (Math.abs(x - BLANKET.x) < BLANKET.w / 2 + 0.2 && Math.abs(z - BLANKET.z) < BLANKET.d / 2 + 0.2) continue
      const h = 0.14 + Math.random() * 0.12
      o.position.set(x, h, z)
      o.rotation.set(0, 0, 0)
      o.scale.setScalar(1)
      o.updateMatrix()
      heads.current.setMatrixAt(i, o.matrix)
      heads.current.setColorAt(i, c.set(palette[i % palette.length]))
      o.position.set(x, h / 2, z)
      o.scale.set(1, h, 1)
      o.updateMatrix()
      stems.current.setMatrixAt(i, o.matrix)
      i++
    }
  }, [count])
  return (
    <>
      <instancedMesh ref={heads} args={[null, null, count]} castShadow>
        <icosahedronGeometry args={[0.03, 1]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={stems} args={[null, null, count]}>
        <cylinderGeometry args={[0.004, 0.004, 1, 4]} />
        <meshStandardMaterial color="#4f8f3a" />
      </instancedMesh>
    </>
  )
}

function Tree({ position, scale = 1, tint = '#5aa356' }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 1.4, 8]} />
        <meshStandardMaterial color="#7a5235" roughness={0.9} />
      </mesh>
      {[[0, 1.6, 0, 0.75], [0.35, 1.35, 0.1, 0.5], [-0.35, 1.4, -0.05, 0.55], [0, 2.05, 0, 0.5]].map(([x, y, z, r], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={tint} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Butterfly({ seed }) {
  const ref = useRef()
  const wingL = useRef()
  const wingR = useRef()
  const color = ['#ffb3d1', '#ffe08a', '#b9d7ff'][seed % 3]
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 10
    ref.current.position.set(Math.sin(t * 0.3 + seed) * 2.2, 0.6 + Math.sin(t * 1.3) * 0.25, -0.8 + Math.cos(t * 0.23 + seed * 2) * 1.6)
    ref.current.rotation.y = t * 0.3 + Math.PI / 2
    const flap = Math.sin(t * 16) * 0.9
    wingL.current.rotation.z = flap
    wingR.current.rotation.z = -flap
  })
  return (
    <group ref={ref} scale={0.6}>
      <group ref={wingL}>
        <mesh position={[0.05, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 12]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
      <group ref={wingR}>
        <mesh position={[-0.05, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 12]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  )
}

function Fence() {
  const posts = []
  for (let x = -6; x <= 6; x += 0.6) posts.push(x)
  return (
    <group position={[0, 0, -4.2]}>
      {posts.map((x) => (
        <RoundedBox key={x} args={[0.08, 0.6, 0.06]} radius={0.02} position={[x, 0.3, 0]} castShadow>
          <meshStandardMaterial color="#f3e7d6" roughness={0.8} />
        </RoundedBox>
      ))}
      {[0.18, 0.45].map((y) => (
        <mesh key={y} position={[0, y, 0.04]}>
          <boxGeometry args={[12.2, 0.06, 0.03]} />
          <meshStandardMaterial color="#f3e7d6" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export default function Garden() {
  const gingham = useMemo(ginghamTexture, [])
  return (
    <group>
      <fog attach="fog" args={['#ffd3a8', 9, 26]} />
      <Sky distance={450} sunPosition={[-6, 1.4, -10]} turbidity={6} rayleigh={1.6} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <hemisphereLight args={['#ffe2bf', '#5d7a3a', 0.9]} />
      <directionalLight
        position={[-4, 5, -5]}
        intensity={3}
        color="#ffc488"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <directionalLight position={[3, 3, 5]} intensity={0.8} color="#fff0dd" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial color="#77a94b" roughness={1} />
      </mesh>
      {/* Picnic blanket the bunny plays on */}
      <mesh rotation={[-Math.PI / 2, 0, 0.04]} position={[BLANKET.x, 0.002, BLANKET.z]} receiveShadow>
        <planeGeometry args={[BLANKET.w, BLANKET.d]} />
        <meshStandardMaterial map={gingham} roughness={0.95} />
      </mesh>
      <Grass />
      <Flowers />

      {/* Rolling hills */}
      {[[-9, -14, 7, '#7fb05a'], [3, -16, 9, '#8dbb63'], [13, -12, 6, '#76a453'], [-18, -10, 7, '#86b45e']].map(([x, z, r, c], i) => (
        <mesh key={i} position={[x, -r * 0.75, z]} scale={[1.6, 1, 1]}>
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial color={c} roughness={1} />
        </mesh>
      ))}

      <Tree position={[-3.6, 0, -2.6]} scale={1.2} />
      <Tree position={[3.9, 0, -3.1]} scale={1.4} tint="#4f9650" />
      <Tree position={[-6, 0, -1]} scale={1.1} tint="#68ad5c" />
      <Tree position={[6.2, 0, -0.5]} tint="#5aa356" />
      <Fence />

      {/* Little watering can */}
      <group position={[1.75, 0, -1.4]} rotation={[0, -0.6, 0]}>
        <mesh castShadow position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.11, 0.12, 0.26, 20]} />
          <meshStandardMaterial color="#7fb8c9" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0.16, 0.18, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.015, 0.025, 0.26, 8]} />
          <meshStandardMaterial color="#7fb8c9" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.07, 0.012, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#7fb8c9" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {[0, 1, 2].map((i) => <Butterfly key={i} seed={i} />)}
      <Sparkles count={50} scale={[8, 2, 6]} position={[0, 0.8, -1]} size={2.5} speed={0.3} opacity={0.8} color="#fff3b0" />
    </group>
  )
}
