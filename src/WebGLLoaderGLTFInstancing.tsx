/** @jsxImportSource woby */
// webgl_loader_gltf_instancing — EXT_mesh_gpu_instancing.
// GLTFLoader since r140+ understands EXT_mesh_gpu_instancing natively and emits
// THREE.InstancedMesh objects for nodes that carry the extension. No explicit
// extension registration is needed. We mirror the upstream demo using its hosted
// DamagedHelmetGpuInstancing.gltf model and royal_esplanade UltraHDR environment.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.25, 20)
    camera.position.set(-0.9, 0.41, -0.89)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 0.2
    controls.maxDistance = 10
    controls.target.set(0, 0.25, 0)
    controls.enableDamping = true
    controls.update()

    // Status overlay reports the count of InstancedMesh nodes the loader produced
    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;max-width:340px;line-height:1.5'
    statusEl.textContent = 'Loading EXT_mesh_gpu_instancing glTF…'
    container.style.position = 'relative'
    container.appendChild(statusEl)

    let model: THREE.Group | null = null
    let envTexture: THREE.Texture | null = null

    new UltraHDRLoader()
        .setPath('https://threejs.org/examples/textures/equirectangular/')
        .load('royal_esplanade_2k.hdr.jpg', (texture: THREE.Texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping
            envTexture = texture
            scene.background = texture
            scene.environment = texture

            const loader = new GLTFLoader().setPath('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF-instancing/')
            loader.load('DamagedHelmetGpuInstancing.gltf', (gltf) => {
                model = gltf.scene
                scene.add(model)

                // Count InstancedMesh objects emitted by GLTFLoader
                let instCount = 0
                let totalInstances = 0
                model.traverse((obj) => {
                    const inst = obj as THREE.InstancedMesh
                    if ((inst as THREE.Object3D).type === 'InstancedMesh' || inst.isInstancedMesh) {
                        instCount++
                        totalInstances += inst.count ?? 0
                    }
                })
                statusEl.textContent = `Loaded — ${instCount} InstancedMesh node(s), ${totalInstances} total instance(s)`
            }, (xhr) => {
                if (xhr.total) statusEl.textContent = `Loading model: ${Math.round(xhr.loaded / xhr.total * 100)}%`
            }, (err) => {
                console.error('[WebGLLoaderGLTFInstancing] model load failed:', err)
                statusEl.textContent = 'Model load failed (see console)'
                statusEl.style.color = '#f88'
            })
        }, undefined, (err: unknown) => {
            console.error('[WebGLLoaderGLTFInstancing] env load failed:', err)
            statusEl.textContent = 'Environment load failed (see console)'
            statusEl.style.color = '#f88'
        })

    const animate = () => {
        if (model) model.rotation.y += 0.003
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
        if (envTexture) envTexture.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
    }
}

export const WebGLLoaderGLTFInstancing = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderGLTFInstancing
