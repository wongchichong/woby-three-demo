/** @jsxImportSource woby */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

const ScreenspaceShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 0 },
        'resolution': { value: new THREE.Vector2() },
        'amplitude': { value: 0.02 },
        'frequency': { value: 40.0 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform vec2 resolution;
        uniform float amplitude;
        uniform float frequency;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            // screen-space ripple/distortion
            uv += amplitude * vec2(
                sin(uv.y * frequency + time * 2.0),
                cos(uv.x * frequency + time * 1.7)
            );
            vec3 color = texture2D(tDiffuse, uv).rgb;

            // subtle scanline / vignette overlay so the effect is clearly visible
            float scan = 0.92 + 0.08 * sin(vUv.y * resolution.y * 1.5);
            float vign = smoothstep(1.2, 0.3, length(vUv - 0.5));
            color *= scan * vign;

            gl_FragColor = vec4(color, 1.0);
        }
    `,
}

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const params = {
        amplitude: 0.02,
        frequency: 40.0,
        animateCamera: true,
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x101018)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 1.2, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(5, 6, 5)
    scene.add(dirLight)
    const fillLight = new THREE.PointLight(0xff66aa, 1.0, 12)
    fillLight.position.set(-3, 2, 2)
    scene.add(fillLight)

    // Hero: rotating torus knot with normal material (so distortion is visible on its silhouette)
    const knotGeo = new THREE.TorusKnotGeometry(0.9, 0.32, 220, 64)
    const knotMat = new THREE.MeshNormalMaterial()
    const torusKnot = new THREE.Mesh(knotGeo, knotMat)
    scene.add(torusKnot)

    // Backdrop: large textured plane so ripple is visible on the background too
    const bgGeo = new THREE.PlaneGeometry(20, 20, 1, 1)
    const bgCanvas = document.createElement('canvas')
    bgCanvas.width = 256; bgCanvas.height = 256
    const bctx = bgCanvas.getContext('2d')!
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            bctx.fillStyle = ((x + y) & 1) ? '#3a3a55' : '#1a1a2a'
            bctx.fillRect(x * 16, y * 16, 16, 16)
        }
    }
    const bgTex = new THREE.CanvasTexture(bgCanvas)
    bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping
    bgTex.repeat.set(8, 8)
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex })
    const bg = new THREE.Mesh(bgGeo, bgMat)
    bg.position.z = -5
    scene.add(bg)

    // Composer chain: Render -> Screenspace -> Output
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const screenspacePass = new ShaderPass(ScreenspaceShader)
    screenspacePass.uniforms['resolution'].value.set(container.clientWidth, container.clientHeight)
    composer.addPass(screenspacePass)
    composer.addPass(new OutputPass())

    // GUI overlay (DOM-only, no innerHTML — pure DOM building)
    const guiEl = document.createElement('div')
    guiEl.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.7);padding:14px;border-radius:8px;font-family:monospace;color:white;z-index:100;min-width:220px'
    const title = document.createElement('h3')
    title.style.cssText = 'margin:0 0 10px;font-size:13px;border-bottom:1px solid #555;padding-bottom:6px'
    title.textContent = 'Screenspace Pass'
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
    const mkToggle = (label: string, val: boolean, onChange: (v: boolean) => void) => {
        const wrap = document.createElement('label')
        wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
        const input = document.createElement('input')
        input.type = 'checkbox'; input.checked = val
        input.addEventListener('change', () => onChange(input.checked))
        wrap.appendChild(input); wrap.append(' ' + label); guiEl.appendChild(wrap)
    }
    mkRange('amplitude', 0, 0.1, 0.001, params.amplitude, v => { params.amplitude = v })
    mkRange('frequency', 4, 120, 0.5, params.frequency, v => { params.frequency = v })
    mkToggle('animate camera', params.animateCamera, v => { params.animateCamera = v })
    container.style.position = 'relative'
    container.appendChild(guiEl)

    const clock = new THREE.Clock()

    const animate = () => {
        const elapsed = clock.getElapsedTime()
        torusKnot.rotation.x = elapsed * 0.35
        torusKnot.rotation.y = elapsed * 0.5
        if (params.animateCamera) {
            camera.position.x = Math.sin(elapsed * 0.2) * 4
            camera.position.z = Math.cos(elapsed * 0.2) * 4
            camera.lookAt(0, 0, 0)
        }
        screenspacePass.uniforms['time'].value = elapsed
        screenspacePass.uniforms['amplitude'].value = params.amplitude
        screenspacePass.uniforms['frequency'].value = params.frequency
        controls.update()
        composer.render()
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
        composer.setSize(container.clientWidth, container.clientHeight)
        screenspacePass.uniforms['resolution'].value.set(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        knotGeo.dispose(); knotMat.dispose()
        bgGeo.dispose(); bgMat.dispose(); bgTex.dispose()
        composer.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(guiEl)) container.removeChild(guiEl)
    }
}

export const WebGLPostprocessingScreenspace = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLPostprocessingScreenspace
