/** @jsxImportSource woby */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const W = container.clientWidth || window.innerWidth
    const H = container.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa0a0a0)
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

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

    const camera = new THREE.PerspectiveCamera(45, W / H, 1, 100)
    camera.position.set(1, 2, -3)
    camera.lookAt(0, 1, 0)

    const clock = new THREE.Clock()
    let mixer: THREE.AnimationMixer | null = null
    let model: THREE.Object3D | null = null
    let skeleton: THREE.SkeletonHelper | null = null
    let idleAction: THREE.AnimationAction | null = null
    let walkAction: THREE.AnimationAction | null = null
    let runAction: THREE.AnimationAction | null = null
    let actions: THREE.AnimationAction[] = []
    let gui: GUI | null = null
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
        if (!a) return
        a.enabled = true; a.setEffectiveTimeScale(1); a.setEffectiveWeight(w)
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
        actions.forEach(a => { a.paused = false })
        singleStepMode = true
        sizeOfNextStep = settings['modify step size']
    }
    const executeCrossFade = (s: THREE.AnimationAction | null, e: THREE.AnimationAction | null, duration: number) => {
        if (!s || !e) return
        setWeight(e, 1); e.time = 0; s.crossFadeTo(e, duration, true)
    }
    const synchronizeCrossFade = (s: THREE.AnimationAction | null, e: THREE.AnimationAction | null, duration: number) => {
        if (!mixer || !s) return
        const onLoopFinished = (event: any) => {
            if (event.action === s) {
                mixer!.removeEventListener('loop', onLoopFinished)
                executeCrossFade(s, e, duration)
            }
        }
        mixer.addEventListener('loop', onLoopFinished)
    }
    const prepareCrossFade = (s: THREE.AnimationAction | null, e: THREE.AnimationAction | null, defaultDuration: number) => {
        const duration = settings['use default duration'] ? defaultDuration : settings['set custom duration']
        singleStepMode = false
        actions.forEach(a => { a.paused = false })
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
        model.traverse((object: any) => { if (object.isMesh) object.castShadow = true })
        skeleton = new THREE.SkeletonHelper(model); skeleton.visible = false; scene.add(skeleton)

        mixer = new THREE.AnimationMixer(model)
        idleAction = mixer.clipAction(gltf.animations[0])
        walkAction = mixer.clipAction(gltf.animations[3])
        runAction = mixer.clipAction(gltf.animations[1])
        actions = [idleAction, walkAction, runAction]
        activateAllActions()

        gui = new GUI()
        const f1 = gui.addFolder('Visibility'), f2 = gui.addFolder('Activation/Deactivation'),
            f3 = gui.addFolder('Pausing/Stepping'), f4 = gui.addFolder('Crossfading'),
            f5 = gui.addFolder('Blend Weights'), f6 = gui.addFolder('General Speed')
        f1.add(settings, 'show model').onChange((v: boolean) => { if (model) model.visible = v })
        f1.add(settings, 'show skeleton').onChange((v: boolean) => { if (skeleton) skeleton.visible = v })
        f2.add(settings, 'deactivate all'); f2.add(settings, 'activate all')
        f3.add(settings, 'pause/continue'); f3.add(settings, 'make single step'); f3.add(settings, 'modify step size', 0.01, 0.1, 0.001)
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

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
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
        gui?.destroy()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLAnimationLocomotive = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)

export default WebGLAnimationLocomotive
