/** @jsxImportSource woby */
import * as THREE from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

// Pinned to package.json three@^0.173.0
const BASIS_TRANSCODER_PATH = 'https://unpkg.com/three@0.173.0/examples/jsm/libs/basis/'

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a22)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 1.5
    controls.maxDistance = 10

    scene.add(new THREE.AmbientLight(0xffffff, 1.0))

    // Rotating textured plane (avoid box-face UV ambiguity for a 2D KTX2 texture)
    const planeGeo = new THREE.PlaneGeometry(2.0, 2.0 * (260 / 496))
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const box = new THREE.Mesh(planeGeo, boxMat)
    scene.add(box)

    // KTX2 loader pipeline
    const ktx2Loader = new KTX2Loader()
        .setTranscoderPath(BASIS_TRANSCODER_PATH)
        .detectSupport(renderer)

    let loadedTexture: THREE.Texture | null = null
    let statusText = 'Loading KTX2…'
    let supportText = ''

    // Status overlay
    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;max-width:340px;line-height:1.5'
    container.style.position = 'relative'
    container.appendChild(statusEl)
    const updateStatus = () => { statusEl.textContent = statusText + (supportText ? '\n' + supportText : '') }
    updateStatus()

    // Capture renderer caps for the status overlay
    const caps = renderer.capabilities
    const ctx = renderer.getContext()
    const exts = ['WEBGL_compressed_texture_astc', 'WEBGL_compressed_texture_etc', 'WEBGL_compressed_texture_etc1', 'WEBGL_compressed_texture_s3tc', 'EXT_texture_compression_bptc']
    const supported = exts.filter(e => ctx.getExtension(e)).map(e => e.replace('WEBGL_compressed_texture_', '').replace('EXT_texture_compression_', ''))
    supportText = 'WebGL2: ' + (caps.isWebGL2 ? 'yes' : 'no') + '\nGPU compression: ' + (supported.length ? supported.join(', ') : '(none — will use uncompressed)')
    updateStatus()

    ktx2Loader.load(
        'https://threejs.org/examples/textures/ktx2/2d_etc1s.ktx2',
        (texture) => {
            // KTX2Loader infers colorSpace from the file header; only force if missing
            if (!texture.colorSpace || texture.colorSpace === THREE.NoColorSpace) {
                texture.colorSpace = THREE.SRGBColorSpace
            }
            loadedTexture = texture
            boxMat.map = texture
            boxMat.color.set(0xffffff)
            boxMat.needsUpdate = true
            statusText = 'KTX2 loaded: ' + texture.image.width + ' x ' + texture.image.height + ' colorSpace=' + texture.colorSpace
            updateStatus()
        },
        undefined,
        (err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err)
            console.warn('[WebGLLoaderTextureKTX2] load failed:', err)
            statusText = 'KTX2 load failed: ' + msg
            statusEl.style.color = '#f88'
            updateStatus()
        },
    )

    const animate = () => {
        box.rotation.y += 0.006
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
        planeGeo.dispose(); boxMat.dispose()
        if (loadedTexture) loadedTexture.dispose()
        try { ktx2Loader.dispose() } catch { /* may have no-op dispose */ }
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
    }
}

export const WebGLLoaderTextureKTX2 = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderTextureKTX2
