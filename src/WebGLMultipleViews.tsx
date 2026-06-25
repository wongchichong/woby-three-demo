/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

interface ViewInfo {
    left: number
    bottom: number
    width: number
    height: number
    background: THREE.Color
    eye: [number, number, number]
    up: [number, number, number]
    fov: number
    updateCamera: (camera: THREE.PerspectiveCamera, scene: THREE.Scene, mouseX: number) => void
    camera?: THREE.PerspectiveCamera
}

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const views: ViewInfo[] = [
        {
            left: 0, bottom: 0.5, width: 0.5, height: 0.5,
            background: new THREE.Color(0.5, 0.5, 0.7),
            eye: [0, 300, 1800],
            up: [0, 1, 0],
            fov: 30,
            updateCamera: (camera, scene, mouseX) => {
                camera.position.x += mouseX * 0.05
                camera.position.x = Math.max(Math.min(camera.position.x, 2000), -2000)
                camera.lookAt(scene.position)
            },
        },
        {
            left: 0.5, bottom: 0.5, width: 0.5, height: 0.5,
            background: new THREE.Color(0.7, 0.5, 0.5),
            eye: [0, 1800, 0],
            up: [0, 0, 1],
            fov: 45,
            updateCamera: (camera, scene, _mouseX) => {
                camera.lookAt(scene.position)
            },
        },
        {
            left: 0, bottom: 0, width: 0.5, height: 0.5,
            background: new THREE.Color(0.5, 0.7, 0.7),
            eye: [1400, 800, 1400],
            up: [0, 1, 0],
            fov: 60,
            updateCamera: (camera, scene, _mouseX) => {
                camera.lookAt(scene.position)
            },
        },
        {
            left: 0.5, bottom: 0, width: 0.5, height: 0.5,
            background: new THREE.Color(0.7, 0.7, 0.5),
            eye: [-1400, 800, -1400],
            up: [0, 1, 0],
            fov: 60,
            updateCamera: (camera, scene, _mouseX) => {
                camera.lookAt(scene.position)
            },
        },
    ]

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight

    for (const v of views) {
        const cam = new THREE.PerspectiveCamera(v.fov, w / h, 1, 10000)
        cam.position.fromArray(v.eye)
        cam.up.fromArray(v.up)
        v.camera = cam
    }

    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(0, 0, 1)
    scene.add(light)

    // Geometry: torus + sphere
    const radius = 200
    const geometry1 = new THREE.IcosahedronGeometry(radius, 1)
    const material1 = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, vertexColors: false })
    const mesh1 = new THREE.Mesh(geometry1, material1)
    mesh1.position.set(0, 0, 0)
    scene.add(mesh1)

    const geometry2 = new THREE.TorusGeometry(radius * 0.5, radius * 0.15, 16, 50)
    const material2 = new THREE.MeshPhongMaterial({ color: 0xff8800, flatShading: false })
    const mesh2 = new THREE.Mesh(geometry2, material2)
    mesh2.position.set(0, 0, 600)
    scene.add(mesh2)

    const geometry3 = new THREE.BoxGeometry(radius, radius, radius)
    const material3 = new THREE.MeshPhongMaterial({ color: 0x44aa66, flatShading: true })
    const mesh3 = new THREE.Mesh(geometry3, material3)
    mesh3.position.set(0, 0, -600)
    scene.add(mesh3)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    container.appendChild(renderer.domElement)

    // Orbit on main view only
    const mainCam = views[0].camera!
    const controls = new OrbitControls(mainCam, renderer.domElement)
    controls.target.set(0, 0, 0)
    controls.update()

    let mouseX = 0
    const onPointerMove = (e: PointerEvent) => {
        mouseX = e.clientX - container.clientWidth / 2
    }
    container.addEventListener('pointermove', onPointerMove)

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        const W = container.clientWidth
        const H = container.clientHeight
        for (const v of views) {
            const cam = v.camera!
            v.updateCamera(cam, scene, mouseX)
            const left = Math.floor(W * v.left)
            const bottom = Math.floor(H * v.bottom)
            const width = Math.floor(W * v.width)
            const height = Math.floor(H * v.height)
            renderer.setViewport(left, bottom, width, height)
            renderer.setScissor(left, bottom, width, height)
            renderer.setScissorTest(true)
            renderer.setClearColor(v.background)
            cam.aspect = width / height
            cam.updateProjectionMatrix()
            renderer.render(scene, cam)
        }
        controls.update()
    }
    animate()

    const onResize = () => {
        const W = container.clientWidth
        const H = container.clientHeight
        renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        container.removeEventListener('pointermove', onPointerMove)
        controls.dispose()
        geometry1.dispose(); material1.dispose()
        geometry2.dispose(); material2.dispose()
        geometry3.dispose(); material3.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLMultipleViews = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
)
export default WebGLMultipleViews
