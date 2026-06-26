/** @jsxImportSource woby */
// Postprocessing — ClearPass + TexturePass + CubeTexturePass + RenderPass background compositing
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass'
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

// Procedurally generate a hardwood-like diffuse texture (no external asset dependency).
const makeWoodTexture = (size = 256): THREE.CanvasTexture => {
    const c = document.createElement('canvas')
    c.width = size; c.height = size
    const ctx = c.getContext('2d')!
    // Base wood color
    ctx.fillStyle = '#6b4a2b'
    ctx.fillRect(0, 0, size, size)
    // Grain stripes
    for (let i = 0; i < 60; i++) {
        const y = Math.random() * size
        const lightness = 35 + Math.random() * 25
        ctx.strokeStyle = `hsla(28, 45%, ${lightness}%, 0.55)`
        ctx.lineWidth = 0.5 + Math.random() * 2
        ctx.beginPath()
        ctx.moveTo(0, y)
        for (let x = 0; x < size; x += 8) {
            ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 4)
        }
        ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

// Procedural cube map — 6 distinct gradient faces so the cube background is visibly present.
const makeProceduralCubeTexture = (size = 128): THREE.CubeTexture => {
    const colors = [
        ['#ff8a5b', '#fff1c1'], // px
        ['#5bafff', '#c1e6ff'], // nx
        ['#7bff8c', '#dfffe1'], // py
        ['#ffd25b', '#fff5d4'], // ny
        ['#b15bff', '#ecd6ff'], // pz
        ['#ff5b9d', '#ffd6ec'], // nz
    ]
    const faces: HTMLCanvasElement[] = colors.map(([top, bot]) => {
        const c = document.createElement('canvas')
        c.width = size; c.height = size
        const ctx = c.getContext('2d')!
        const grad = ctx.createLinearGradient(0, 0, 0, size)
        grad.addColorStop(0, top)
        grad.addColorStop(1, bot)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, size, size)
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 2
        ctx.strokeRect(2, 2, size - 4, size - 4)
        return c
    })
    const cube = new THREE.CubeTexture(faces)
    cube.needsUpdate = true
    cube.colorSpace = THREE.SRGBColorSpace
    return cube
}

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const width = container.clientWidth
    const height = container.clientHeight
    const aspect = width / height

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    const cameraP = new THREE.PerspectiveCamera(65, aspect, 1, 100)
    cameraP.position.z = 7

    const scene = new THREE.Scene()
    const group = new THREE.Group()
    scene.add(group)

    // Lighting
    const l1 = new THREE.PointLight(0xefffef, 500)
    l1.position.set(-10, -10, 10)
    scene.add(l1)
    const l2 = new THREE.PointLight(0xffefef, 500)
    l2.position.set(-10, 10, 10)
    scene.add(l2)
    const l3 = new THREE.PointLight(0xefefff, 500)
    l3.position.set(10, -10, 10)
    scene.add(l3)

    // Foreground sphere — semi-transparent edges via rim so the background pass shows through
    const sphereGeom = new THREE.SphereGeometry(1, 48, 24)
    const sphereMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 })
    sphereMat.color.setHSL(0.55, 1.0, 0.5)
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    group.add(sphere)

    // Postprocessing chain: Clear -> Texture -> Cube -> Render -> Output
    const composer = new EffectComposer(renderer)

    const params = {
        clearPass: true,
        clearColor: 'white',
        clearAlpha: 1.0,
        texturePass: true,
        texturePassOpacity: 0.6,
        cubeTexturePass: true,
        cubeTexturePassOpacity: 0.8,
        renderPass: true,
    }
    const colorMap: Record<string, THREE.Color> = {
        black: new THREE.Color(0x000000),
        white: new THREE.Color(0xffffff),
        blue: new THREE.Color(0x2244ff),
        green: new THREE.Color(0x22aa44),
        red: new THREE.Color(0xcc3344),
    }

    const clearPass = new ClearPass(colorMap[params.clearColor], params.clearAlpha)
    composer.addPass(clearPass)

    const wood = makeWoodTexture(256)
    const texturePass = new TexturePass(wood, params.texturePassOpacity)
    composer.addPass(texturePass)

    // CubeTexturePass requires three/examples/jsm — load lazily so the module path stays clean
    let cubeTexturePassP: any = null
    let _cubeTex: THREE.CubeTexture | null = null
    ;(async () => {
        const mod: any = await import('three/examples/jsm/postprocessing/CubeTexturePass.js')
        const CubeTexturePass = mod.CubeTexturePass
        _cubeTex = makeProceduralCubeTexture(128)
        cubeTexturePassP = new CubeTexturePass(cameraP, _cubeTex, params.cubeTexturePassOpacity)
        composer.insertPass(cubeTexturePassP, 2)
    })()

    const renderPass = new RenderPass(scene, cameraP)
    renderPass.clear = false
    composer.addPass(renderPass)

    composer.addPass(new OutputPass())

    const controls = new OrbitControls(cameraP, renderer.domElement)
    controls.enableZoom = true

    // GUI overlay (DOM-only)
    const guiEl = document.createElement('div')
    guiEl.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.7);padding:14px;border-radius:8px;font-family:monospace;color:white;z-index:100;min-width:240px'
    const title = document.createElement('h3')
    title.style.cssText = 'margin:0 0 10px;font-size:13px;border-bottom:1px solid #555;padding-bottom:6px'
    title.textContent = 'Backgrounds: Clear + Texture + Cube + Render'
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
    const mkSelect = (label: string, options: string[], val: string, onChange: (v: string) => void) => {
        const wrap = document.createElement('label')
        wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
        wrap.textContent = label + ' '
        const sel = document.createElement('select')
        sel.style.cssText = 'background:#222;color:#fff;border:1px solid #555;padding:2px'
        options.forEach(opt => {
            const o = document.createElement('option')
            o.value = opt; o.textContent = opt
            if (opt === val) o.selected = true
            sel.appendChild(o)
        })
        sel.addEventListener('change', () => onChange(sel.value))
        wrap.appendChild(sel); guiEl.appendChild(wrap)
    }
    mkToggle('clearPass', params.clearPass, v => { params.clearPass = v; clearPass.enabled = v })
    mkSelect('clearColor', ['black', 'white', 'blue', 'green', 'red'], params.clearColor, v => { params.clearColor = v; clearPass.clearColor = colorMap[v] })
    mkRange('clearAlpha', 0, 1, 0.01, params.clearAlpha, v => { params.clearAlpha = v; clearPass.clearAlpha = v })
    mkToggle('texturePass', params.texturePass, v => { params.texturePass = v; texturePass.enabled = v })
    mkRange('texturePassOpacity', 0, 1, 0.01, params.texturePassOpacity, v => { params.texturePassOpacity = v; texturePass.opacity = v })
    mkToggle('cubeTexturePass', params.cubeTexturePass, v => { params.cubeTexturePass = v; if (cubeTexturePassP) cubeTexturePassP.enabled = v })
    mkRange('cubeTexturePassOpacity', 0, 1, 0.01, params.cubeTexturePassOpacity, v => { params.cubeTexturePassOpacity = v; if (cubeTexturePassP) cubeTexturePassP.opacity = v })
    mkToggle('renderPass', params.renderPass, v => { params.renderPass = v; renderPass.enabled = v })
    container.style.position = 'relative'
    container.appendChild(guiEl)

    const animate = () => {
        const t = performance.now() * 0.001
        group.rotation.y = t * 0.4
        sphere.position.y = Math.sin(t * 0.8) * 0.3
        controls.update()
        composer.render()
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight
        cameraP.aspect = w / h
        cameraP.updateProjectionMatrix()
        renderer.setSize(w, h)
        composer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        sphereGeom.dispose(); sphereMat.dispose()
        wood.dispose()
        if (_cubeTex) _cubeTex.dispose()
        composer.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(guiEl)) container.removeChild(guiEl)
    }
}

export const WebGLPostprocessingBackgrounds = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLPostprocessingBackgrounds
