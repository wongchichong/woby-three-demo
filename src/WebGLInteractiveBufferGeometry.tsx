/** @jsxImportSource @woby/three */
import { $, $$, useEffect } from "woby"
import {
    Color, Fog, Vector2, Vector3, BufferGeometry, BufferAttribute, Raycaster, DoubleSide,
    type PerspectiveCamera as TPerspectiveCamera, type Mesh as TMesh, type Line as TLine,
} from "three"

import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { Event } from '@woby/three/lib/components/Event'

import '@woby/three/src/scenes/Scene'
import '@woby/three/src/cameras/PerspectiveCamera'
import '@woby/three/src/renderers/WebGLRenderer'
import '@woby/three/src/lights/AmbientLight'
import '@woby/three/src/lights/DirectionalLight'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/objects/Line'
import '@woby/three/src/materials/MeshPhongMaterial'
import '@woby/three/src/materials/LineBasicMaterial'

export const WebGLInteractiveBufferGeometry = () => {
    const meshRef = $<TMesh>(null)
    const lineRef = $<TLine>(null)
    const cameraRef = $<TPerspectiveCamera>(null)

    const triangles = 5000
    const meshGeometry = new BufferGeometry()
    const positions = new Float32Array(triangles * 3 * 3)
    const normals = new Float32Array(triangles * 3 * 3)
    const colors = new Float32Array(triangles * 3 * 3)
    const color = new Color()
    const n = 800, n2 = n / 2
    const d = 120, d2 = d / 2
    const pA = new Vector3(); const pB = new Vector3(); const pC = new Vector3()
    const cb = new Vector3(); const ab = new Vector3()

    for (let i = 0; i < positions.length; i += 9) {
        const x = Math.random() * n - n2
        const y = Math.random() * n - n2
        const z = Math.random() * n - n2
        const ax = x + Math.random() * d - d2, ay = y + Math.random() * d - d2, az = z + Math.random() * d - d2
        const bx = x + Math.random() * d - d2, by = y + Math.random() * d - d2, bz = z + Math.random() * d - d2
        const cx = x + Math.random() * d - d2, cy = y + Math.random() * d - d2, cz = z + Math.random() * d - d2
        positions[i] = ax; positions[i + 1] = ay; positions[i + 2] = az
        positions[i + 3] = bx; positions[i + 4] = by; positions[i + 5] = bz
        positions[i + 6] = cx; positions[i + 7] = cy; positions[i + 8] = cz
        pA.set(ax, ay, az); pB.set(bx, by, bz); pC.set(cx, cy, cz)
        cb.subVectors(pC, pB); ab.subVectors(pA, pB); cb.cross(ab); cb.normalize()
        const nx = cb.x, ny = cb.y, nz = cb.z
        normals[i] = nx; normals[i + 1] = ny; normals[i + 2] = nz
        normals[i + 3] = nx; normals[i + 4] = ny; normals[i + 5] = nz
        normals[i + 6] = nx; normals[i + 7] = ny; normals[i + 8] = nz
        const vx = (x / n) + 0.5, vy = (y / n) + 0.5, vz = (z / n) + 0.5
        color.setRGB(vx, vy, vz)
        colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b
        colors[i + 3] = color.r; colors[i + 4] = color.g; colors[i + 5] = color.b
        colors[i + 6] = color.r; colors[i + 7] = color.g; colors[i + 8] = color.b
    }
    meshGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    meshGeometry.setAttribute('normal', new BufferAttribute(normals, 3))
    meshGeometry.setAttribute('color', new BufferAttribute(colors, 3))
    meshGeometry.computeBoundingSphere()

    const lineGeometry = new BufferGeometry()
    lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(4 * 3), 3))

    const raycaster = new Raycaster()
    const pointer = new Vector2()

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener('pointermove', onPointerMove)
        return () => window.removeEventListener('pointermove', onPointerMove)
    })

    const onMeshFrame = (mesh: TMesh) => {
        const camera = $$(cameraRef); const line = $$(lineRef); if (!camera || !line) return
        const time = Date.now() * 0.001
        mesh.rotation.x = time * 0.15
        mesh.rotation.y = time * 0.25
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObject(mesh)
        if (intersects.length > 0) {
            const intersect = intersects[0]
            const face = intersect.face!
            const linePosition = line.geometry.attributes.position as BufferAttribute
            const meshPosition = mesh.geometry.attributes.position as BufferAttribute
            linePosition.copyAt(0, meshPosition, face.a)
            linePosition.copyAt(1, meshPosition, face.b)
            linePosition.copyAt(2, meshPosition, face.c)
            linePosition.copyAt(3, meshPosition, face.a)
            mesh.updateMatrix()
            line.geometry.applyMatrix4(mesh.matrix)
            line.visible = true
        } else {
            line.visible = false
        }
    }

    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene background={new Color(0x050505)} fog={new Fog(0x050505, 2000, 3500)}>
            <ambientLight color={0x444444} intensity={3} />
            <directionalLight color={0xffffff} intensity={1.5} position={[1, 1, 1]} />
            <directionalLight color={0xffffff} intensity={4.5} position={[0, -1, 0]} />
            <mesh ref={meshRef} geometry={meshGeometry} onFrame={onMeshFrame}>
                <meshPhongMaterial color={0xaaaaaa} specular={0xffffff} shininess={250} side={DoubleSide} vertexColors />
            </mesh>
            <line ref={lineRef} geometry={lineGeometry}>
                <lineBasicMaterial color={0xffffff} transparent />
            </line>
        </scene>
        <perspectiveCamera ref={cameraRef} args={[27, window.innerWidth / window.innerHeight, 1, 3500]} position={[0, 0, 2750]} />
        <Event />
    </Canvas3D>
}

export default WebGLInteractiveBufferGeometry
