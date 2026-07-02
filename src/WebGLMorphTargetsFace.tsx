/** @jsxImportSource woby */
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const timer = new THREE.Timer()
    timer.connect(document)

    const w = container.clientWidth
    const h = container.clientHeight

    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 20)
    camera.position.set(-1.8, 0.8, 3)

    const scene = new THREE.Scene()

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)

    const ktx2Loader = new KTX2Loader().detectSupport(renderer)

    let mixer: THREE.AnimationMixer | null = null
    let gui: GUI | null = null

    new GLTFLoader()
        .setKTX2Loader(ktx2Loader)
        .setMeshoptDecoder(MeshoptDecoder)
        .load('https://threejs.org/examples/models/gltf/facecap.glb', (gltf) => {
            const mesh = gltf.scene.children[0]
            scene.add(mesh)

            mixer = new THREE.AnimationMixer(mesh)
            mixer.clipAction(gltf.animations[0]).play()

            // GUI
            const head = mesh.getObjectByName('mesh_2') as THREE.Mesh
            const influences = head.morphTargetInfluences

            gui = new GUI()
            gui.close()

            for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
                gui.add(influences, value, 0, 1, 0.01)
                    .name(key.replace('blendShape1.', '') as string)
                    .listen()
            }
        })

    const environment = new RoomEnvironment()
    const pmremGenerator = new THREE.PMREMGenerator(renderer)

    scene.background = new THREE.Color(0x666666)
    scene.environment = pmremGenerator.fromScene(environment, 0.04).texture

    environment.dispose()
    pmremGenerator.dispose()

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 2.5
    controls.maxDistance = 5
    controls.minAzimuthAngle = -Math.PI / 2
    controls.maxAzimuthAngle = Math.PI / 2
    controls.maxPolarAngle = Math.PI / 1.8
    controls.target.set(0, 0.15, -0.2)

    const stats = new Stats()
    container.appendChild(stats.dom)

    const onWindowResize = () => {
        const nw = container.clientWidth
        const nh = container.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onWindowResize)

    const animate = () => {
        timer.update()

        const delta = timer.getDelta()

        if (mixer) {
            mixer.update(delta)
        }

        controls.update()
        renderer.render(scene, camera)
        stats.update()
    }
    renderer.setAnimationLoop(animate)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onWindowResize)

        if (mixer) {
            mixer.stopAllAction()
            mixer = null
        }

        if (gui) {
            gui.destroy()
            gui = null
        }

        controls.dispose()
        scene.clear()
        ktx2Loader.dispose()
        renderer.dispose()

        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(stats.dom)) container.removeChild(stats.dom)
    }
}

export default function WebGLMorphTargetsFace() {
    return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}