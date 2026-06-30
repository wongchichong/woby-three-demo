/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_skinning_blending

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa0a0a0)
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 100)
    camera.position.set(1, 2, -3)

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
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const clock = new THREE.Clock()
    let model: THREE.Group | null = null
    let skeleton: THREE.SkeletonHelper | null = null
    let mixer: THREE.AnimationMixer | null = null
    let idleAction: THREE.AnimationAction, walkAction: THREE.AnimationAction, runAction: THREE.AnimationAction
    let actions: THREE.AnimationAction[] = []
    let panel: GUI | null = null
    let singleStepMode = false
    let sizeOfNextStep = 0

    const settings: any = {
        'show model': true,
        'show skeleton': false,
        'modify step size': 0.05,
        'use default duration': true,
        'set custom duration': 3.5,
        'modify idle weight': 0.0,
        'modify walk weight': 1.0,
        'modify run weight': 0.0,
        'modify time scale': 1.0,
    }

    const setWeight = (action: THREE.AnimationAction, weight: number) => {
        action.enabled = true
        action.setEffectiveTimeScale(1)
        action.setEffectiveWeight(weight)
    }

    const activateAllActions = () => {
        setWeight(idleAction, settings['modify idle weight'])
        setWeight(walkAction, settings['modify walk weight'])
        setWeight(runAction, settings['modify run weight'])
        actions.forEach((a) => a.play())
    }

    const deactivateAllActions = () => { actions.forEach((a) => a.stop()) }
    const pauseAllActions = () => { actions.forEach((a) => { a.paused = true }) }
    const unPauseAllActions = () => { actions.forEach((a) => { a.paused = false }) }

    const pauseContinue = () => {
        if (singleStepMode) { singleStepMode = false; unPauseAllActions() }
        else if (idleAction.paused) unPauseAllActions()
        else pauseAllActions()
    }

    const toSingleStepMode = () => {
        unPauseAllActions()
        singleStepMode = true
        sizeOfNextStep = settings['modify step size']
    }

    const setCrossFadeDuration = (defaultDuration: number) => {
        return settings['use default duration'] ? defaultDuration : settings['set custom duration']
    }

    const executeCrossFade = (startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) => {
        setWeight(endAction, 1)
        endAction.time = 0
        startAction.crossFadeTo(endAction, duration, true)
    }

    const synchronizeCrossFade = (startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) => {
        if (!mixer) return
        mixer.addEventListener('loop', function onLoopFinished(event: any) {
            if (event.action === startAction) {
                mixer!.removeEventListener('loop', onLoopFinished)
                executeCrossFade(startAction, endAction, duration)
            }
        })
    }

    const prepareCrossFade = (startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, defaultDuration: number) => {
        const duration = setCrossFadeDuration(defaultDuration)
        singleStepMode = false
        unPauseAllActions()
        if (startAction === idleAction) executeCrossFade(startAction, endAction, duration)
        else synchronizeCrossFade(startAction, endAction, duration)
    }

    const createPanel = () => {
        panel = new GUI({ width: 310 })
        const folder1 = panel.addFolder('Visibility')
        const folder2 = panel.addFolder('Activation/Deactivation')
        const folder3 = panel.addFolder('Pausing/Stepping')
        const folder4 = panel.addFolder('Crossfading')
        const folder5 = panel.addFolder('Blend Weights')
        const folder6 = panel.addFolder('General Speed')

        settings['deactivate all'] = deactivateAllActions
        settings['activate all'] = activateAllActions
        settings['pause/continue'] = pauseContinue
        settings['make single step'] = toSingleStepMode
        settings['from walk to idle'] = () => prepareCrossFade(walkAction, idleAction, 1.0)
        settings['from idle to walk'] = () => prepareCrossFade(idleAction, walkAction, 0.5)
        settings['from walk to run'] = () => prepareCrossFade(walkAction, runAction, 2.5)
        settings['from run to walk'] = () => prepareCrossFade(runAction, walkAction, 5.0)

        folder1.add(settings, 'show model').onChange((v: boolean) => { if (model) model.visible = v })
        folder1.add(settings, 'show skeleton').onChange((v: boolean) => { if (skeleton) skeleton.visible = v })
        folder2.add(settings, 'deactivate all')
        folder2.add(settings, 'activate all')
        folder3.add(settings, 'pause/continue')
        folder3.add(settings, 'make single step')
        folder3.add(settings, 'modify step size', 0.01, 0.1, 0.001)
        const cfc: any[] = []
        cfc.push(folder4.add(settings, 'from walk to idle'))
        cfc.push(folder4.add(settings, 'from idle to walk'))
        cfc.push(folder4.add(settings, 'from walk to run'))
        cfc.push(folder4.add(settings, 'from run to walk'))
        folder4.add(settings, 'use default duration')
        folder4.add(settings, 'set custom duration', 0, 10, 0.01)
        folder5.add(settings, 'modify idle weight', 0.0, 1.0, 0.01).listen().onChange((w: number) => setWeight(idleAction, w))
        folder5.add(settings, 'modify walk weight', 0.0, 1.0, 0.01).listen().onChange((w: number) => setWeight(walkAction, w))
        folder5.add(settings, 'modify run weight', 0.0, 1.0, 0.01).listen().onChange((w: number) => setWeight(runAction, w))
        folder6.add(settings, 'modify time scale', 0.0, 1.5, 0.01).onChange((s: number) => { if (mixer) mixer.timeScale = s })

        folder1.open(); folder2.open(); folder3.open(); folder4.open(); folder5.open(); folder6.open()
    }

    const loader = new GLTFLoader()
    loader.load('models/gltf/Soldier.glb', (gltf) => {
        model = gltf.scene
        scene.add(model)
        model.traverse((object: any) => { if (object.isMesh) object.castShadow = true })
        skeleton = new THREE.SkeletonHelper(model)
        skeleton.visible = false
        scene.add(skeleton)

        const animations = gltf.animations
        mixer = new THREE.AnimationMixer(model)
        idleAction = mixer.clipAction(animations[0])
        walkAction = mixer.clipAction(animations[3])
        runAction = mixer.clipAction(animations[1])
        actions = [idleAction, walkAction, runAction]

        createPanel()
        activateAllActions()
    })

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        if (mixer) {
            const idleWeight = idleAction.getEffectiveWeight()
            const walkWeight = walkAction.getEffectiveWeight()
            const runWeight = runAction.getEffectiveWeight()
            settings['modify idle weight'] = idleWeight
            settings['modify walk weight'] = walkWeight
            settings['modify run weight'] = runWeight
        }
        let delta = clock.getDelta()
        if (singleStepMode) { delta = sizeOfNextStep; sizeOfNextStep = 0 }
        if (mixer) mixer.update(delta)
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        panel?.destroy()
        controls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationSkinningBlending() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
