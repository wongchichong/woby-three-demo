/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_fbx_nurbs

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa0a0a0)
    scene.fog = new THREE.Fog(0xa0a0a0, 1, 1000)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000)
    camera.position.set(2, 18, 28)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(0, 20, 10)
    scene.add(dirLight)

    const grid = new THREE.GridHelper(28, 28, 0x303030, 0x303030)
    scene.add(grid)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 12, 0)
    controls.update()

    const loader = new FBXLoader()
    loader.load('https://threejs.org/examples/models/fbx/nurbs.fbx', (object) => {
        scene.add(object)
    }, undefined, (error) => {
        console.error('Failed to load FBX:', error)
    })

    renderer.setAnimationLoop(() => {
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
        controls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLLoaderFBXNurbs() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
