/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const W = container.clientWidth || window.innerWidth
    const H = container.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.setClearColor(0x263238)
    renderer.shadowMap.enabled = true
    renderer.localClippingEnabled = true
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, W / H, 1, 100)
    camera.position.set(2, 2, 2)

    const orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.minDistance = 2
    orbitControls.maxDistance = 20

    scene.add(new THREE.AmbientLight(0xffffff, 1.5))
    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 10, 7.5)
    dirLight.castShadow = true
    dirLight.shadow.camera.right = 2; dirLight.shadow.camera.left = -2
    dirLight.shadow.camera.top = 2; dirLight.shadow.camera.bottom = -2
    dirLight.shadow.mapSize.width = 1024; dirLight.shadow.mapSize.height = 1024
    scene.add(dirLight)

    const planes = [
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
        new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
        new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    ]
    const planeHelpers = planes.map(p => new THREE.PlaneHelper(p, 2, 0xffffff))
    planeHelpers.forEach(ph => { ph.visible = false; scene.add(ph) })

    const geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 220, 60)
    const object = new THREE.Group()
    scene.add(object)

    const createPlaneStencilGroup = (g: THREE.BufferGeometry, plane: THREE.Plane, renderOrder: number) => {
        const group = new THREE.Group()
        const baseMat = new THREE.MeshBasicMaterial()
        baseMat.depthWrite = false; baseMat.depthTest = false; baseMat.colorWrite = false
        baseMat.stencilWrite = true; baseMat.stencilFunc = THREE.AlwaysStencilFunc
        const mat0 = baseMat.clone(); mat0.side = THREE.BackSide; mat0.clippingPlanes = [plane]
        mat0.stencilFail = THREE.IncrementWrapStencilOp; mat0.stencilZFail = THREE.IncrementWrapStencilOp; mat0.stencilZPass = THREE.IncrementWrapStencilOp
        const mesh0 = new THREE.Mesh(g, mat0); mesh0.renderOrder = renderOrder; group.add(mesh0)
        const mat1 = baseMat.clone(); mat1.side = THREE.FrontSide; mat1.clippingPlanes = [plane]
        mat1.stencilFail = THREE.DecrementWrapStencilOp; mat1.stencilZFail = THREE.DecrementWrapStencilOp; mat1.stencilZPass = THREE.DecrementWrapStencilOp
        const mesh1 = new THREE.Mesh(g, mat1); mesh1.renderOrder = renderOrder; group.add(mesh1)
        return group
    }

    const planeObjects: THREE.Mesh[] = []
    const planeGeom = new THREE.PlaneGeometry(4, 4)
    for (let i = 0; i < 3; i++) {
        const poGroup = new THREE.Group()
        const plane = planes[i]
        const stencilGroup = createPlaneStencilGroup(geometry, plane, i + 1)
        const planeMat = new THREE.MeshStandardMaterial({
            color: 0xE91E63, metalness: 0.1, roughness: 0.75,
            clippingPlanes: planes.filter(p => p !== plane),
            stencilWrite: true, stencilRef: 0,
            stencilFunc: THREE.NotEqualStencilFunc,
            stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp,
        })
        const po = new THREE.Mesh(planeGeom, planeMat)
        po.onAfterRender = (r) => { r.clearStencil() }
        po.renderOrder = i + 1.1
        object.add(stencilGroup); poGroup.add(po); planeObjects.push(po); scene.add(poGroup)
    }

    const material = new THREE.MeshStandardMaterial({
        color: 0xFFC107, metalness: 0.1, roughness: 0.75,
        clippingPlanes: planes, clipShadows: true, shadowSide: THREE.DoubleSide,
    })
    const clippedColorFront = new THREE.Mesh(geometry, material)
    clippedColorFront.castShadow = true; clippedColorFront.renderOrder = 6
    object.add(clippedColorFront)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 9, 1, 1),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25, side: THREE.DoubleSide }),
    )
    ground.rotation.x = -Math.PI / 2; ground.position.y = -1; ground.receiveShadow = true
    scene.add(ground)

    const params = {
        animate: true,
        planeX: { constant: 0, negated: false, displayHelper: false },
        planeY: { constant: 0, negated: false, displayHelper: false },
        planeZ: { constant: 0, negated: false, displayHelper: false },
    }

    const gui = new GUI()
    gui.add(params, 'animate')
    const pxF = gui.addFolder('planeX')
    pxF.add(params.planeX, 'displayHelper').onChange((v: boolean) => { planeHelpers[0].visible = v })
    pxF.add(params.planeX, 'constant').min(-1).max(1).onChange((d: number) => { planes[0].constant = d })
    pxF.add(params.planeX, 'negated').onChange(() => { planes[0].negate(); params.planeX.constant = planes[0].constant })
    pxF.open()
    const pyF = gui.addFolder('planeY')
    pyF.add(params.planeY, 'displayHelper').onChange((v: boolean) => { planeHelpers[1].visible = v })
    pyF.add(params.planeY, 'constant').min(-1).max(1).onChange((d: number) => { planes[1].constant = d })
    pyF.add(params.planeY, 'negated').onChange(() => { planes[1].negate(); params.planeY.constant = planes[1].constant })
    pyF.open()
    const pzF = gui.addFolder('planeZ')
    pzF.add(params.planeZ, 'displayHelper').onChange((v: boolean) => { planeHelpers[2].visible = v })
    pzF.add(params.planeZ, 'constant').min(-1).max(1).onChange((d: number) => { planes[2].constant = d })
    pzF.add(params.planeZ, 'negated').onChange(() => { planes[2].negate(); params.planeZ.constant = planes[2].constant })
    pzF.open()

    const clock = new THREE.Clock()
    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        const delta = clock.getDelta()
        if (params.animate) {
            object.rotation.x += delta * 0.5
            object.rotation.y += delta * 0.2
        }
        for (let i = 0; i < planeObjects.length; i++) {
            const plane = planes[i]; const po = planeObjects[i]
            plane.coplanarPoint(po.position)
            po.lookAt(po.position.x - plane.normal.x, po.position.y - plane.normal.y, po.position.z - plane.normal.z)
        }
        orbitControls.update()
        renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
        const nW = container.clientWidth || window.innerWidth
        const nH = container.clientHeight || window.innerHeight
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        try { gui.destroy() } catch {}
        orbitControls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLClippingStencil = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)

export default WebGLClippingStencil
