/** @jsxImportSource woby */
import * as THREE from 'three'
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x202225)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 1.5
    controls.maxDistance = 12

    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dirLight.position.set(2, 3, 4)
    scene.add(dirLight)

    // Two quads side-by-side: left = TGA, right = placeholder JPG comparison
    const quadGeo = new THREE.PlaneGeometry(1.6, 1.6)
    const placeholderMat = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true })
    const leftMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const rightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })

    const leftMesh = new THREE.Mesh(quadGeo, leftMat)
    leftMesh.position.x = -1.05
    scene.add(leftMesh)

    const rightMesh = new THREE.Mesh(quadGeo, rightMat)
    rightMesh.position.x = 1.05
    scene.add(rightMesh)

    // Frame outlines
    const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.62, 1.62))
    const frameMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa })
    const leftFrame = new THREE.LineSegments(frameGeo, frameMat)
    leftFrame.position.x = -1.05
    scene.add(leftFrame)
    const rightFrame = new THREE.LineSegments(frameGeo, frameMat)
    rightFrame.position.x = 1.05
    scene.add(rightFrame)

    // Loaders
    const tgaLoader = new TGALoader()
    const standardLoader = new THREE.TextureLoader()

    // Load TGA texture (left) — try color8 first, fall back to grey8
    const applyTexture = (mat: THREE.MeshBasicMaterial, mesh: THREE.Mesh, tex: THREE.Texture) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        mat.map = tex
        mat.color.set(0xffffff)
        mat.needsUpdate = true
    }
    tgaLoader.load(
        'https://threejs.org/examples/textures/crate_color8.tga',
        (texture) => applyTexture(leftMat, leftMesh, texture),
        undefined,
        () => {
            tgaLoader.load(
                'https://threejs.org/examples/textures/crate_grey8.tga',
                (texture) => applyTexture(leftMat, leftMesh, texture),
                undefined,
                (err: unknown) => {
                    console.warn('[WebGLLoaderTextureTGA] TGA failed:', err)
                    leftMesh.material = placeholderMat
                },
            )
        },
    )

    // Load JPG counterpart (right) for visual comparison
    standardLoader.load(
        'https://threejs.org/examples/textures/crate.gif',
        (texture) => applyTexture(rightMat, rightMesh, texture),
        undefined,
        () => {
            // Fall back to local fixture if the CDN GIF 404s
            standardLoader.load(
                'textures/rock.jpeg',
                (t) => applyTexture(rightMat, rightMesh, t),
                undefined,
                () => { rightMesh.material = placeholderMat },
            )
        },
    )

    // DOM labels
    const labelStyle = 'position:absolute;color:white;font-family:monospace;font-size:13px;background:rgba(0,0,0,0.55);padding:4px 8px;border-radius:4px;z-index:50;pointer-events:none'
    const leftLabel = document.createElement('div')
    leftLabel.style.cssText = labelStyle + ';top:20px;left:20px'
    leftLabel.textContent = 'TGA Loader (left)'
    container.appendChild(leftLabel)
    const rightLabel = document.createElement('div')
    rightLabel.style.cssText = labelStyle + ';top:20px;right:20px'
    rightLabel.textContent = 'Standard TextureLoader (right)'
    container.appendChild(rightLabel)
    container.style.position = 'relative'

    const animate = () => {
        leftMesh.rotation.y = Math.sin(performance.now() * 0.0003) * 0.25
        rightMesh.rotation.y = Math.sin(performance.now() * 0.0003 + 0.5) * 0.25
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
        leftMat.dispose(); rightMat.dispose(); placeholderMat.dispose(); frameMat.dispose()
        if (leftMat.map) leftMat.map.dispose()
        if (rightMat.map) rightMat.map.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        if (container.contains(leftLabel)) container.removeChild(leftLabel)
        if (container.contains(rightLabel)) container.removeChild(rightLabel)
    }
}

export const WebGLLoaderTextureTGA = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLLoaderTextureTGA
