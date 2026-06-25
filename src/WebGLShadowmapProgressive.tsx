/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ProgressiveLightMap } from 'three/addons/misc/ProgressiveLightMap.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x949494)
    scene.fog = new THREE.Fog(0x949494, 1000, 3000)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000)
    camera.position.set(0, 100, 200)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.toneMappingExposure = 2.6
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 25, 0)
    controls.update()

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.name = 'dirlight'
    dirLight.position.set(200, 200, 100)
    dirLight.castShadow = true
    dirLight.shadow.camera.near = 1
    dirLight.shadow.camera.far = 800
    dirLight.shadow.camera.left = -150
    dirLight.shadow.camera.right = 150
    dirLight.shadow.camera.top = 150
    dirLight.shadow.camera.bottom = -150
    dirLight.shadow.mapSize.set(1024, 1024)
    dirLight.shadow.bias = -0.001
    scene.add(dirLight)

    // Ground plane (receives light map)
    const groundMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 0 })
    const groundGeo = new THREE.PlaneGeometry(600, 600)
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Objects that cast/receive bounced light
    const objects: THREE.Mesh[] = []
    const geos: THREE.BufferGeometry[] = []
    const mats: THREE.Material[] = []

    const addObj = (geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number) => {
        const mat = new THREE.MeshPhongMaterial({ color, shininess: 30 })
        const m = new THREE.Mesh(geo, mat)
        m.position.set(x, y, z)
        m.castShadow = true
        m.receiveShadow = true
        scene.add(m)
        objects.push(m)
        geos.push(geo)
        mats.push(mat)
        return m
    }

    addObj(new THREE.BoxGeometry(30, 30, 30), 0xff5566, -60, 15, 0)
    addObj(new THREE.SphereGeometry(18, 32, 16), 0x66ccaa, 0, 18, 0)
    addObj(new THREE.TorusKnotGeometry(14, 5, 80, 16), 0xffcc33, 60, 22, 0)
    addObj(new THREE.ConeGeometry(15, 35, 32), 0x44aaff, -30, 17, -50)
    addObj(new THREE.DodecahedronGeometry(18), 0xaa66ff, 30, 18, -50)

    // Progressive light map
    const progressiveSurfacemap = new ProgressiveLightMap(renderer, 1024)
    const lightMapObjects: THREE.Mesh[] = [ground, ...objects]
    progressiveSurfacemap.addObjectsToLightMap(lightMapObjects)

    // Jittered light direction for accumulation
    const lightOrigin = new THREE.Vector3(200, 200, 100)
    const lightTarget = new THREE.Vector3()

    const params = {
        Enable: true,
        'Blur Edges': true,
        'Blend Window': 200,
        'Light Radius': 50,
        'Ambient Weight': 0.5,
        'Debug Lightmap': false,
    }

    let isWarmedUp = false
    progressiveSurfacemap.showDebugLightmap(params['Debug Lightmap'])

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        controls.update()

        if (params.Enable) {
            // Jitter the light each frame for soft area-light accumulation
            const r = params['Light Radius']
            dirLight.position.set(
                lightOrigin.x + (Math.random() - 0.5) * r,
                lightOrigin.y + (Math.random() - 0.5) * r,
                lightOrigin.z + (Math.random() - 0.5) * r,
            )
            dirLight.target.position.copy(lightTarget)
            dirLight.target.updateMatrixWorld()

            progressiveSurfacemap.update(camera, params['Blend Window'], params['Blur Edges'])

            if (!isWarmedUp) {
                // Run multiple accumulation passes the first frame to seed
                for (let i = 0; i < 10; i++) {
                    progressiveSurfacemap.update(camera, params['Blend Window'], params['Blur Edges'])
                }
                isWarmedUp = true
            }
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
        controls.dispose()
        groundGeo.dispose(); groundMat.dispose()
        geos.forEach(g => g.dispose())
        mats.forEach(m => m.dispose())
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLShadowmapProgressive = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
)
export default WebGLShadowmapProgressive
