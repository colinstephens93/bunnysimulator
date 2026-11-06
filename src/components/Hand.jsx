import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function Hand({ tool, onStroke }) {
  const mesh = useRef()
  const { camera, gl, scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const pointer = useRef(new THREE.Vector2())
  const target = useRef(new THREE.Vector3())
  const isDown = useRef(false)

  useEffect(() => {
    const handlePointer = (e, down) => {
      const rect = gl.domElement.getBoundingClientRect()
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      isDown.current = down
      if (down && onStroke) onStroke(pointer.current, tool)
    }

    const onMove = (e) => handlePointer(e, isDown.current)
    const onDown = (e) => handlePointer(e, true)
    const onUp = () => { isDown.current = false }

    gl.domElement.addEventListener('pointermove', onMove)
    gl.domElement.addEventListener('pointerdown', onDown)
    gl.domElement.addEventListener('pointerup', onUp)
    gl.domElement.addEventListener('pointerleave', onUp)

    return () => {
      gl.domElement.removeEventListener('pointermove', onMove)
      gl.domElement.removeEventListener('pointerdown', onDown)
      gl.domElement.removeEventListener('pointerup', onUp)
      gl.domElement.removeEventListener('pointerleave', onUp)
    }
  }, [gl, onStroke, tool])

  useFrame(() => {
    if (!mesh.current) return
    raycaster.current.setFromCamera(pointer.current, camera)
    const intersects = raycaster.current.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
      target.current.copy(intersects[0].point)
      target.current.y += 0.08
    }
    mesh.current.position.lerp(target.current, 0.25)
  })

  return (
    <mesh ref={mesh} visible={true}>
      {tool === 'hand' ? (
        <sphereGeometry args={[0.07, 16, 16]} />
      ) : (
        <boxGeometry args={[0.04, 0.18, 0.04]} />
      )}
      <meshStandardMaterial color={tool === 'hand' ? '#f0c9a0' : '#8b5a2b'} />
    </mesh>
  )
}
