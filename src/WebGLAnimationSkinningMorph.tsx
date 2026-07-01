/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_skinning_morph

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe0e0e0)
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.25, 100)
    camera.position.set(-5, 3, 10)

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
    dirLight.position.set(0, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000)
    scene.add(grid)

    const clock = new THREE.Clock()
    let mixer: THREE.AnimationMixer | null = null
    let actions: Record<string, THREE.AnimationAction> = {}
    let activeAction: THREE.AnimationAction | null = null
    let previousAction: THREE.AnimationAction | null = null
    let model: THREE.Object3D | null = null
    let face: THREE.Mesh | null = null
    let panel: GUI | null = null
    const api: { state: string; [key: string]: any } = { state: 'Walking' }

    const fadeToAction = (name: string, duration: number) => {
        previousAction = activeAction
        activeAction = actions[name]
        if (previousAction !== activeAction && previousAction) previousAction.fadeOut(duration)
        activeAction!.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play()
    }

    const loader = new GLTFLoader()
    loader.load('models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
        model = gltf.scene
        scene.add(model)

        const states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing']
        const emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp']

        panel = new GUI()
        mixer = new THREE.AnimationMixer(model)
        for (let i = 0; i < gltf.animations.length; i++) {
            const clip = gltf.animations[i]
            const action = mixer.clipAction(clip)
            actions[clip.name] = action
            if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
                action.clampWhenFinished = true
                action.loop = THREE.LoopOnce
            }
        }

        const statesFolder = panel.addFolder('States')
        statesFolder.add(api, 'state').options(states).onChange(() => fadeToAction(api.state, 0.5))
        statesFolder.open()

        const emoteFolder = panel.addFolder('Emotes')
        const restoreState = () => {
            mixer!.removeEventListener('finished', restoreState)
            fadeToAction(api.state, 0.2)
        }
        const createEmoteCallback = (name: string) => {
            api[name] = () => {
                fadeToAction(name, 0.2)
                mixer!.addEventListener('finished', restoreState)
            }
            emoteFolder.add(api, name)
        }
        for (let i = 0; i < emotes.length; i++) createEmoteCallback(emotes[i])
        emoteFolder.open()

        face = model.getObjectByName('Head_4') as THREE.Mesh
        if (face && face.morphTargetDictionary) {
            const expressions = Object.keys(face.morphTargetDictionary)
            const expressionFolder = panel.addFolder('Expressions')
            for (let i = 0; i < expressions.length; i++) {
                expressionFolder.add(face.morphTargetInfluences!, i, 0, 1, 0.01).name(expressions[i])
            }
            expressionFolder.open()
        }

        activeAction = actions['Walking']
        activeAction.play()
    })

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const delta = clock.getDelta()
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

export default function WebGLAnimationSkinningMorph() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}