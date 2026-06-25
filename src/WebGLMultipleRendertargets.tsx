/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    container.appendChild(renderer.domElement)

    // WebGL2 / MRT capability check
    const isWebGL2 = renderer.capabilities.isWebGL2
    if (!isWebGL2) {
        const msg = document.createElement('div')
        msg.style.cssText = 'position:absolute;top:8px;left:8px;color:red;background:white;padding:8px;font:14px sans-serif;z-index:10'
        msg.textContent = 'Multiple render targets require WebGL2.'
        container.appendChild(msg)
    }

    // First-pass scene
    const sceneFirst = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 50)
    camera.position.set(0, 0, 4)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)
    controls.update()

    // Render target with 2 color attachments
    const dpr = renderer.getPixelRatio()
    const renderTarget = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {
        count: 2,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.UnsignedByteType,
    })
    renderTarget.textures[0].name = 'diffuse'
    renderTarget.textures[1].name = 'normal'

    // MRT vertex shader
    const mrtVS = /* glsl */`
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
out vec2 vUv;
out vec3 vNormal;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

    // MRT fragment shader: write to two output locations
    const mrtFS = /* glsl */`
precision highp float;
in vec2 vUv;
in vec3 vNormal;
uniform sampler2D tDiffuse;
layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gNormal;
void main() {
    vec3 diff = texture(tDiffuse, vUv).rgb;
    gColor = vec4(diff, 1.0);
    gNormal = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
}`

    // Procedural checker texture so we don't need an external file
    const buildCheckerTex = () => {
        const size = 256
        const cvs = document.createElement('canvas')
        cvs.width = cvs.height = size
        const ctx = cvs.getContext('2d')!
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                ctx.fillStyle = ((x + y) % 2 === 0) ? '#ff5566' : '#fff8e0'
                ctx.fillRect(x * 16, y * 16, 16, 16)
            }
        }
        const t = new THREE.CanvasTexture(cvs)
        t.colorSpace = THREE.SRGBColorSpace
        return t
    }
    const diffuseTex = buildCheckerTex()

    const mrtMat = new THREE.RawShaderMaterial({
        vertexShader: mrtVS,
        fragmentShader: mrtFS,
        uniforms: { tDiffuse: { value: diffuseTex } },
        glslVersion: THREE.GLSL3,
    })

    const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2)
    const box = new THREE.Mesh(boxGeo, mrtMat)
    sceneFirst.add(box)

    const torusGeo = new THREE.TorusKnotGeometry(0.45, 0.13, 80, 16)
    const torus = new THREE.Mesh(torusGeo, mrtMat)
    torus.position.set(1.6, 0, 0)
    sceneFirst.add(torus)

    // Composite scene: fullscreen quad sampling both targets to produce split composite
    const compositeScene = new THREE.Scene()
    const compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const compositeVS = /* glsl */`
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}`

    const compositeFS = /* glsl */`
precision highp float;
in vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
out vec4 outColor;
void main() {
    if (vUv.x < 0.5) {
        outColor = texture(tDiffuse, vec2(vUv.x * 2.0, vUv.y));
    } else {
        outColor = texture(tNormal, vec2((vUv.x - 0.5) * 2.0, vUv.y));
    }
}`

    const compositeMat = new THREE.RawShaderMaterial({
        vertexShader: compositeVS,
        fragmentShader: compositeFS,
        uniforms: {
            tDiffuse: { value: renderTarget.textures[0] },
            tNormal: { value: renderTarget.textures[1] },
        },
        glslVersion: THREE.GLSL3,
    })

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMat)
    compositeScene.add(quad)

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        box.rotation.x += 0.005
        box.rotation.y += 0.01
        torus.rotation.x += 0.01
        torus.rotation.y += 0.005
        controls.update()

        // First pass into MRT
        renderer.setRenderTarget(renderTarget)
        renderer.clear()
        renderer.render(sceneFirst, camera)

        // Second pass to default framebuffer (composite)
        renderer.setRenderTarget(null)
        renderer.clear()
        renderer.render(compositeScene, compositeCamera)
    }
    animate()

    const onResize = () => {
        const W = container.clientWidth
        const H = container.clientHeight
        camera.aspect = W / H
        camera.updateProjectionMatrix()
        renderer.setSize(W, H)
        const r = renderer.getPixelRatio()
        renderTarget.setSize(W * r, H * r)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        boxGeo.dispose(); torusGeo.dispose()
        mrtMat.dispose(); compositeMat.dispose()
        diffuseTex.dispose()
        renderTarget.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLMultipleRendertargets = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
)
export default WebGLMultipleRendertargets
