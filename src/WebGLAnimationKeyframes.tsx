/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_keyframes

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) {
        _cleanupFn()
        _cleanupFn = undefined
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 100)
    camera.position.set(5, 2, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0.7, 0)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(-0.8, 0.19, 0.56).normalize()
    scene.add(dirLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://threejs.org/examples/jsm/libs/draco/gltf/')

    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    let mixer: THREE.AnimationMixer | null = null
    const clock = new THREE.Clock()

    gltfLoader.load(
        'https://threejs.org/examples/models/gltf/LittlestTokyo.glb',
        (gltf) => {
            const model = gltf.scene
            model.position.set(1, 1, 0)
            model.scale.set(0.01, 0.01, 0.01)
            scene.add(model)

            mixer = new THREE.AnimationMixer(model)
            mixer.clipAction(gltf.animations[0]).play()
        },
        undefined,
        (e) => console.error('GLTF load error:', e)
    )

    const onResize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const delta = clock.getDelta()
        if (mixer) mixer.update(delta)
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        dracoLoader.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationKeyframes() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
