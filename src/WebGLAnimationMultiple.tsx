/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_multiple

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa0a0a0)
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000)
    camera.position.set(2, 3, -6)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3))

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(-3, 10, -10)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const clock = new THREE.Clock()
    const mixers: THREE.AnimationMixer[] = []
    const objects: THREE.Object3D[] = []
    let model: THREE.Object3D | null = null
    let animations: THREE.AnimationClip[] = []
    const params = { sharedSkeleton: false }

    const clearScene = () => {
        for (const mixer of mixers) mixer.stopAllAction()
        mixers.length = 0
        for (const obj of objects) scene.remove(obj)
        objects.length = 0
    }

    const setupDefaultScene = () => {
        if (!model) return
        const model1 = SkeletonUtils.clone(model)
        const model2 = SkeletonUtils.clone(model)
        const model3 = SkeletonUtils.clone(model)
        model1.position.x = -2; model2.position.x = 0; model3.position.x = 2
        const mixer1 = new THREE.AnimationMixer(model1)
        const mixer2 = new THREE.AnimationMixer(model2)
        const mixer3 = new THREE.AnimationMixer(model3)
        mixer1.clipAction(animations[0]).play()
        mixer2.clipAction(animations[1]).play()
        mixer3.clipAction(animations[3]).play()
        scene.add(model1, model2, model3)
        objects.push(model1, model2, model3)
        mixers.push(mixer1, mixer2, mixer3)
    }

    const setupSharedSkeletonScene = () => {
        if (!model) return
        const sharedModel = SkeletonUtils.clone(model)
        const shareSkinnedMesh = sharedModel.getObjectByName('vanguard_Mesh') as THREE.SkinnedMesh
        const sharedSkeleton = shareSkinnedMesh.skeleton
        const sharedParentBone = sharedModel.getObjectByName('mixamorigHips') as THREE.Bone
        scene.add(sharedParentBone)
        const m1 = shareSkinnedMesh.clone()
        const m2 = shareSkinnedMesh.clone()
        const m3 = shareSkinnedMesh.clone()
        m1.bindMode = THREE.DetachedBindMode
        m2.bindMode = THREE.DetachedBindMode
        m3.bindMode = THREE.DetachedBindMode
        const identity = new THREE.Matrix4()
        m1.bind(sharedSkeleton, identity)
        m2.bind(sharedSkeleton, identity)
        m3.bind(sharedSkeleton, identity)
        m1.position.x = -2; m2.position.x = 0; m3.position.x = 2
        m1.scale.setScalar(0.01); m1.rotation.x = -Math.PI * 0.5
        m2.scale.setScalar(0.01); m2.rotation.x = -Math.PI * 0.5
        m3.scale.setScalar(0.01); m3.rotation.x = -Math.PI * 0.5
        const mixer = new THREE.AnimationMixer(sharedParentBone)
        mixer.clipAction(animations[1]).play()
        scene.add(m1, m2, m3)
        objects.push(sharedParentBone, m1, m2, m3)
        mixers.push(mixer)
    }

    const loader = new GLTFLoader()
    loader.load('models/gltf/Soldier.glb', (gltf) => {
        model = gltf.scene
        animations = gltf.animations
        model.traverse((object) => {
            if ((object as THREE.Mesh).isMesh) (object as THREE.Mesh).castShadow = true
        })
        setupDefaultScene()
    })

    const gui = new GUI()
    gui.add(params, 'sharedSkeleton').onChange(() => {
        clearScene()
        if (params.sharedSkeleton) setupSharedSkeletonScene()
        else setupDefaultScene()
    })
    gui.open()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const delta = clock.getDelta()
        for (const mixer of mixers) mixer.update(delta)
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        gui.destroy()
        controls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationMultiple() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
