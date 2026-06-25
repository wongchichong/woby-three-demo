/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x101418)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200)
    camera.position.set(0, 0, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)
    controls.update()

    // Build a sprite texture procedurally (a colored disc with a darker rim)
    const buildSpriteTexture = (color: string) => {
        const size = 128
        const cvs = document.createElement('canvas')
        cvs.width = cvs.height = size
        const ctx = cvs.getContext('2d')!
        const grad = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2)
        grad.addColorStop(0.0, '#ffffff')
        grad.addColorStop(0.35, color)
        grad.addColorStop(0.95, color)
        grad.addColorStop(1.0, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
        ctx.fill()
        const t = new THREE.CanvasTexture(cvs)
        t.colorSpace = THREE.SRGBColorSpace
        return t
    }

    const palette = ['#ff5566', '#66cc66', '#4488ff', '#ffcc33', '#aa66ff', '#ff8844', '#66ddee', '#ee66cc']
    const textures: THREE.Texture[] = palette.map(c => buildSpriteTexture(c))

    const N = 120
    const sprites: THREE.Sprite[] = []
    const materials: THREE.SpriteMaterial[] = []
    const baseColors: THREE.Color[] = []

    for (let i = 0; i < N; i++) {
        const tex = textures[i % textures.length]
        const mat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true })
        const s = new THREE.Sprite(mat)
        // Distribute on a sphere shell
        const r = 8 + Math.random() * 6
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        s.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi),
        )
        const scl = 0.8 + Math.random() * 0.9
        s.scale.set(scl, scl, 1)
        scene.add(s)
        sprites.push(s)
        materials.push(mat)
        baseColors.push(new THREE.Color(0xffffff))
    }

    // Picking
    const raycaster = new THREE.Raycaster()
    raycaster.params.Sprite = {}
    const pointer = new THREE.Vector2(-2, -2) // off-screen until first move
    let hovered: THREE.Sprite | null = null
    const HIGHLIGHT = new THREE.Color(0xffff66)

    const onPointerMove = (e: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    renderer.domElement.addEventListener('pointermove', onPointerMove)

    // HUD overlay for count
    const hud = document.createElement('div')
    hud.style.cssText = 'position:absolute;top:8px;left:8px;color:#fff;background:rgba(0,0,0,0.5);padding:6px 10px;border-radius:6px;font:13px sans-serif;pointer-events:none;z-index:2'
    hud.textContent = `Sprites: ${N} — hover to highlight`
    container.style.position = container.style.position || 'relative'
    container.appendChild(hud)

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        controls.update()

        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(sprites, false)
        const newHovered = hits.length > 0 ? (hits[0].object as THREE.Sprite) : null

        if (newHovered !== hovered) {
            if (hovered) {
                const idx = sprites.indexOf(hovered)
                if (idx >= 0) (materials[idx].color as THREE.Color).copy(baseColors[idx])
            }
            if (newHovered) {
                const idx = sprites.indexOf(newHovered)
                if (idx >= 0) (materials[idx].color as THREE.Color).copy(HIGHLIGHT)
                hud.textContent = `Hovered sprite #${idx} of ${N}`
            } else {
                hud.textContent = `Sprites: ${N} — hover to highlight`
            }
            hovered = newHovered
        }

        renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
        const W = container.clientWidth
        const H = container.clientHeight
        camera.aspect = W / H
        camera.updateProjectionMatrix()
        renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
        controls.dispose()
        materials.forEach(m => m.dispose())
        textures.forEach(t => t.dispose())
        renderer.dispose()
        if (container.contains(hud)) container.removeChild(hud)
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLRaycastSprite = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
)
export default WebGLRaycastSprite
