/** @jsxImportSource woby */
// Postprocessing — HalftonePass (RGB channel-separated dot pattern)
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const width = container.clientWidth
    const height = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000)
    camera.position.z = 12

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x444444)

    const group = new THREE.Group()
    // Floor
    const floorGeo = new THREE.BoxGeometry(100, 1, 100)
    const floorMat = new THREE.MeshPhongMaterial({})
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.position.y = -10
    group.add(floor)

    const light = new THREE.PointLight(0xffffff, 250)
    light.position.y = 2
    group.add(light)
    scene.add(group)

    // Coloured cubes with a normal+UV-driven shader so RGB channels diverge — important for visible halftone separation
    const mat = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: `
            varying vec2 vUV;
            varying vec3 vNormal;
            void main() {
                vUV = uv;
                vNormal = vec3(normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUV;
            varying vec3 vNormal;
            void main() {
                vec4 c = vec4(abs(vNormal) + vec3(vUV, 0.0), 0.0);
                gl_FragColor = c;
            }
        `,
    })

    const cubeGeo = new THREE.BoxGeometry(2, 2, 2)
    const cubes: THREE.Mesh[] = []
    for (let i = 0; i < 50; i++) {
        const m = new THREE.Mesh(cubeGeo, mat)
        m.position.set(Math.random() * 16 - 8, Math.random() * 16 - 8, Math.random() * 16 - 8)
        m.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
        cubes.push(m)
        group.add(m)
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0, 0)
    controls.update()

    // Postprocessing
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const halftoneParams = {
        shape: 1,
        radius: 4,
        rotateR: Math.PI / 12,
        rotateB: Math.PI / 12 * 2,
        rotateG: Math.PI / 12 * 3,
        scatter: 0,
        blending: 1,
        blendingMode: 1,
        greyscale: false,
        disable: false,
    }
    const halftonePass = new HalftonePass(width, height, halftoneParams)
    composer.addPass(halftonePass)
    composer.addPass(new OutputPass())

    // GUI overlay (DOM-only)
    const guiEl = document.createElement('div')
    guiEl.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.7);padding:14px;border-radius:8px;font-family:monospace;color:white;z-index:100;min-width:240px'
    const title = document.createElement('h3')
    title.style.cssText = 'margin:0 0 10px;font-size:13px;border-bottom:1px solid #555;padding-bottom:6px'
    title.textContent = 'RGB Halftone Pass'
    guiEl.appendChild(title)
    const controller = {
        radius: halftonePass.uniforms['radius'].value,
        rotateR: halftonePass.uniforms['rotateR'].value / (Math.PI / 180),
        rotateG: halftonePass.uniforms['rotateG'].value / (Math.PI / 180),
        rotateB: halftonePass.uniforms['rotateB'].value / (Math.PI / 180),
        scatter: halftonePass.uniforms['scatter'].value,
        shape: halftonePass.uniforms['shape'].value,
        greyscale: halftonePass.uniforms['greyscale'].value,
        blending: halftonePass.uniforms['blending'].value,
        blendingMode: halftonePass.uniforms['blendingMode'].value,
        disable: halftonePass.uniforms['disable'].value,
    }
    const apply = () => {
        halftonePass.uniforms['radius'].value = controller.radius
        halftonePass.uniforms['rotateR'].value = controller.rotateR * (Math.PI / 180)
        halftonePass.uniforms['rotateG'].value = controller.rotateG * (Math.PI / 180)
        halftonePass.uniforms['rotateB'].value = controller.rotateB * (Math.PI / 180)
        halftonePass.uniforms['scatter'].value = controller.scatter
        halftonePass.uniforms['shape'].value = controller.shape
        halftonePass.uniforms['greyscale'].value = controller.greyscale
        halftonePass.uniforms['blending'].value = controller.blending
        halftonePass.uniforms['blendingMode'].value = controller.blendingMode
        halftonePass.uniforms['disable'].value = controller.disable
    }
    const mkRange = (label: string, min: number, max: number, step: number, val: number, onChange: (v: number) => void) => {
        const wrap = document.createElement('label')
        wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
        wrap.textContent = label
        const input = document.createElement('input')
        input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.valueAsNumber = val
        input.style.width = '100%'
        input.addEventListener('input', () => { onChange(input.valueAsNumber); apply() })
        wrap.appendChild(input); guiEl.appendChild(wrap)
    }
    const mkToggle = (label: string, val: boolean, onChange: (v: boolean) => void) => {
        const wrap = document.createElement('label')
        wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
        const input = document.createElement('input')
        input.type = 'checkbox'; input.checked = val
        input.addEventListener('change', () => { onChange(input.checked); apply() })
        wrap.appendChild(input); wrap.append(' ' + label); guiEl.appendChild(wrap)
    }
    const mkSelect = (label: string, options: Array<[string, number]>, val: number, onChange: (v: number) => void) => {
        const wrap = document.createElement('label')
        wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
        wrap.textContent = label + ' '
        const sel = document.createElement('select')
        sel.style.cssText = 'background:#222;color:#fff;border:1px solid #555;padding:2px'
        options.forEach(([name, v]) => {
            const o = document.createElement('option')
            o.value = String(v); o.textContent = name
            if (v === val) o.selected = true
            sel.appendChild(o)
        })
        sel.addEventListener('change', () => { onChange(Number(sel.value)); apply() })
        wrap.appendChild(sel); guiEl.appendChild(wrap)
    }
    mkSelect('shape', [['Dot', 1], ['Ellipse', 2], ['Line', 3], ['Square', 4], ['Diamond', 5]], controller.shape, v => { controller.shape = v })
    mkRange('radius', 1, 25, 0.1, controller.radius, v => { controller.radius = v })
    mkRange('rotateR', 0, 90, 0.5, controller.rotateR, v => { controller.rotateR = v })
    mkRange('rotateG', 0, 90, 0.5, controller.rotateG, v => { controller.rotateG = v })
    mkRange('rotateB', 0, 90, 0.5, controller.rotateB, v => { controller.rotateB = v })
    mkRange('scatter', 0, 1, 0.01, controller.scatter, v => { controller.scatter = v })
    mkToggle('greyscale', controller.greyscale, v => { controller.greyscale = v })
    mkRange('blending', 0, 1, 0.01, controller.blending, v => { controller.blending = v })
    mkSelect('blendingMode', [['Linear', 1], ['Multiply', 2], ['Add', 3], ['Lighter', 4], ['Darker', 5]], controller.blendingMode, v => { controller.blendingMode = v })
    mkToggle('disable', controller.disable, v => { controller.disable = v })
    container.style.position = 'relative'
    container.appendChild(guiEl)

    const clock = new THREE.Clock()
    const rotationSpeed = Math.PI / 64
    const animate = () => {
        const delta = clock.getDelta()
        group.rotation.y += delta * rotationSpeed
        composer.render(delta)
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight
        renderer.setSize(w, h)
        composer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        cubeGeo.dispose(); mat.dispose()
        floorGeo.dispose(); floorMat.dispose()
        composer.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(guiEl)) container.removeChild(guiEl)
    }
}

export const WebGLPostprocessingRGBHalftone = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLPostprocessingRGBHalftone
