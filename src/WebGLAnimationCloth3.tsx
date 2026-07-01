/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_cloth3

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const Nx = 20, Ny = 20
const clothW = 8, clothH = 5
const startX = -5, startY = 10
const numX = Nx + 1
const totalParticles = numX * (Ny + 1)

type Constraint = { a: number; b: number; restLength: number }

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 500)
    camera.position.set(0, 4, 15)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 3, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    const dirLight = new THREE.DirectionalLight(0xfff8e7, 1.2)
    dirLight.position.set(5, 15, 8)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshLambertMaterial({ color: 0x88aa66 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 80 })
    )
    pole.position.set(-5, 5, 0)
    pole.castShadow = true
    scene.add(pole)

    // Cloth simulation
    const positions = new Float32Array(totalParticles * 3)
    const prevPositions = new Float32Array(totalParticles * 3)
    const pinnedOriginal = new Float32Array(totalParticles * 3)
    const pinned = new Uint8Array(totalParticles)
    const constraints: Constraint[] = []
    const params = { windStrength: 0.5, gravity: 9.8, damping: 0.99 }
    let clothGeo: THREE.BufferGeometry

    const dist3 = (ai: number, bi: number): number => {
        const dx = positions[ai * 3] - positions[bi * 3]
        const dy = positions[ai * 3 + 1] - positions[bi * 3 + 1]
        const dz = positions[ai * 3 + 2] - positions[bi * 3 + 2]
        return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    for (let iy = 0; iy <= Ny; iy++) for (let ix = 0; ix <= Nx; ix++) {
        const idx = iy * numX + ix
        const x = startX + (ix / Nx) * clothW
        const y = startY - (iy / Ny) * clothH
        positions[idx * 3] = x; positions[idx * 3 + 1] = y; positions[idx * 3 + 2] = 0
        prevPositions[idx * 3] = x; prevPositions[idx * 3 + 1] = y; prevPositions[idx * 3 + 2] = 0
        pinnedOriginal[idx * 3] = x; pinnedOriginal[idx * 3 + 1] = y; pinnedOriginal[idx * 3 + 2] = 0
        if (ix === 0) pinned[idx] = 1
    }
    for (let iy = 0; iy <= Ny; iy++) for (let ix = 0; ix <= Nx; ix++) {
        const idx = iy * numX + ix
        if (ix < Nx) constraints.push({ a: idx, b: idx + 1, restLength: dist3(idx, idx + 1) })
        if (iy < Ny) constraints.push({ a: idx, b: idx + numX, restLength: dist3(idx, idx + numX) })
        if (ix < Nx && iy < Ny) constraints.push({ a: idx, b: idx + numX + 1, restLength: dist3(idx, idx + numX + 1) })
        if (ix > 0 && iy < Ny) constraints.push({ a: idx, b: idx + numX - 1, restLength: dist3(idx, idx + numX - 1) })
        if (ix < Nx - 1) constraints.push({ a: idx, b: idx + 2, restLength: dist3(idx, idx + 2) })
        if (iy < Ny - 1) constraints.push({ a: idx, b: idx + numX * 2, restLength: dist3(idx, idx + numX * 2) })
    }

    const vertexCount = (Nx + 1) * (Ny + 1)
    const posArray = new Float32Array(vertexCount * 3)
    const colorArray = new Float32Array(vertexCount * 3)
    const indexArray = new Uint32Array(Nx * Ny * 6)
    for (let iy = 0; iy <= Ny; iy++) for (let ix = 0; ix <= Nx; ix++) {
        const idx = iy * numX + ix
        posArray[idx * 3] = positions[idx * 3]
        posArray[idx * 3 + 1] = positions[idx * 3 + 1]
        posArray[idx * 3 + 2] = positions[idx * 3 + 2]
        const stripeIdx = Math.floor((iy / Ny) * 5)
        if (stripeIdx % 2 === 0) { colorArray[idx * 3] = 0.85; colorArray[idx * 3 + 1] = 0.05; colorArray[idx * 3 + 2] = 0.05 }
        else { colorArray[idx * 3] = 1; colorArray[idx * 3 + 1] = 1; colorArray[idx * 3 + 2] = 1 }
    }
    let iIdx = 0
    for (let iy = 0; iy < Ny; iy++) for (let ix = 0; ix < Nx; ix++) {
        const a = iy * numX + ix, b = a + 1, c = (iy + 1) * numX + ix, d = c + 1
        indexArray[iIdx++] = a; indexArray[iIdx++] = b; indexArray[iIdx++] = c
        indexArray[iIdx++] = b; indexArray[iIdx++] = d; indexArray[iIdx++] = c
    }
    clothGeo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(posArray, 3); posAttr.setUsage(THREE.DynamicDrawUsage)
    clothGeo.setAttribute('position', posAttr)
    clothGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
    clothGeo.setIndex(new THREE.BufferAttribute(indexArray, 1))
    clothGeo.computeVertexNormals()
    const cloth = new THREE.Mesh(clothGeo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }))
    cloth.castShadow = true; cloth.receiveShadow = true
    scene.add(cloth)

    const panel = new GUI()
    panel.add(params, 'windStrength', 0, 2, 0.01).name('Wind Strength')
    panel.add(params, 'gravity', 0, 20, 0.1).name('Gravity')
    panel.add(params, 'damping', 0.9, 1.0, 0.001).name('Damping')

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const t = performance.now() * 0.001
        const dt = 1 / 60, dt2 = dt * dt
        const gravAccel = params.gravity * 0.3
        const accX = Math.sin(t * 1.5) * params.windStrength + Math.sin(t * 3.7 + 0.5) * params.windStrength * 0.3
        const accY = -gravAccel
        const accZ = Math.cos(t * 2.9) * params.windStrength * 0.2

        for (let i = 0; i < totalParticles; i++) {
            if (pinned[i]) continue
            const px = positions[i * 3], py = positions[i * 3 + 1], pz = positions[i * 3 + 2]
            const ppx = prevPositions[i * 3], ppy = prevPositions[i * 3 + 1], ppz = prevPositions[i * 3 + 2]
            const nx = 2 * px - ppx + accX * dt2
            const ny = 2 * py - ppy + accY * dt2
            const nz = 2 * pz - ppz + accZ * dt2
            prevPositions[i * 3] = px; prevPositions[i * 3 + 1] = py; prevPositions[i * 3 + 2] = pz
            positions[i * 3] = nx; positions[i * 3 + 1] = ny; positions[i * 3 + 2] = nz
            const damp = 1 - params.damping
            prevPositions[i * 3] += (positions[i * 3] - prevPositions[i * 3]) * damp
            prevPositions[i * 3 + 1] += (positions[i * 3 + 1] - prevPositions[i * 3 + 1]) * damp
            prevPositions[i * 3 + 2] += (positions[i * 3 + 2] - prevPositions[i * 3 + 2]) * damp
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
        const bufArr = (clothGeo.attributes.position as THREE.BufferAttribute).array as Float32Array
        for (let i = 0; i < totalParticles; i++) {
            bufArr[i * 3] = positions[i * 3]
            bufArr[i * 3 + 1] = positions[i * 3 + 1]
            bufArr[i * 3 + 2] = positions[i * 3 + 2]
        }
        ;(clothGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true
        clothGeo.computeVertexNormals()

        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        panel.destroy()
        controls.dispose()
        clothGeo.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationCloth3() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
