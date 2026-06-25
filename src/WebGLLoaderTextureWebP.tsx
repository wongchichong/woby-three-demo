/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

// Generate a colorful pattern canvas at runtime, then encode as a WebP blob
// using the browser's native WebP encoder. This demonstrates both
// encoding (canvas → WebP) and decoding (TextureLoader → GPU texture).
const generateSourceCanvas = (size: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Radial gradient background
    const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.7)
    grad.addColorStop(0, '#ffeb3b')
    grad.addColorStop(0.5, '#ff5722')
    grad.addColorStop(1, '#3f51b5')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Colorful concentric rings
    for (let r = size * 0.45; r > 16; r -= 28) {
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
        ctx.strokeStyle = `hsl(${(r * 3) % 360}, 90%, 55%)`
        ctx.lineWidth = 6
        ctx.stroke()
    }

    // Diagonal stripes
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#000'
    for (let x = -size; x < size * 2; x += 24) {
        ctx.beginPath()
        ctx.moveTo(x, 0); ctx.lineTo(x + size, size); ctx.lineTo(x + size + 8, size); ctx.lineTo(x + 8, 0)
        ctx.closePath(); ctx.fill()
    }
    ctx.restore()

    // Center label
    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.floor(size * 0.14)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.7)'
    ctx.shadowBlur = 8
    ctx.fillText('WebP', size / 2, size / 2 - size * 0.05)
    ctx.font = `bold ${Math.floor(size * 0.07)}px sans-serif`
    ctx.fillText('runtime-encoded', size / 2, size / 2 + size * 0.09)

    return canvas
}

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x18181f)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 1.5
    controls.maxDistance = 10

    scene.add(new THREE.AmbientLight(0xffffff, 1.0))

    // Two side-by-side quads:
    //   left  → texture decoded from a runtime-generated WebP blob
    //   right → texture from the same canvas (no WebP roundtrip) for visual parity check
    const quadGeo = new THREE.PlaneGeometry(1.6, 1.6)
    const leftMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide })
    const rightMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide })

    const leftMesh = new THREE.Mesh(quadGeo, leftMat)
    leftMesh.position.x = -1.0
    scene.add(leftMesh)

    const rightMesh = new THREE.Mesh(quadGeo, rightMat)
    rightMesh.position.x = 1.0
    scene.add(rightMesh)

    // Frame outlines
    const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.62, 1.62))
    const frameMat = new THREE.LineBasicMaterial({ color: 0x8888aa })
    const leftFrame = new THREE.LineSegments(frameGeo, frameMat); leftFrame.position.x = -1.0; scene.add(leftFrame)
    const rightFrame = new THREE.LineSegments(frameGeo, frameMat); rightFrame.position.x = 1.0; scene.add(rightFrame)

    // Status overlay (no innerHTML — pure DOM building)
    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;max-width:360px;line-height:1.5;white-space:pre-wrap'
    container.style.position = 'relative'
    container.appendChild(statusEl)
    let status = 'Generating source canvas…'
    const setStatus = (s: string) => { status = s; statusEl.textContent = status }
    setStatus(status)

    // Labels
    const labelStyle = 'position:absolute;color:white;font-family:monospace;font-size:12px;background:rgba(0,0,0,0.6);padding:4px 8px;border-radius:4px;z-index:50;pointer-events:none'
    const leftLabel = document.createElement('div')
    leftLabel.style.cssText = labelStyle + ';bottom:20px;left:20px'
    leftLabel.textContent = 'WebP roundtrip (encode → blob → TextureLoader)'
    container.appendChild(leftLabel)
    const rightLabel = document.createElement('div')
    rightLabel.style.cssText = labelStyle + ';bottom:20px;right:20px'
    rightLabel.textContent = 'CanvasTexture (direct, for comparison)'
    container.appendChild(rightLabel)

    // Build source canvas
    const sourceCanvas = generateSourceCanvas(512)

    // Right side: direct CanvasTexture (immediate)
    const directTex = new THREE.CanvasTexture(sourceCanvas)
    directTex.colorSpace = THREE.SRGBColorSpace
    rightMat.map = directTex
    rightMat.color.set(0xffffff)
    rightMat.needsUpdate = true

    // Left side: encode as WebP blob, then decode via standard TextureLoader
    let loadedTexture: THREE.Texture | null = null
    let objectUrl: string | null = null
    const loader = new THREE.TextureLoader()

    if (typeof sourceCanvas.toBlob !== 'function') {
        setStatus('canvas.toBlob unavailable — WebP roundtrip cannot be demonstrated')
        statusEl.style.color = '#f88'
    } else {
        sourceCanvas.toBlob((blob) => {
            if (!blob) {
                setStatus('canvas.toBlob returned null — browser may lack WebP encode support')
                statusEl.style.color = '#f88'
                return
            }
            const sizeKb = (blob.size / 1024).toFixed(1)
            const mime = blob.type || '(unknown)'
            setStatus(`Encoded canvas → ${mime}, ${sizeKb} KB. Loading via TextureLoader…`)
            objectUrl = URL.createObjectURL(blob)
            loader.load(
                objectUrl,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace
                    texture.needsUpdate = true
                    loadedTexture = texture
                    leftMat.map = texture
                    leftMat.color.set(0xffffff)
                    leftMat.needsUpdate = true
                    setStatus(`WebP loaded: ${mime}, ${sizeKb} KB\n${texture.image.width} x ${texture.image.height}, colorSpace=${texture.colorSpace}`)
                },
                undefined,
                (err: unknown) => {
                    const msg = err instanceof Error ? err.message : String(err)
                    setStatus(`TextureLoader failed for WebP blob: ${msg}`)
                    statusEl.style.color = '#f88'
                },
            )
        }, 'image/webp', 0.9)
    }

    const animate = () => {
        const t = performance.now() * 0.0003
        leftMesh.rotation.y = Math.sin(t) * 0.25
        rightMesh.rotation.y = Math.sin(t + 0.5) * 0.25
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
        quadGeo.dispose(); frameGeo.dispose()
        leftMat.dispose(); rightMat.dispose(); frameMat.dispose()
        directTex.dispose()
        if (loadedTexture) loadedTexture.dispose()
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
        if (container.contains(leftLabel)) container.removeChild(leftLabel)
        if (container.contains(rightLabel)) container.removeChild(rightLabel)
    }
}

export const WebGLLoaderTextureWebP = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderTextureWebP
