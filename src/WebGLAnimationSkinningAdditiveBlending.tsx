/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_skinning_additive_blending

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
    camera.position.set(-1, 2, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.target.set(0, 1, 0)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3))

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(3, 10, 10)
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
    let numAnimations = 0
    let currentBaseAction = 'idle'
    const allActions: THREE.AnimationAction[] = []
    const baseActions: Record<string, { weight: number; action?: THREE.AnimationAction }> = {
        idle: { weight: 1 },
        walk: { weight: 0 },
        run: { weight: 0 },
    }
    const additiveActions: Record<string, { weight: number; action?: THREE.AnimationAction }> = {
        sneak_pose: { weight: 0 },
        sad_pose: { weight: 0 },
        agree: { weight: 0 },
        headShake: { weight: 0 },
    }
    let panel: GUI | null = null
    let panelSettings: Record<string, any> = {}
    const crossFadeControls: any[] = []

    const setWeight = (action: THREE.AnimationAction, weight: number) => {
        action.enabled = true
        action.setEffectiveTimeScale(1)
        action.setEffectiveWeight(weight)
    }

    const activateAction = (action: THREE.AnimationAction) => {
        const clip = action.getClip()
        const settings = baseActions[clip.name] || additiveActions[clip.name]
        setWeight(action, settings.weight)
        action.play()
    }

    const modifyTimeScale = (speed: number) => { if (mixer) mixer.timeScale = speed }

    const executeCrossFade = (startAction: THREE.AnimationAction | null, endAction: THREE.AnimationAction | null, duration: number) => {
        if (endAction) {
            setWeight(endAction, 1)
            endAction.time = 0
            if (startAction) startAction.crossFadeTo(endAction, duration, true)
            else endAction.fadeIn(duration)
        } else {
            startAction!.fadeOut(duration)
        }
    }

    const synchronizeCrossFade = (startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) => {
        if (!mixer) return
        const onLoopFinished = (event: any) => {
            if (event.action === startAction) {
                mixer!.removeEventListener('loop', onLoopFinished)
                executeCrossFade(startAction, endAction, duration)
            }
        }
        mixer.addEventListener('loop', onLoopFinished)
    }

    const prepareCrossFade = (startAction: THREE.AnimationAction | null, endAction: THREE.AnimationAction | null, duration: number) => {
        if (currentBaseAction === 'idle' || !startAction || !endAction) {
            executeCrossFade(startAction, endAction, duration)
        } else {
            synchronizeCrossFade(startAction, endAction, duration)
        }
        currentBaseAction = endAction ? endAction.getClip().name : 'None'
        crossFadeControls.forEach((control) => {
            if (control.property === currentBaseAction) control.setActive?.()
            else control.setInactive?.()
        })
    }

    const createPanel = () => {
        panel = new GUI({ width: 310 })
        const folder1 = panel.addFolder('Base Actions')
        const folder2 = panel.addFolder('Additive Action Weights')
        const folder3 = panel.addFolder('General Speed')
        panelSettings = { 'modify time scale': 1.0 }
        const baseNames = ['None', ...Object.keys(baseActions)]
        for (const name of baseNames) {
            const settings = baseActions[name]
            panelSettings[name] = () => {
                const currentSettings = baseActions[currentBaseAction]
                const currentAction = currentSettings ? currentSettings.action : null
                const action = settings ? settings.action : null
                if (currentAction !== action) prepareCrossFade(currentAction || null, action || null, 0.35)
            }
            crossFadeControls.push(folder1.add(panelSettings, name))
        }
        for (const name of Object.keys(additiveActions)) {
            const settings = additiveActions[name]
            panelSettings[name] = settings.weight
            folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange((weight: number) => {
                if (settings.action) setWeight(settings.action, weight)
                settings.weight = weight
            })
        }
        folder3.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale)
        folder1.open(); folder2.open(); folder3.open()
        crossFadeControls.forEach((control) => {
            control.setInactive = function () { control.domElement.classList.add('control-inactive') }
            control.setActive = function () { control.domElement.classList.remove('control-inactive') }
            const settings = baseActions[control.property]
            if (!settings || !settings.weight) control.setInactive()
        })
    }

    const loader = new GLTFLoader()
    loader.load('models/gltf/Xbot.glb', (gltf) => {
        const model = gltf.scene
        scene.add(model)
        model.traverse((object) => { if (object instanceof THREE.Mesh) object.castShadow = true })
        const skeleton = new THREE.SkeletonHelper(model)
        skeleton.visible = false
        scene.add(skeleton)
        const animations = gltf.animations
        mixer = new THREE.AnimationMixer(model)
        numAnimations = animations.length
        for (let i = 0; i < numAnimations; i++) {
            let clip = animations[i]
            const name = clip.name
            if (baseActions[name]) {
                const action = mixer.clipAction(clip)
                activateAction(action)
                baseActions[name].action = action
                allActions.push(action)
            } else if (additiveActions[name]) {
                THREE.AnimationUtils.makeClipAdditive(clip)
                if (clip.name.endsWith('_pose')) {
                    clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30)
                }
                const action = mixer.clipAction(clip)
                activateAction(action)
                additiveActions[name].action = action
                allActions.push(action)
            }
        }
        createPanel()
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
            for (let i = 0; i < numAnimations; i++) {
                const action = allActions[i]
                const clip = action.getClip()
                const settings = baseActions[clip.name] || additiveActions[clip.name]
                settings.weight = action.getEffectiveWeight()
            }
            const delta = clock.getDelta()
            mixer.update(delta)
        }
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

export default function WebGLAnimationSkinningAdditiveBlending() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
