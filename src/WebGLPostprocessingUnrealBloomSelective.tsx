/** @jsxImportSource woby */
// Postprocessing — Selective UnrealBloom via Layers (bloom-layer objects glow; others remain crisp)
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

const BLOOM_SCENE = 1
const bloomLayer = new THREE.Layers()
bloomLayer.set(BLOOM_SCENE)

const VERTEX_SHADER = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const FRAGMENT_SHADER = `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    uniform float bloomStrength;
    varying vec2 vUv;
    void main() {
        gl_FragColor = (texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv) * bloomStrength);
    }
`

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const width = container.clientWidth
    const height = container.clientHeight

    const params = {
        threshold: 0,
        strength: 1,
        radius: 0.5,
        exposure: 1,
    }

    const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })
    const materialsCache: Record<string, THREE.Material | THREE.Material[]> = {}

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = Math.pow(params.exposure, 4.0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Simple lighting (skip RoomEnvironment to keep the demo dependency-light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(5, 5, 5)
    scene.add(dirLight)
    const fillLight = new THREE.PointLight(0xffaa66, 1.5, 30)
    fillLight.position.set(-5, -2, 3)
    scene.add(fillLight)

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 200)
    camera.position.set(0, 0, 20)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.maxPolarAngle = Math.PI * 0.5
    controls.minDistance = 1
    controls.maxDistance = 100

    const renderScene = new RenderPass(scene, camera)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85)
    bloomPass.threshold = params.threshold
    bloomPass.strength = params.strength
    bloomPass.radius = params.radius

    const bloomRenderTarget = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType })
    const bloomComposer = new EffectComposer(renderer, bloomRenderTarget)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    const mixMaterial = new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture },
            bloomStrength: { value: params.strength },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        defines: {},
    })
    const mixPass = new ShaderPass(mixMaterial, 'baseTexture')
    mixPass.needsSwap = true

    const outputPass = new OutputPass()

    const finalRenderTarget = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 })
    const finalComposer = new EffectComposer(renderer, finalRenderTarget)
    finalComposer.addPass(renderScene)
    finalComposer.addPass(mixPass)
    finalComposer.addPass(outputPass)

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onPointerDown = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children, false)
        if (intersects.length > 0) {
            const object = intersects[0].object
            object.layers.toggle(BLOOM_SCENE)
        }
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    // Scene setup — 50 spheres, ~25% emit bloom
    const sphereGeo = new THREE.IcosahedronGeometry(1, 15)
    const sphereMaterials: THREE.MeshStandardMaterial[] = []
    for (let i = 0; i < 50; i++) {
        const color = new THREE.Color()
        color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05)
        const material = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 1 })
        sphereMaterials.push(material)
        const sphere = new THREE.Mesh(sphereGeo, material)
        sphere.position.x = Math.random() * 10 - 5
        sphere.position.y = Math.random() * 10 - 5
        sphere.position.z = Math.random() * 10 - 5
        sphere.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0)
        sphere.scale.setScalar(Math.random() * Math.random() + 0.5)
        scene.add(sphere)
        if (Math.random() < 0.25) sphere.layers.enable(BLOOM_SCENE)
    }

    // GUI overlay (DOM-only)
    const guiEl = document.createElement('div')
    guiEl.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.7);padding:14px;border-radius:8px;font-family:monospace;color:white;z-index:100;min-width:240px'
    const title = document.createElement('h3')
    title.style.cssText = 'margin:0 0 10px;font-size:13px;border-bottom:1px solid #555;padding-bottom:6px'
    title.textContent = 'Selective Unreal Bloom (click sphere to toggle)'
    guiEl.appendChild(title)
    const mkRange = (label: string, min: number, max: number, step: number, val: number, onChange: (v: number) => void) => {
        const wrap = document.createElement('label')
        wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
        wrap.textContent = label
        const input = document.createElement('input')
        input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.valueAsNumber = val
        input.style.width = '100%'
        input.addEventListener('input', () => onChange(input.valueAsNumber))
        wrap.appendChild(input); guiEl.appendChild(wrap)
    }
    mkRange('threshold', 0, 1, 0.01, params.threshold, v => { params.threshold = v; bloomPass.threshold = v })
    mkRange('strength', 0, 3, 0.01, params.strength, v => {
        params.strength = v
        bloomPass.strength = v
        mixMaterial.uniforms.bloomStrength.value = v
    })
    mkRange('radius', 0, 1, 0.01, params.radius, v => { params.radius = v; bloomPass.radius = v })
    mkRange('exposure', 0.1, 2, 0.01, params.exposure, v => {
        params.exposure = v
        renderer.toneMappingExposure = Math.pow(v, 4.0)
    })
    container.style.position = 'relative'
    container.appendChild(guiEl)

    const darkenNonBloomed = (obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh && bloomLayer.test(obj.layers) === false) {
            const mesh = obj as THREE.Mesh
            materialsCache[obj.uuid] = mesh.material
            mesh.material = darkMaterial
        }
    }
    const restoreMaterial = (obj: THREE.Object3D) => {
        if (materialsCache[obj.uuid]) {
            const mesh = obj as THREE.Mesh
            mesh.material = materialsCache[obj.uuid]
            delete materialsCache[obj.uuid]
        }
    }

    const render = () => {
        scene.traverse(darkenNonBloomed)
        bloomComposer.render()
        scene.traverse(restoreMaterial)
        finalComposer.render()
    }

    const animate = () => {
        controls.update()
        render()
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        bloomComposer.setSize(w, h)
        finalComposer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        controls.dispose()
        sphereGeo.dispose()
        sphereMaterials.forEach(m => m.dispose())
        darkMaterial.dispose()
        mixMaterial.dispose()
        bloomComposer.dispose()
        finalComposer.dispose()
        bloomRenderTarget.dispose()
        finalRenderTarget.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(guiEl)) container.removeChild(guiEl)
    }
}

export const WebGLPostprocessingUnrealBloomSelective = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLPostprocessingUnrealBloomSelective
