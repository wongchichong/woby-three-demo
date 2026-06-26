/** @jsxImportSource woby */
// webgl_loader_gltf_avif — EXT_texture_avif. AVIF decode is browser-native; no
// custom decoder needed when the browser supports AVIF (Chrome 85+, Firefox 93+).
// We mirror the upstream demo exactly using its hosted forest_house.glb model.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf6eedc)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(1.5, 4, 9)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 2, 0)
    controls.enableDamping = true
    controls.minDistance = 1
    controls.maxDistance = 40
    controls.update()

    // Status overlay
    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;max-width:340px;line-height:1.5'
    container.style.position = 'relative'
    container.appendChild(statusEl)

    // Detect AVIF support (purely informational; decode itself is automatic)
    const avifSupportPromise = new Promise<boolean>((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img.width > 0 && img.height > 0)
        img.onerror = () => resolve(false)
        img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
    })
    avifSupportPromise.then((ok) => {
        statusEl.textContent = ok
            ? 'AVIF: supported by browser — EXT_texture_avif textures will decode natively'
            : 'AVIF: NOT supported — model textures may fail; use Chrome 85+ or Firefox 93+'
        if (!ok) statusEl.style.color = '#f88'
    })

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let model: THREE.Group | null = null

    loader.load(
        'https://threejs.org/examples/models/gltf/AVIFTest/forest_house.glb',
        (gltf) => {
            model = gltf.scene
            scene.add(model)
            statusEl.textContent = (statusEl.textContent ?? '') + '\nModel loaded — AVIF textures rendered'
        },
        (xhr) => {
            if (xhr.total) {
                const pct = Math.round(xhr.loaded / xhr.total * 100)
                const base = statusEl.textContent ?? ''
                const dropProgress = base.split('\n').filter(l => !l.startsWith('Loading ')).join('\n')
                statusEl.textContent = dropProgress + `\nLoading model: ${pct}%`
            }
        },
        (err) => {
            console.error('[WebGLLoaderGLTFAvif] load failed:', err)
            statusEl.textContent = (statusEl.textContent ?? '') + '\nLoad failed (see console)'
            statusEl.style.color = '#f88'
        },
    )

    const animate = () => {
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
        try { dracoLoader.dispose() } catch { /* noop */ }
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
    }
}

export const WebGLLoaderGLTFAvif = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderGLTFAvif
