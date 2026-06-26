/** @jsxImportSource woby */
// Postprocessing — fullscreen procedural shader (no scene render; just a quad with a procedural fragment)
import * as THREE from 'three'

let _cleanupFn: (() => void) | null = null

const VERT = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

// THREE.ShaderChunk.common provides `rand( vec2 )` — match the upstream pattern
const COMMON = THREE.ShaderChunk.common

const FRAG_NOISE_1D = `
    ${COMMON}
    uniform float time;
    varying vec2 vUv;
    void main() {
        gl_FragColor.xyz = vec3(rand(vUv + time * 0.05));
        gl_FragColor.w = 1.0;
    }
`

const FRAG_NOISE_2D = `
    ${COMMON}
    uniform float time;
    varying vec2 vUv;
    void main() {
        vec2 t = vec2(time * 0.07, -time * 0.05);
        vec2 rand2 = vec2(rand(vUv + t), rand(vUv + vec2(0.4, 0.6) + t));
        gl_FragColor.xyz = mix(mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 1.0), rand2.x), vec3(0.0), rand2.y);
        gl_FragColor.w = 1.0;
    }
`

const FRAG_NOISE_3D = `
    ${COMMON}
    uniform float time;
    varying vec2 vUv;
    void main() {
        vec2 t = vec2(time * 0.04, time * 0.06);
        vec3 rand3 = vec3(
            rand(vUv + t),
            rand(vUv + vec2(0.4, 0.6) + t),
            rand(vUv + vec2(0.6, 0.4) + t)
        );
        gl_FragColor.xyz = rand3;
        gl_FragColor.w = 1.0;
    }
`

type ProcedureKey = 'noiseRandom1D' | 'noiseRandom2D' | 'noiseRandom3D'

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const width = container.clientWidth
    const height = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const mk = (frag: string) => new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: VERT,
        fragmentShader: frag,
    })
    const materials: Record<ProcedureKey, THREE.ShaderMaterial> = {
        noiseRandom1D: mk(FRAG_NOISE_1D),
        noiseRandom2D: mk(FRAG_NOISE_2D),
        noiseRandom3D: mk(FRAG_NOISE_3D),
    }

    const params: { procedure: ProcedureKey } = { procedure: 'noiseRandom3D' }

    const postPlane = new THREE.PlaneGeometry(2, 2)
    const postQuad = new THREE.Mesh(postPlane, materials[params.procedure])
    const postScene = new THREE.Scene()
    postScene.add(postQuad)

    // GUI overlay (DOM-only)
    const guiEl = document.createElement('div')
    guiEl.style.cssText = 'position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.7);padding:14px;border-radius:8px;font-family:monospace;color:white;z-index:100;min-width:220px'
    const title = document.createElement('h3')
    title.style.cssText = 'margin:0 0 10px;font-size:13px;border-bottom:1px solid #555;padding-bottom:6px'
    title.textContent = 'Procedural Shader (fullscreen)'
    guiEl.appendChild(title)
    const wrap = document.createElement('label')
    wrap.style.cssText = 'display:block;margin:6px 0;font-size:12px'
    wrap.textContent = 'procedure '
    const sel = document.createElement('select')
    sel.style.cssText = 'background:#222;color:#fff;border:1px solid #555;padding:2px'
    ;(['noiseRandom1D', 'noiseRandom2D', 'noiseRandom3D'] as ProcedureKey[]).forEach(opt => {
        const o = document.createElement('option')
        o.value = opt; o.textContent = opt
        if (opt === params.procedure) o.selected = true
        sel.appendChild(o)
    })
    sel.addEventListener('change', () => {
        params.procedure = sel.value as ProcedureKey
        postQuad.material = materials[params.procedure]
    })
    wrap.appendChild(sel); guiEl.appendChild(wrap)
    container.style.position = 'relative'
    container.appendChild(guiEl)

    const clock = new THREE.Clock()
    const animate = () => {
        const t = clock.getElapsedTime()
        materials.noiseRandom1D.uniforms.time.value = t
        materials.noiseRandom2D.uniforms.time.value = t
        materials.noiseRandom3D.uniforms.time.value = t
        renderer.render(postScene, postCamera)
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        postPlane.dispose()
        materials.noiseRandom1D.dispose()
        materials.noiseRandom2D.dispose()
        materials.noiseRandom3D.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(guiEl)) container.removeChild(guiEl)
    }
}

export const WebGLPostprocessingProcedural = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLPostprocessingProcedural
