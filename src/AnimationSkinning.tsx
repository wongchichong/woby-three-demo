/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_skinning

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe0e0e0)
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.25, 100)
    camera.position.set(-5, 3, 10)
    camera.lookAt(0, 2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(0, 20, 10)
    scene.add(dirLight)

    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // Grid
    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000)
    const gridMat = grid.material as THREE.LineBasicMaterial
    gridMat.opacity = 0.2
    gridMat.transparent = true
    scene.add(grid)

    const modelGroup = new THREE.Group()
    scene.add(modelGroup)

    const clock = new THREE.Clock()
    let mixer: THREE.AnimationMixer | null = null

    new GLTFLoader().load('models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
        modelGroup.add(gltf.scene)
        mixer = new THREE.AnimationMixer(gltf.scene)

        const emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp']
        const states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing']

        for (const clip of gltf.animations) {
            const action = mixer.clipAction(clip)
            if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
                action.clampWhenFinished = true
                action.loop = THREE.LoopOnce
            }
        }

        const walkAction = mixer.clipAction(gltf.animations.find((c: any) => c.name === 'Walking'))
        if (walkAction) walkAction.play()
    })

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const dt = clock.getDelta()
        if (mixer) mixer.update(dt)
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

export default function AnimationSkinning() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
