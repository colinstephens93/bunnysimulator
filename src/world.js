import * as THREE from 'three'

// Play-area limits for each scene (bunny + toys stay inside these).
export const BOUNDS = {
  bedroom: { minX: -1.45, maxX: 1.45, minZ: -0.75, maxZ: 1.2 },
  garden: { minX: -2.4, maxX: 2.4, minZ: -2.0, maxZ: 1.5 }
}

// Mutable, per-frame shared state. Lives outside React so the render loop can
// read/write it without triggering re-renders.
export const world = {
  scene: 'bedroom',
  bounds: BOUNDS.bedroom,
  bunny: {
    pos: new THREE.Vector3(0, 0, 0.15),
    yaw: 0,
    head: new THREE.Vector3(0, 0.45, 0.15)
  },
  ball: {
    active: false,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    y: 0,
    vy: 0,
    radius: 0.075
  },
  petting: false,
  started: false,
  controls: null,
  commands: []
}

export function sendCommand(cmd) {
  world.commands.push(cmd)
}

export function clampToBounds(v, margin = 0) {
  const b = world.bounds
  v.x = THREE.MathUtils.clamp(v.x, b.minX + margin, b.maxX - margin)
  v.z = THREE.MathUtils.clamp(v.z, b.minZ + margin, b.maxZ - margin)
  return v
}

export function setScene(scene) {
  world.scene = scene
  world.bounds = BOUNDS[scene]
  clampToBounds(world.bunny.pos, 0.2)
  world.ball.active = false
}
