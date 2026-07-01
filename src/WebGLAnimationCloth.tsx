/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_cloth

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | undefined

const xSegs = 20, ySegs = 20
const clothWidth = 10, clothHeight = 10
const startY = 20
const numX = xSegs + 1, numY = ySegs + 1
const totalParticles = numX * numY

type Constraint = { a: number; b: number; restLength: number }

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 15, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 10, 0)

    scene.add(new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.8))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(1, 2, 1)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Cloth simulation
    const positions = new Float32Array(totalParticles * 3)
    const prevPositions = new Float32Array(totalParticles * 3)
    const forces = new Float32Array(totalParticles * 3)
    const pinned = new Uint8Array(totalParticles)
    const pinnedOriginal = new Float32Array(totalParticles * 3)
    const constraints: Constraint[] = []

    const dist3 = (ai: number, bi: number): number => {
        const dx = positions[ai * 3] - positions[bi * 3]
        const dy = positions[ai * 3 + 1] - positions[bi * 3 + 1]
        const dz = positions[ai * 3 + 2] - positions[bi * 3 + 2]
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    const clothGeo = new THREE.PlaneGeometry(clothWidth, clothHeight, xSegs, ySegs)
    const clothMat = new THREE.MeshLambertMaterial({ color: 0xcc4444, side: THREE.DoubleSide })
    const clothMesh = new THREE.Mesh(clothGeo, clothMat)
    clothMesh.castShadow = true
    clothMesh.receiveShadow = true
    scene.add(clothMesh)

    for (let iy = 0; iy <= ySegs; iy++) {
        for (let ix = 0; ix <= xSegs; ix++) {
            const idx = iy * numX + ix
            const x = (ix / xSegs - 0.5) * clothWidth
            const y = startY - (iy / ySegs) * clothHeight
            positions[idx * 3] = x; positions[idx * 3 + 1] = y; positions[idx * 3 + 2] = 0
            prevPositions[idx * 3] = x; prevPositions[idx * 3 + 1] = y; prevPositions[idx * 3 + 2] = 0
            if (iy === 0) pinned[idx] = 1
        }
    }
    for (let iy = 0; iy <= ySegs; iy++) for (let ix = 0; ix <= xSegs; ix++) {
        const idx = iy * numX + ix
        if (ix < xSegs) constraints.push({ a: idx, b: idx + 1, restLength: dist3(idx, idx + 1) })
        if (iy < ySegs) constraints.push({ a: idx, b: idx + numX, restLength: dist3(idx, idx + numX) })
        if (ix < xSegs && iy < ySegs) constraints.push({ a: idx, b: idx + numX + 1, restLength: dist3(idx, idx + numX + 1) })
        if (ix > 0 && iy < ySegs) constraints.push({ a: idx, b: idx + numX - 1, restLength: dist3(idx, idx + numX - 1) })
    }
    pinnedOriginal.set(positions)

    const gravity = new THREE.Vector3(0, -0.2, 0)
    const dt = 1 / 60
    const dt2 = dt * dt

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const time = performance.now()
        const t = time * 0.001
        for (let i = 0; i < totalParticles; i++) {
            if (pinned[i]) continue
            forces[i * 3] = gravity.x + Math.sin(t * 1.5) * 0.5
            forces[i * 3 + 1] = gravity.y
            forces[i * 3 + 2] = gravity.z + Math.cos(t * 1.1) * 0.3
        }
        for (let i = 0; i < totalParticles; i++) {
            if (pinned[i]) continue
            const px = positions[i * 3], py = positions[i * 3 + 1], pz = positions[i * 3 + 2]
            const ppx = prevPositions[i * 3], ppy = prevPositions[i * 3 + 1], ppz = prevPositions[i * 3 + 2]
            const fx = forces[i * 3], fy = forces[i * 3 + 1], fz = forces[i * 3 + 2]
            const nx = 2 * px - ppx + fx * dt2
            const ny = 2 * py - ppy + fy * dt2
            const nz = 2 * pz - ppz + fz * dt2
            prevPositions[i * 3] = px; prevPositions[i * 3 + 1] = py; prevPositions[i * 3 + 2] = pz
            positions[i * 3] = nx; positions[i * 3 + 1] = ny; positions[i * 3 + 2] = nz
        }
        for (let iter = 0; iter < 3; iter++) {
            for (let c = 0; c < constraints.length; c++) {
                const { a, b, restLength } = constraints[c]
                const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
                const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2]
                const dx = bx - ax, dy = by - ay, dz = bz - az
                const cur = Math.sqrt(dx * dx + dy * dy + dz * dz)
                if (cur === 0) continue
                const diff = (cur - restLength) / cur
                const corrX = dx * diff * 0.5, corrY = dy * diff * 0.5, corrZ = dz * diff * 0.5
                if (!pinned[a]) { positions[a * 3] += corrX; positions[a * 3 + 1] += corrY; positions[a * 3 + 2] += corrZ }
                if (!pinned[b]) { positions[b * 3] -= corrX; positions[b * 3 + 1] -= corrY; positions[b * 3 + 2] -= corrZ }
            }
            for (let i = 0; i < totalParticles; i++) {
                if (pinned[i]) {
                    positions[i * 3] = pinnedOriginal[i * 3]
                    positions[i * 3 + 1] = pinnedOriginal[i * 3 + 1]
                    positions[i * 3 + 2] = pinnedOriginal[i * 3 + 2]
                }
            }
        }
        const posAttr = clothGeo.attributes.position as THREE.BufferAttribute
        const posArray = posAttr.array as Float32Array
        for (let i = 0; i < totalParticles; i++) {
            posArray[i * 3] = positions[i * 3]
            posArray[i * 3 + 1] = positions[i * 3 + 1]
            posArray[i * 3 + 2] = positions[i * 3 + 2]
        }
        posAttr.needsUpdate = true
        clothGeo.computeVertexNormals()
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        clothGeo.dispose()
        clothMat.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationCloth() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}