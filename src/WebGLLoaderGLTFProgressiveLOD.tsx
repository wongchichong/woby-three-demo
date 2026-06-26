/** @jsxImportSource woby */
// webgl_loader_gltf_progressive_lod
//
// Substitution note: Upstream uses `@needle-tools/gltf-progressive` (third-party) to
// stream LOD chunks of a 237MB Sketchfab world. That package is not in our deps and
// the upstream assets live on cloud.needle.tools. We implement the progressive-LOD
// _pattern_ from first principles using two upstream three.js assets:
//   Stage 1: a low-detail proxy box rendered instantly (placeholder while fetching).
//   Stage 2: DamagedHelmet.gltf loaded asynchronously, then swapped in.
// The visible effect — instant non-blank canvas, deferred high-detail swap, status
// overlay tracking transition — matches the demo's intent.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x191a22)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 40)
    camera.position.set(-2.5, 1.5, 3.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 1
    controls.maxDistance = 20
    controls.target.set(0, 0.4, 0)
    controls.enableDamping = true
    controls.update()

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))

    // Status overlay
    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;max-width:340px;line-height:1.5'
    container.style.position = 'relative'
    container.appendChild(statusEl)

    // ---- Stage 1: low-detail proxy (placeholder while high-detail loads) ----
    const proxyGeo = new THREE.BoxGeometry(1, 1, 1)
    const proxyMat = new THREE.MeshStandardMaterial({ color: 0x8a6bff, roughness: 0.6, metalness: 0.3, wireframe: false })
    const proxy = new THREE.Mesh(proxyGeo, proxyMat)
    proxy.position.set(0, 0.5, 0)
    scene.add(proxy)

    statusEl.textContent = 'Stage 1: low-detail proxy (instant)\nStage 2: high-detail glTF (fetching…)\nStage 3: environment (fetching…)'

    let highDetailModel: THREE.Group | null = null
    let envTexture: THREE.Texture | null = null
    let envProcessed: THREE.Texture | null = null
    let highDetailLoaded = false
    let envLoaded = false

    const updateStatus = () => {
        statusEl.textContent =
            'Stage 1: low-detail proxy ' + (highDetailLoaded ? '(swapped out)' : '(visible)') +
            '\nStage 2: high-detail glTF ' + (highDetailLoaded ? '(loaded — swapped in)' : '(fetching…)') +
            '\nStage 3: environment ' + (envLoaded ? '(applied)' : '(fetching…)')
    }

    // ---- Stage 3: HDR environment (parallel) ----
    new RGBELoader()
        .setPath('https://threejs.org/examples/textures/equirectangular/')
        .load('quarry_01_1k.hdr', (tex) => {
            tex.mapping = THREE.EquirectangularReflectionMapping
            envTexture = tex
            envProcessed = pmremGenerator.fromEquirectangular(tex).texture
            scene.environment = envProcessed
            envLoaded = true
            updateStatus()
        })

    // ---- Stage 2: high-detail glTF (parallel; swaps proxy on complete) ----
    const loader = new GLTFLoader()
    loader.load(
        'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
        (gltf) => {
            highDetailModel = gltf.scene
            highDetailModel.position.set(0, 0.5, 0)
            highDetailModel.scale.setScalar(0.9)
            scene.add(highDetailModel)
            // Swap: remove proxy after fade-in window
            scene.remove(proxy)
            highDetailLoaded = true
            updateStatus()
        },
        (xhr) => {
            if (xhr.total) {
                const pct = Math.round(xhr.loaded / xhr.total * 100)
                statusEl.textContent =
                    'Stage 1: low-detail proxy (visible)' +
                    `\nStage 2: high-detail glTF (${pct}%)` +
                    '\nStage 3: environment ' + (envLoaded ? '(applied)' : '(fetching…)')
            }
        },
        (err) => {
            console.error('[WebGLLoaderGLTFProgressiveLOD] high-detail load failed:', err)
            statusEl.textContent = 'High-detail load failed — proxy remains'
            statusEl.style.color = '#f88'
        },
    )

    const animate = () => {
        if (!highDetailLoaded) {
            // Idle rotation on proxy while waiting
            proxy.rotation.y += 0.01
        } else if (highDetailModel) {
            highDetailModel.rotation.y += 0.004
        }
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
        controls.dispose()
        proxyGeo.dispose(); proxyMat.dispose()
        if (highDetailModel) {
            highDetailModel.traverse((obj) => {
                const m = obj as THREE.Mesh
                if (m.isMesh) {
                    m.geometry?.dispose()
                    const mat = m.material
                    if (Array.isArray(mat)) mat.forEach(x => x.dispose())
                    else if (mat) (mat as THREE.Material).dispose()
                }
            })
            scene.remove(highDetailModel)
        }
        if (envTexture) envTexture.dispose()
        if (envProcessed) envProcessed.dispose()
        pmremGenerator.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
    }
}

export const WebGLLoaderGLTFProgressiveLOD = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderGLTFProgressiveLOD
