/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const W = container.clientWidth || window.innerWidth
    const H = container.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const camera = new THREE.PerspectiveCamera(70, W / H, 1, 10000)
    camera.position.set(0, 250, 1000)

    scene.add(new THREE.AmbientLight(0xf0f0f0, 3))

    const spotLight = new THREE.SpotLight(0xffffff, 4.5)
    spotLight.position.set(0, 1500, 200)
    spotLight.angle = Math.PI * 0.2
    spotLight.decay = 0
    spotLight.castShadow = true
    spotLight.shadow.camera.near = 200
    spotLight.shadow.camera.far = 2000
    spotLight.shadow.bias = -0.000222
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    scene.add(spotLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.2 })
    )
    ground.position.y = -200
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const gridHelper = new THREE.GridHelper(2000, 100)
    gridHelper.position.y = -199
    if (Array.isArray(gridHelper.material)) {
        gridHelper.material.forEach(m => { m.opacity = 0.25; m.transparent = true })
    } else {
        gridHelper.material.opacity = 0.25
        gridHelper.material.transparent = true
    }
    scene.add(gridHelper)

    const orbitControls = new OrbitControls(camera, renderer.domElement)
    ;(orbitControls as any).damping = 0.2

    const transformControl = new TransformControls(camera, renderer.domElement)
    transformControl.addEventListener('dragging-changed', (event: any) => {
        orbitControls.enabled = !event.value
    })
    scene.add(transformControl.getHelper())
    transformControl.addEventListener('objectChange', () => {
        updateSplineOutline()
        render()
    })

    const ARC_SEGMENTS = 200
    const splineBoxGeometry = new THREE.BoxGeometry(20, 20, 20)
    const splineHelperObjects: THREE.Mesh[] = []
    let splinePointsLength = 4
    const positions: THREE.Vector3[] = []
    const point = new THREE.Vector3()
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onUpPosition = new THREE.Vector2()
    const onDownPosition = new THREE.Vector2()
    const splines: Record<string, any> = {}

    const params = {
        uniform: true,
        tension: 0.5,
        centripetal: true,
        chordal: true,
        addPoint: () => addPoint(),
        removePoint: () => removePoint(),
        exportSpline: () => exportSpline()
    }

    function addSplineObject(position?: THREE.Vector3) {
        const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
        const object = new THREE.Mesh(splineBoxGeometry, material)
        if (position) {
            object.position.copy(position)
        } else {
            object.position.x = Math.random() * 1000 - 500
            object.position.y = Math.random() * 600
            object.position.z = Math.random() * 800 - 400
        }
        object.castShadow = true
        object.receiveShadow = true
        scene.add(object)
        splineHelperObjects.push(object)
        return object
    }

    function addPoint() {
        splinePointsLength++
        const obj = addSplineObject()
        positions.push(obj.position)
        updateSplineOutline()
        render()
    }

    function removePoint() {
        if (splinePointsLength <= 4) return
        const pt = splineHelperObjects.pop()!
        splinePointsLength--
        positions.pop()
        if (transformControl.object === pt) transformControl.detach()
        scene.remove(pt)
        updateSplineOutline()
        render()
    }

    function updateSplineOutline() {
        for (const k in splines) {
            const spline = splines[k]
            const splineMesh = spline.mesh
            const position = splineMesh.geometry.attributes.position
            for (let i = 0; i < ARC_SEGMENTS; i++) {
                const t = i / (ARC_SEGMENTS - 1)
                spline.getPoint(t, point)
                position.setXYZ(i, point.x, point.y, point.z)
            }
            position.needsUpdate = true
        }
    }

    function exportSpline() {
        const strplace: string[] = []
        for (let i = 0; i < splinePointsLength; i++) {
            const p = splineHelperObjects[i].position
            strplace.push(`new THREE.Vector3(${p.x}, ${p.y}, ${p.z})`)
        }
        console.log(strplace.join(',\n'))
    }

    function load(new_positions: THREE.Vector3[]) {
        while (new_positions.length > positions.length) addPoint()
        while (new_positions.length < positions.length) removePoint()
        for (let i = 0; i < positions.length; i++) {
            positions[i].copy(new_positions[i])
        }
        updateSplineOutline()
    }

    for (let i = 0; i < splinePointsLength; i++) {
        addSplineObject(positions[i])
    }
    positions.length = 0
    for (let i = 0; i < splinePointsLength; i++) {
        positions.push(splineHelperObjects[i].position)
    }

    const curveGeometry = new THREE.BufferGeometry()
    curveGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3))

    let curve: any = new THREE.CatmullRomCurve3(positions)
    curve.curveType = 'catmullrom'
    curve.mesh = new THREE.Line(curveGeometry.clone(), new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.35 }))
    curve.mesh.castShadow = true
    splines.uniform = curve
    scene.add(curve.mesh)

    curve = new THREE.CatmullRomCurve3(positions)
    curve.curveType = 'centripetal'
    curve.mesh = new THREE.Line(curveGeometry.clone(), new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.35 }))
    curve.mesh.castShadow = true
    splines.centripetal = curve
    scene.add(curve.mesh)

    curve = new THREE.CatmullRomCurve3(positions)
    curve.curveType = 'chordal'
    curve.mesh = new THREE.Line(curveGeometry.clone(), new THREE.LineBasicMaterial({ color: 0x0000ff, opacity: 0.35 }))
    curve.mesh.castShadow = true
    splines.chordal = curve
    scene.add(curve.mesh)

    load([
        new THREE.Vector3(289.76843686945404, 452.51481137238443, 56.10018915737797),
        new THREE.Vector3(-53.56300074753207, 171.49711742836848, -14.495472686253045),
        new THREE.Vector3(-91.40118730204415, 176.4306956436485, -6.958271935582161),
        new THREE.Vector3(-383.785318791128, 491.1365363371675, 47.869296953772746)
    ])

    const gui = new GUI()
    gui.add(params, 'uniform').onChange(() => render())
    gui.add(params, 'tension', 0, 1).step(0.01).onChange((value: number) => {
        splines.uniform.tension = value
        updateSplineOutline()
        render()
    })
    gui.add(params, 'centripetal').onChange(() => render())
    gui.add(params, 'chordal').onChange(() => render())
    gui.add(params, 'addPoint')
    gui.add(params, 'removePoint')
    gui.add(params, 'exportSpline')
    gui.open()

    function render() {
        splines.uniform.mesh.visible = params.uniform
        splines.centripetal.mesh.visible = params.centripetal
        splines.chordal.mesh.visible = params.chordal
        renderer.render(scene, camera)
    }

    const onPointerDown = (event: PointerEvent) => {
        onDownPosition.x = event.clientX
        onDownPosition.y = event.clientY
    }
    const onPointerUp = (event: PointerEvent) => {
        onUpPosition.x = event.clientX
        onUpPosition.y = event.clientY
        if (onDownPosition.distanceTo(onUpPosition) === 0) {
            transformControl.detach()
            render()
        }
    }
    const onPointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(splineHelperObjects, false)
        if (intersects.length > 0) {
            const object = intersects[0].object
            if (object !== transformControl.object) {
                transformControl.attach(object as THREE.Mesh)
            }
        }
    }
    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointermove', onPointerMove)

    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        orbitControls.update()
        render()
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
        container.removeEventListener('pointerdown', onPointerDown)
        container.removeEventListener('pointerup', onPointerUp)
        container.removeEventListener('pointermove', onPointerMove)
        gui.destroy()
        orbitControls.dispose()
        transformControl.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLGeometrySplineEditor = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)

export default WebGLGeometrySplineEditor
