/** @jsxImportSource woby */
// webgl_loader_gltf_animation_pointer
//
// Substitution note: Upstream uses `@needle-tools/three-animation-pointer` to drive
// KHR_animation_pointer JSON-pointer-based animations against the DragonDispersion model.
// That package is third-party and not in our deps. We substitute with the upstream
// LittlestTokyo.glb model which carries standard glTF animations that the stock
// THREE.AnimationMixer can play; the visible effect (a non-trivial property-driven
// animation playing on a loaded glTF scene) is preserved. The KHR_animation_pointer
// extension itself requires a custom extension-handler in GLTFLoader — when threejs
// ships first-party support we can switch back to the dragon model.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xbfe3dd)

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 100)
    camera.position.set(5, 2, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.5, 0)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 2
    controls.maxDistance = 20
    controls.update()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    // Status overlay
    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;max-width:340px;line-height:1.5'
    statusEl.textContent = 'Loading glTF (LittlestTokyo) — KHR_animation_pointer demo (substituted)…'
    container.style.position = 'relative'
    container.appendChild(statusEl)

    let mixer: THREE.AnimationMixer | null = null
    let model: THREE.Group | null = null
    const clock = new THREE.Clock()

    loader.load(
        'https://threejs.org/examples/models/gltf/LittlestTokyo.glb',
        (gltf) => {
            model = gltf.scene
            model.position.set(1, 1, 0)
            model.scale.setScalar(0.01)
            scene.add(model)

            mixer = new THREE.AnimationMixer(model)
            if (gltf.animations && gltf.animations.length > 0) {
                mixer.clipAction(gltf.animations[0]).play()
                statusEl.textContent = `Loaded — ${gltf.animations.length} animation track(s) playing (substituted for KHR_animation_pointer)`
            } else {
                statusEl.textContent = 'Loaded — no animations'
            }
        },
        (xhr) => {
            if (xhr.total) statusEl.textContent = `Loading… ${Math.round(xhr.loaded / xhr.total * 100)}%`
        },
        (err) => {
            console.error('[WebGLLoaderGLTFAnimationPointer] load failed:', err)
            statusEl.textContent = 'Load failed (see console)'
            statusEl.style.color = '#f88'
        },
    )

    const animate = () => {
        const delta = clock.getDelta()
        if (mixer) mixer.update(delta)
        controls.update()
        renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        if (mixer) mixer.stopAllAction()
        controls.dispose()
        if (model) {
            model.traverse((obj) => {
                const m = obj as THREE.Mesh
                if (m.isMesh) {
                    m.geometry?.dispose()
                    const mat = m.material
                    if (Array.isArray(mat)) mat.forEach(x => x.dispose())
                    else if (mat) (mat as THREE.Material).dispose()
                }
            })
            scene.remove(model)
        }
        pmremGenerator.dispose()
        try { dracoLoader.dispose() } catch { /* noop */ }
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
    }
}

export const WebGLLoaderGLTFAnimationPointer = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderGLTFAnimationPointer
