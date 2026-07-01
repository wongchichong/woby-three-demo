/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_morphtargets

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(3, 3, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Build morph target geometry
    const SPHERE_RADIUS = 2
    const corners: THREE.Vector3[] = []
    for (let xs = -1; xs <= 1; xs += 2) {
        for (let ys = -1; ys <= 1; ys += 2) {
            for (let zs = -1; zs <= 1; zs += 2) {
                corners.push(new THREE.Vector3(xs, ys, zs).normalize().multiplyScalar(SPHERE_RADIUS))
            }
        }
    }

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    geometry.morphAttributes.position = []
    const vertexCount = geometry.attributes.position.count

    for (let i = 0; i < 8; i++) {
        const target = corners[i]
        const morphArr = new Float32Array(vertexCount * 3)
        for (let v = 0; v < vertexCount; v++) {
            morphArr[v * 3 + 0] = target.x
            morphArr[v * 3 + 1] = target.y
            morphArr[v * 3 + 2] = target.z
        }
        const attr = new THREE.BufferAttribute(morphArr, 3)
        attr.name = `morph_${i}`
        geometry.morphAttributes.position.push(attr)
    }

    const mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial())
    mesh.morphTargetInfluences = [1, 0, 0, 0, 0, 0, 0, 0]
    mesh.morphTargetDictionary = {}
    for (let i = 0; i < 8; i++) {
        mesh.morphTargetDictionary[`morph_${i}`] = i
    }
    scene.add(mesh)

    const panel = new GUI()
    const folder = panel.addFolder('Morph Target Influences')
    for (let i = 0; i < 8; i++) {
        folder.add(mesh.morphTargetInfluences as number[], i, 0, 1, 0.01).name(`morph_${i}`)
    }
    folder.open()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        mesh.rotation.x += 0.005
        mesh.rotation.y += 0.01
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
        geometry.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationMorphTargets() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
