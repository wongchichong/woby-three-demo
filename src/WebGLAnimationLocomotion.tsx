/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_locomotion

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa0a0a0)
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 60)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(3, 3, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 1, 0)

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

    // Locomotion
    const clock = new THREE.Clock()
    let mixer: THREE.AnimationMixer | null = null
    let idleAction: THREE.AnimationAction | null = null
    let walkAction: THREE.AnimationAction | null = null
    let runAction: THREE.AnimationAction | null = null
    const settings = { idle: 1.0, walk: 0.0, run: 0.0, pause: false, timeScale: 1.0 }

    const normalizeAndApply = () => {
        let total = settings.idle + settings.walk + settings.run
        if (total <= 0.0001) { settings.idle = 1; settings.walk = 0; settings.run = 0; total = 1; for (const c of panel.controllers) c.updateDisplay() }
        else if (Math.abs(total - 1) > 0.0001) {
            settings.idle /= total; settings.walk /= total; settings.run /= total
            for (const c of panel.controllers) c.updateDisplay()
        }
        if (idleAction) idleAction.setEffectiveWeight(settings.idle)
        if (walkAction) walkAction.setEffectiveWeight(settings.walk)
        if (runAction) runAction.setEffectiveWeight(settings.run)
    }

    const panel = new GUI()
    panel.add(settings, 'idle', 0, 1, 0.01).name('Idle weight').onChange(normalizeAndApply)
    panel.add(settings, 'walk', 0, 1, 0.01).name('Walk weight').onChange(normalizeAndApply)
    panel.add(settings, 'run', 0, 1, 0.01).name('Run weight').onChange(normalizeAndApply)
    panel.add(settings, 'pause').name('Pause').onChange((v: boolean) => { if (mixer) mixer.timeScale = v ? 0 : settings.timeScale })
    panel.add(settings, 'timeScale', 0, 2, 0.01).name('Time scale').onChange((v: number) => { if (mixer && !settings.pause) mixer.timeScale = v })

    const loader = new GLTFLoader()
    loader.load('models/gltf/Soldier.glb', (gltf) => {
        const model = gltf.scene
        model.traverse((object: any) => { if (object.isMesh) object.castShadow = true })
        scene.add(model)
        mixer = new THREE.AnimationMixer(model)
        const clips = gltf.animations
        const findClip = (name: string, fallbackIndex: number) => {
            const byName = THREE.AnimationClip.findByName(clips, name)
            if (byName) return byName
            const ci = clips.find(c => c.name.toLowerCase().includes(name.toLowerCase()))
            return ci || clips[fallbackIndex]
        }
        const idleClip = findClip('Idle', 0), walkClip = findClip('Walk', 3), runClip = findClip('Run', 1)
        if (idleClip) idleAction = mixer.clipAction(idleClip)
        if (walkClip) walkAction = mixer.clipAction(walkClip)
        if (runClip) runAction = mixer.clipAction(runClip)
        const setup = (action: THREE.AnimationAction | null, weight: number) => {
            if (!action) return
            action.setEffectiveTimeScale(1); action.setEffectiveWeight(weight)
            action.enabled = true; action.play()
        }
        setup(idleAction, settings.idle); setup(walkAction, settings.walk); setup(runAction, settings.run)
        mixer.timeScale = settings.pause ? 0 : settings.timeScale
    })

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        if (mixer) mixer.update(clock.getDelta())
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

export default function WebGLAnimationLocomotion() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
