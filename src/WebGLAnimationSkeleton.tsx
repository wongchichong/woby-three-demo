/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_skeleton

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222233)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(0, 10, 40)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)

    // Build procedural skinned cylinder with bones
    const boneCount = 5
    const boneSpacing = 4
    const bones: THREE.Bone[] = []
    for (let i = 0; i < boneCount; i++) {
        const bone = new THREE.Bone()
        bone.name = `bone_${i}`
        if (i === 0) bone.position.y = -10
        else {
            bone.position.y = boneSpacing
            bones[i - 1].add(bone)
        }
        bones.push(bone)
    }

    const geometry = new THREE.CylinderGeometry(1, 1, 20, 5, 30, true)
    const positionAttr = geometry.attributes.position
    const vertexCount = positionAttr.count
    const skinIndices: number[] = []
    const skinWeights: number[] = []
    for (let i = 0; i < vertexCount; i++) {
        const y = positionAttr.getY(i)
        const slot = (y - (-10)) / boneSpacing
        let idx0: number, idx1: number, weight0: number, weight1: number
        if (slot <= 0) { idx0 = 0; idx1 = 1; weight0 = 1; weight1 = 0 }
        else if (slot >= boneCount - 1) { idx0 = boneCount - 2; idx1 = boneCount - 1; weight0 = 0; weight1 = 1 }
        else { idx0 = Math.floor(slot); idx1 = idx0 + 1; const t = slot - idx0; weight0 = 1 - t; weight1 = t }
        skinIndices.push(idx0, idx1, 0, 0)
        skinWeights.push(weight0, weight1, 0, 0)
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

    const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, color: 0x88aaff })
    const mesh = new THREE.SkinnedMesh(geometry, material)
    const skeleton = new THREE.Skeleton(bones)
    mesh.add(bones[0])
    mesh.bind(skeleton)
    scene.add(mesh)

    const skeletonHelper = new THREE.SkeletonHelper(mesh)
    scene.add(skeletonHelper)

    // GUI bone rotation controls
    const panel = new GUI()
    const guiParams: Record<string, number> = {}
    for (let i = 0; i < bones.length; i++) {
        guiParams[`bone ${i} rotX`] = 0
        panel.add(guiParams, `bone ${i} rotX`, -Math.PI / 4, Math.PI / 4, 0.001).onChange((v: number) => {
            bones[i].rotation.x = v
        })
    }

    const clock = new THREE.Clock()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const time = clock.getElapsedTime()
        for (let i = 1; i < bones.length; i++) {
            bones[i].rotation.z = Math.sin(time + i) * 0.3
        }
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
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationSkeleton() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
