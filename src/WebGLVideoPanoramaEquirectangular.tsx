/** @jsxImportSource woby */
// 360° Equirectangular Video Panorama
// Source: https://threejs.org/examples/#webgl_video_panorama_equirectangular
// Plays an equirectangular 360° video on the inside of a sphere for immersive panorama viewing.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const w = container.clientWidth || 800
    const h = container.clientHeight || 600
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    camera.position.set(0, 0, 0.01)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.rotateSpeed = -0.5
    controls.update()

    container.style.position = 'relative'

    const statusEl = document.createElement('div')
    statusEl.style.cssText = 'position:absolute;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#9af;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;z-index:50;line-height:1.5;pointer-events:none;max-width:420px;white-space:pre-line'
    statusEl.textContent = 'Loading equirectangular 360° video (pano)…'
    container.appendChild(statusEl)

    // Hidden video element for the equirectangular video
    const video = document.createElement('video')
    video.loop = true
    video.muted = true
    video.crossOrigin = 'anonymous'
    video.playsInline = true
    video.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px'
    document.body.appendChild(video)

    // VideoTexture from equirectangular video
    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.colorSpace = THREE.SRGBColorSpace
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter

    // Create large sphere with inverted normals (render inside)
    const geometry = new THREE.SphereGeometry(500, 60, 40)
    geometry.scale(-1, 1, 1)

    const material = new THREE.MeshBasicMaterial({
        map: videoTexture
    })

    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Load and play the panorama video
    video.src = 'https://threejs.org/examples/textures/pano.webm'
    video.play().catch((err) => {
        console.warn('[WebGLVideoPanorama] video.play() failed:', err)
        statusEl.textContent = `Panorama video play failed: ${err instanceof Error ? err.message : String(err)}`
        statusEl.style.color = '#f88'
    })

    let videoReady = false
    video.addEventListener('canplay', () => {
        if (!videoReady) {
            videoReady = true
            statusEl.textContent = `360° Equirectangular Panorama\nVideo: ${video.videoWidth}×${video.videoHeight}\nDrag to pan (scroll/pinch disabled)`
        }
    }, { once: true })

    const animate = () => {
        controls.update()
        renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)

    const onResize = () => {
        const nw = container.clientWidth || 800
        const nh = container.clientHeight || 600
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        scene.remove(sphere)
        geometry.dispose()
        material.dispose()
        videoTexture.dispose()
        video.pause()
        video.srcObject = null
        if (document.body.contains(video)) document.body.removeChild(video)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(statusEl)) container.removeChild(statusEl)
    }
}

export default function WebGLVideoPanoramaEquirectangular() {
    return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
