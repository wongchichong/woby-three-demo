/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const W = container.clientWidth || window.innerWidth
    const H = container.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(40, W / H, 1, 1000)
    camera.position.set(2, 2, 4)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x003973, 3))
    const dirLight = new THREE.DirectionalLight(0xffaa33, 3)
    dirLight.position.set(-10, 10, 10)
    scene.add(dirLight)

    const orbitControls = new OrbitControls(camera, renderer.domElement)

    const initialPoints = [
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(-1, 0, 1),
        new THREE.Vector3(-1, 0, -1),
    ]

    const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
    const boxMaterial = new THREE.MeshBasicMaterial()
    const curveHandles: THREE.Mesh[] = []
    for (const pos of initialPoints) {
        const handle = new THREE.Mesh(boxGeometry, boxMaterial)
        handle.position.copy(pos)
        curveHandles.push(handle)
        scene.add(handle)
    }

    const curve = new THREE.CatmullRomCurve3(curveHandles.map(h => h.position))
    curve.curveType = 'centripetal'
    curve.closed = true

    const lineGeom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50))
    const line = new THREE.LineLoop(lineGeom, new THREE.LineBasicMaterial({ color: 0x00ff00 }))
    scene.add(line)

    let flow: Flow | null = null

    new FontLoader().load('fonts/helvetiker_regular.typeface.json', (font) => {
        const geometry = new TextGeometry('Hello three.js!', {
            font, size: 0.2, depth: 0.05, curveSegments: 12,
            bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelOffset: 0, bevelSegments: 5,
        })
        geometry.rotateX(Math.PI)
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x99ffff }))
        flow = new Flow(mesh)
        flow.updateCurve(0, curve)
        scene.add(flow.object3D)
    })

    const transformControl = new TransformControls(camera, renderer.domElement)
    transformControl.addEventListener('dragging-changed', (event: any) => {
        orbitControls.enabled = !event.value
        if (!event.value) {
            line.geometry.setFromPoints(curve.getPoints(50))
            if (flow) flow.updateCurve(0, curve)
        }
    })
    scene.add(transformControl.getHelper())

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let selectPending = false

    const onPointerDown = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        selectPending = true
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        if (selectPending) {
            selectPending = false
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObjects(curveHandles, false)
            if (hits.length > 0) transformControl.attach(hits[0].object as THREE.Mesh)
        }
        if (flow) flow.moveAlongCurve(0.001)
        orbitControls.update()
        renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
        const nW = container.clientWidth || window.innerWidth
        const nH = container.clientHeight || window.innerHeight
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        orbitControls.dispose()
        transformControl.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLModifierCurve = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)

export default WebGLModifierCurve
