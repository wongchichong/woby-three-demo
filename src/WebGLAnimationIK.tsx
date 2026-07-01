/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_ik

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { CCDIKSolver, CCDIKHelper } from 'three/examples/jsm/animation/CCDIKSolver.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)
    scene.fog = new THREE.FogExp2(0xffffff, 0.17)

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.001, 5000)
    camera.position.set(0.9728517749133652, 1.1044765132727201, 0.7316689528482836)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 8))

    // IK Setup
    const OOI: Record<string, any> = {}
    let IKSolver: CCDIKSolver | null = null
    let orbitControls: OrbitControls | null = null
    let mirrorSphereCamera: THREE.CubeCamera | null = null
    const conf = { followSphere: false, turnHead: true, ik_solver: true }
    const v0 = new THREE.Vector3()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://threejs.org/examples/jsm/libs/draco/gltf/')
    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    gltfLoader.loadAsync('models/gltf/kira.glb').then(gltf => {
        gltf.scene.traverse((n: any) => {
            if (n.name === 'head') OOI.head = n
            if (n.name === 'lowerarm_l') OOI.lowerarm_l = n
            if (n.name === 'Upperarm_l') OOI.Upperarm_l = n
            if (n.name === 'hand_l') OOI.hand_l = n
            if (n.name === 'target_hand_l') OOI.target_hand_l = n
            if (n.name === 'boule') OOI.sphere = n
            if (n.name === 'Kira_Shirt_left') OOI.kira = n
        })
        scene.add(gltf.scene)
        const targetPosition = OOI.sphere.position.clone()
        OOI.hand_l.attach(OOI.sphere)

        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024)
        mirrorSphereCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget)
        scene.add(mirrorSphereCamera)
        OOI.sphere.material = new THREE.MeshBasicMaterial({ envMap: cubeRenderTarget.texture })

        OOI.kira.add(OOI.kira.skeleton.bones[0])
        const iks = [{
            target: 22, effector: 6,
            links: [
                { index: 5, rotationMin: new THREE.Vector3(1.2, -1.8, -0.4), rotationMax: new THREE.Vector3(1.7, -1.1, 0.3) },
                { index: 4, rotationMin: new THREE.Vector3(0.1, -0.7, -1.8), rotationMax: new THREE.Vector3(1.1, 0, -1.4) },
            ],
        }]
        IKSolver = new CCDIKSolver(OOI.kira, iks)
        scene.add(new CCDIKHelper(OOI.kira, iks, 0.01))

        orbitControls = new OrbitControls(camera, renderer.domElement)
        orbitControls.minDistance = 0.2; orbitControls.maxDistance = 1.5
        orbitControls.enableDamping = true
        orbitControls.target.copy(targetPosition)

        const transformControls = new TransformControls(camera, renderer.domElement)
        transformControls.size = 0.75; transformControls.showX = false; transformControls.space = 'world'
        transformControls.attach(OOI.target_hand_l)
        scene.add(transformControls.getHelper())
        transformControls.addEventListener('mouseDown', () => { if (orbitControls) orbitControls.enabled = false })
        transformControls.addEventListener('mouseUp', () => { if (orbitControls) orbitControls.enabled = true })
    })

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        if (OOI.sphere && mirrorSphereCamera) {
            OOI.sphere.visible = false
            OOI.sphere.getWorldPosition(mirrorSphereCamera.position)
            mirrorSphereCamera.update(renderer, scene)
            OOI.sphere.visible = true
        }
        if (OOI.sphere && conf.followSphere && orbitControls) {
            OOI.sphere.getWorldPosition(v0)
            orbitControls.target.lerp(v0, 0.1)
        }
        if (OOI.head && OOI.sphere && conf.turnHead) {
            OOI.sphere.getWorldPosition(v0)
            OOI.head.lookAt(v0)
            OOI.head.rotation.set(OOI.head.rotation.x, OOI.head.rotation.y + Math.PI, OOI.head.rotation.z)
        }
        if (conf.ik_solver && IKSolver) {
            IKSolver.update()
            scene.traverse((o: any) => { if (o.isSkinnedMesh) (o as THREE.SkinnedMesh).computeBoundingSphere() })
        }
        orbitControls?.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        orbitControls?.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationIK() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
