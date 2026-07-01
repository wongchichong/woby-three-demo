/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_collada_skinning

import * as THREE from 'three'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Timer } from 'three/examples/jsm/misc/Timer.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(25, container.clientWidth / container.clientHeight, 1, 1000)
    camera.position.set(15, 10, -15)

    const timer = new Timer()

    let mixer: THREE.AnimationMixer | undefined

    const loader = new ColladaLoader()
    loader.load('https://threejs.org/examples/models/collada/stormtrooper/stormtrooper.dae', (collada) => {
        const avatar = collada.scene
        const animations = avatar.animations

        mixer = new THREE.AnimationMixer(avatar)
        mixer.clipAction(animations[0]).play()

        scene.add(avatar)
    }, undefined, (error) => {
        console.error('Failed to load stormtrooper:', error)
    })

    const gridHelper = new THREE.GridHelper(10, 20, 0xc1c1c1, 0x8d8d8d)
    scene.add(gridHelper)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
    directionalLight.position.set(1.5, 1, -1.5)
    scene.add(directionalLight)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.screenSpacePanning = true
    controls.minDistance = 5
    controls.maxDistance = 40
    controls.target.set(0, 2, 0)
    controls.update()

    renderer.setAnimationLoop(() => {
        timer.update()
        const delta = timer.getDelta()
        if (mixer !== undefined) mixer.update(delta)
        renderer.render(scene, camera)
    })

    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        if (mixer) {
            mixer.stopAllAction()
            mixer.uncacheRoot(scene)
        }
        controls.dispose()
        renderer.dispose()
        timer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLLoaderColladaSkinning() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
