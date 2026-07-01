/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_locomotive

import * as THREE from 'three'
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
    let mixer: THREE.AnimationMixer | null = null
    let model: THREE.Object3D | null = null
    let skeleton: THREE.SkeletonHelper | null = null
    let idleAction: THREE.AnimationAction | null = null
    let walkAction: THREE.AnimationAction | null = null
    let runAction: THREE.AnimationAction | null = null
    let actions: THREE.AnimationAction[] = []
    let singleStepMode = false
    let sizeOfNextStep = 0
    const crossFadeControls: any[] = []

    const settings: Record<string, any> = {
        'show model': true,
        'show skeleton': false,
        'deactivate all': () => actions.forEach(a => a.stop()),
        'activate all': () => activateAllActions(),
        'pause/continue': () => pauseContinue(),
        'make single step': () => toSingleStepMode(),
        'modify step size': 0.05,
        'from walk to idle': () => prepareCrossFade(walkAction, idleAction, 1.0),
        'from idle to walk': () => prepareCrossFade(idleAction, walkAction, 0.5),
        'from walk to run': () => prepareCrossFade(walkAction, runAction, 2.5),
        'from run to walk': () => prepareCrossFade(runAction, walkAction, 5.0),
        'use default duration': true,
        'set custom duration': 3.5,
        'modify idle weight': 0.0,
        'modify walk weight': 1.0,
        'modify run weight': 0.0,
        'modify time scale': 1.0,
    }

    const setWeight = (a: THREE.AnimationAction | null, w: number) => {
        if (!a) return; a.enabled = true; a.setEffectiveTimeScale(1); a.setEffectiveWeight(w)
    }
    const activateAllActions = () => {
        setWeight(idleAction, settings['modify idle weight'])
        setWeight(walkAction, settings['modify walk weight'])
        setWeight(runAction, settings['modify run weight'])
        actions.forEach(a => a.play())
    }
    const pauseContinue = () => {
        if (singleStepMode) { singleStepMode = false; actions.forEach(a => { a.paused = false }) }
        else if (idleAction?.paused) actions.forEach(a => { a.paused = false })
        else actions.forEach(a => { a.paused = true })
    }
    const toSingleStepMode = () => {
        actions.forEach(a => { a.paused = false }); singleStepMode = true
        sizeOfNextStep = settings['modify step size']
    }
    const executeCrossFade = (s: THREE.AnimationAction | null, e: THREE.AnimationAction | null, duration: number) => {
        if (!s || !e) return; setWeight(e, 1); e.time = 0; s.crossFadeTo(e, duration, true)
    }
    const synchronizeCrossFade = (s: THREE.AnimationAction | null, e: THREE.AnimationAction | null, duration: number) => {
        if (!mixer || !s) return
        const onLoopFinished = (event: any) => {
            if (event.action === s) { mixer!.removeEventListener('loop', onLoopFinished); executeCrossFade(s, e, duration) }
        }
        mixer.addEventListener('loop', onLoopFinished)
    }
    const prepareCrossFade = (s: THREE.AnimationAction | null, e: THREE.AnimationAction | null, def: number) => {
        const duration = settings['use default duration'] ? def : settings['set custom duration']
        singleStepMode = false; actions.forEach(a => { a.paused = false })
        if (s === idleAction) executeCrossFade(s, e, duration)
        else synchronizeCrossFade(s, e, duration)
    }
    const updateCrossFadeControls = () => {
        if (crossFadeControls.length < 4) return
        const iw = idleAction?.getEffectiveWeight() ?? 0
        const ww = walkAction?.getEffectiveWeight() ?? 0
        const rw = runAction?.getEffectiveWeight() ?? 0
        if (iw === 1 && ww === 0 && rw === 0) { crossFadeControls[0].disable(); crossFadeControls[1].enable(); crossFadeControls[2].disable(); crossFadeControls[3].disable() }
        if (iw === 0 && ww === 1 && rw === 0) { crossFadeControls[0].enable(); crossFadeControls[1].disable(); crossFadeControls[2].enable(); crossFadeControls[3].disable() }
        if (iw === 0 && ww === 0 && rw === 1) { crossFadeControls[0].disable(); crossFadeControls[1].disable(); crossFadeControls[2].disable(); crossFadeControls[3].enable() }
    }

    new GLTFLoader().load('models/gltf/Soldier.glb', (gltf) => {
        model = gltf.scene
        scene.add(model)
        model.traverse((o: any) => { if (o.isMesh) o.castShadow = true })
        skeleton = new THREE.SkeletonHelper(model); skeleton.visible = false; scene.add(skeleton)
        mixer = new THREE.AnimationMixer(model)
        idleAction = mixer.clipAction(gltf.animations[0])
        walkAction = mixer.clipAction(gltf.animations[3])
        runAction = mixer.clipAction(gltf.animations[1])
        actions = [idleAction, walkAction, runAction]
        activateAllActions()

        const panel = new GUI()
        const f1 = panel.addFolder('Visibility'), f2 = panel.addFolder('Activation/Deactivation')
        const f3 = panel.addFolder('Pausing/Stepping'), f4 = panel.addFolder('Crossfading')
        const f5 = panel.addFolder('Blend Weights'), f6 = panel.addFolder('General Speed')
        f1.add(settings, 'show model').onChange((v: boolean) => { if (model) model.visible = v })
        f1.add(settings, 'show skeleton').onChange((v: boolean) => { if (skeleton) skeleton.visible = v })
        f2.add(settings, 'deactivate all'); f2.add(settings, 'activate all')
        f3.add(settings, 'pause/continue'); f3.add(settings, 'make single step')
        f3.add(settings, 'modify step size', 0.01, 0.1, 0.001)
        crossFadeControls.push(f4.add(settings, 'from walk to idle'))
        crossFadeControls.push(f4.add(settings, 'from idle to walk'))
        crossFadeControls.push(f4.add(settings, 'from walk to run'))
        crossFadeControls.push(f4.add(settings, 'from run to walk'))
        f4.add(settings, 'use default duration'); f4.add(settings, 'set custom duration', 0, 10, 0.01)
        f5.add(settings, 'modify idle weight', 0, 1, 0.01).listen().onChange((w: number) => setWeight(idleAction, w))
        f5.add(settings, 'modify walk weight', 0, 1, 0.01).listen().onChange((w: number) => setWeight(walkAction, w))
        f5.add(settings, 'modify run weight', 0, 1, 0.01).listen().onChange((w: number) => setWeight(runAction, w))
        f6.add(settings, 'modify time scale', 0, 1.5, 0.01).onChange((s: number) => { if (mixer) mixer.timeScale = s })
        f1.open(); f2.open(); f3.open(); f4.open(); f5.open(); f6.open()
    })

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        if (mixer && idleAction && walkAction && runAction) {
            settings['modify idle weight'] = idleAction.getEffectiveWeight()
            settings['modify walk weight'] = walkAction.getEffectiveWeight()
            settings['modify run weight'] = runAction.getEffectiveWeight()
            updateCrossFadeControls()
            let delta = clock.getDelta()
            if (singleStepMode) { delta = sizeOfNextStep; sizeOfNextStep = 0 }
            mixer.update(delta)
        }
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationLocomotive() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
