/** @jsxImportSource woby */
import * as THREE from 'three'

let _cleanupFn: (() => void) | null = null

interface SceneEntry {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    el: HTMLDivElement
    mesh: THREE.Mesh
}

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    // Layout: scrollable content with text blocks interleaved with 3D scene divs.
    // Renderer canvas is pinned absolute to container, sized to its viewport.
    container.style.position = 'relative'
    container.style.overflow = 'auto'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.background = '#f4f4f4'

    // Canvas wrapper (absolute to container, sticky to viewport via position fixed effect achieved by re-setting on scroll)
    const canvasWrapper = document.createElement('div')
    canvasWrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1'
    container.appendChild(canvasWrapper)

    // Content area (scrollable)
    const content = document.createElement('div')
    content.style.cssText = 'position:relative;z-index:2;padding:24px;color:#222;font:16px/1.6 system-ui, sans-serif;max-width:920px;margin:0 auto;background:transparent;pointer-events:auto'
    container.appendChild(content)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0xf4f4f4, 1)
    renderer.setScissorTest(true)
    // Make canvas itself absolutely positioned, follow scroll by repositioning in animate
    const cvs = renderer.domElement
    cvs.style.cssText = 'position:absolute;top:0;left:0;display:block'
    canvasWrapper.appendChild(cvs)

    // Create scenes
    const sceneEntries: SceneEntry[] = []
    const geometries: Array<() => THREE.BufferGeometry> = [
        () => new THREE.BoxGeometry(1, 1, 1),
        () => new THREE.SphereGeometry(0.6, 32, 16),
        () => new THREE.TorusGeometry(0.5, 0.2, 16, 64),
        () => new THREE.DodecahedronGeometry(0.7),
        () => new THREE.IcosahedronGeometry(0.7, 0),
        () => new THREE.ConeGeometry(0.6, 1.0, 32),
    ]
    const colors = [0xff5566, 0x44aaff, 0x66cc66, 0xffaa00, 0xaa66ff, 0xff8844]

    const buildSceneDiv = (label: string, idx: number) => {
        const wrap = document.createElement('div')
        wrap.style.cssText = 'width:240px;height:240px;margin:16px;display:inline-block;vertical-align:middle;border:1px solid #ddd;border-radius:8px;background:transparent'
        wrap.dataset.idx = String(idx)
        wrap.dataset.label = label

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
        camera.position.set(0, 0, 2.6)
        scene.add(new THREE.AmbientLight(0xffffff, 0.5))
        const dir = new THREE.DirectionalLight(0xffffff, 1.0)
        dir.position.set(2, 2, 2)
        scene.add(dir)

        const mesh = new THREE.Mesh(
            geometries[idx % geometries.length](),
            new THREE.MeshStandardMaterial({ color: colors[idx % colors.length], metalness: 0.2, roughness: 0.6 })
        )
        scene.add(mesh)

        sceneEntries.push({ scene, camera, el: wrap, mesh })
        return wrap
    }

    const paragraph = (text: string) => {
        const p = document.createElement('p')
        p.textContent = text
        return p
    }
    const heading = (text: string) => {
        const h = document.createElement('h2')
        h.textContent = text
        h.style.cssText = 'margin-top:32px;color:#111'
        return h
    }

    content.appendChild(heading('Three.js — Multiple Element Scenes'))
    content.appendChild(paragraph(
        'This page demonstrates many independent 3D scenes, each pinned to its own DOM element. ' +
        'The renderer canvas is fixed to the viewport; per-frame, each scene reads its element rect and renders into a scissored sub-viewport.'
    ))
    for (let i = 0; i < 6; i++) {
        content.appendChild(buildSceneDiv(`Scene ${i + 1}`, i))
        const txt = paragraph(
            'Scrolling the page moves each scene\'s sub-viewport with its DOM element. ' +
            'When an element is off-screen its render call is skipped (zero work). ' +
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
            'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
        )
        content.appendChild(txt)
    }

    const updateSize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', updateSize)
    updateSize()

    let animId = 0
    const clock = new THREE.Clock()
    const animate = () => {
        animId = requestAnimationFrame(animate)
        const delta = clock.getDelta()

        // Reposition canvas wrapper to follow scroll so it stays viewport-locked
        canvasWrapper.style.transform = `translateY(${container.scrollTop}px)`

        renderer.setClearColor(0xf4f4f4, 1)
        renderer.clear()

        const containerRect = container.getBoundingClientRect()

        for (const e of sceneEntries) {
            e.mesh.rotation.x += delta * 0.4
            e.mesh.rotation.y += delta * 0.6

            const rect = e.el.getBoundingClientRect()
            // skip if completely off-screen relative to container viewport
            if (rect.bottom < containerRect.top || rect.top > containerRect.bottom ||
                rect.right < containerRect.left || rect.left > containerRect.right) {
                continue
            }
            const width = rect.right - rect.left
            const height = rect.bottom - rect.top
            const left = rect.left - containerRect.left
            // WebGL y is inverted relative to DOM (origin at bottom-left)
            const bottom = container.clientHeight - (rect.bottom - containerRect.top)

            e.camera.aspect = width / height
            e.camera.updateProjectionMatrix()

            renderer.setViewport(left, bottom, width, height)
            renderer.setScissor(left, bottom, width, height)
            renderer.render(e.scene, e.camera)
        }
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', updateSize)
        for (const e of sceneEntries) {
            e.mesh.geometry.dispose()
            ;(e.mesh.material as THREE.Material).dispose()
        }
        renderer.dispose()
        if (container.contains(canvasWrapper)) container.removeChild(canvasWrapper)
        if (container.contains(content)) container.removeChild(content)
    }
}

export const WebGLMultipleElementsText = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
)
export default WebGLMultipleElementsText
