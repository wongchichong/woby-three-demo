/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_ifc

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { IfcAPI } from 'web-ifc'

const WEB_IFC_VERSION = '0.0.77'
const WEB_IFC_WASM_PATH = `https://cdn.jsdelivr.net/npm/web-ifc@${WEB_IFC_VERSION}/`

let _cleanupFn: (() => void) | undefined

const init3D = async (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x8cc7de)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(82.48, 22.09, -45.24)

    const directionalLight1 = new THREE.DirectionalLight(0xffeeff, 2.5)
    directionalLight1.position.set(1, 1, 1)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2.5)
    directionalLight2.position.set(-1, 0.5, -1)
    scene.add(directionalLight2)

    const ambientLight = new THREE.AmbientLight(0xffffee, 0.75)
    scene.add(ambientLight)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(30.86, 7.73, 0.15)
    controls.update()
    controls.addEventListener('change', render)

    function render() {
        renderer.render(scene, camera)
    }

    function onResize() {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
        render()
    }
    window.addEventListener('resize', onResize)

    const _tmpColor = new THREE.Color()

    function ifcGeometryToBuffer(color: any, vertexData: Float32Array, indexData: Uint32Array) {
        const vertexCount = vertexData.length / 6
        const positions = new Float32Array(vertexCount * 3)
        const normals = new Float32Array(vertexCount * 3)
        const colors = new Float32Array(vertexCount * 4)

        ; (_tmpColor as any).setRGB(color.x, color.y, color.z, (THREE as any).SRGBColorSpace)

        for (let v = 0; v < vertexCount; v++) {
            const src = v * 6
            const dst3 = v * 3
            const dst4 = v * 4

            positions[dst3 + 0] = vertexData[src + 0]
            positions[dst3 + 1] = vertexData[src + 1]
            positions[dst3 + 2] = vertexData[src + 2]

            normals[dst3 + 0] = vertexData[src + 3]
            normals[dst3 + 1] = vertexData[src + 4]
            normals[dst3 + 2] = vertexData[src + 5]

            colors[dst4 + 0] = _tmpColor.r
            colors[dst4 + 1] = _tmpColor.g
            colors[dst4 + 2] = _tmpColor.b
            colors[dst4 + 3] = color.w
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
        geometry.setIndex(new THREE.BufferAttribute(indexData, 1))
        return geometry
    }

    function getMeshMaterial(color: any, materialCache: any) {
        const id = `${color.x}-${color.y}-${color.z}-${color.w}`
        const cached = materialCache[id]
        if (cached) return cached

        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color.x, color.y, color.z),
            side: THREE.DoubleSide,
        })

        if (color.w !== 1) {
            material.transparent = true
            material.opacity = color.w
        }

        materialCache[id] = material
        return material
    }

    function getBufferGeometry(ifcAPI: any, modelID: number, placedGeometry: any) {
        const geometry = ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID)
        const vertexData = ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize())
        const indexData = ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize())

        const bufferGeometry = ifcGeometryToBuffer(placedGeometry.color, vertexData, indexData)
        geometry.delete()
        return bufferGeometry
    }

    function getPlacedGeometry(ifcAPI: any, modelID: number, placedGeometry: any, materialCache: any) {
        const geometry = getBufferGeometry(ifcAPI, modelID, placedGeometry)
        const material = getMeshMaterial(placedGeometry.color, materialCache)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.matrix = new THREE.Matrix4().fromArray(placedGeometry.flatTransformation)
        mesh.matrixAutoUpdate = false
        return mesh
    }

    function loadAllGeometry(ifcAPI: any, modelID: number) {
        const opaqueGeometries: THREE.BufferGeometry[] = []
        const transparentGeometries: THREE.BufferGeometry[] = []
        const materialCache: any = {}

        ifcAPI.StreamAllMeshes(modelID, (flatMesh: any) => {
            const placedGeometries = flatMesh.geometries
            for (let i = 0; i < placedGeometries.size(); i++) {
                const placedGeometry = placedGeometries.get(i)
                const mesh = getPlacedGeometry(ifcAPI, modelID, placedGeometry, materialCache)
                const geometry = mesh.geometry.applyMatrix4(mesh.matrix)

                if (placedGeometry.color.w !== 1) {
                    transparentGeometries.push(geometry)
                } else {
                    opaqueGeometries.push(geometry)
                }
            }
        })

        if (opaqueGeometries.length > 0) {
            const merged = BufferGeometryUtils.mergeGeometries(opaqueGeometries)
            const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, vertexColors: true })
            scene.add(new THREE.Mesh(merged, material))
        }

        if (transparentGeometries.length > 0) {
            const merged = BufferGeometryUtils.mergeGeometries(transparentGeometries)
            const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, vertexColors: true, transparent: true })
            scene.add(new THREE.Mesh(merged, material))
        }
    }

    try {
        const ifcAPI = new IfcAPI()
        ifcAPI.SetWasmPath(WEB_IFC_WASM_PATH)
        await ifcAPI.Init()

        const response = await fetch('https://threejs.org/examples/models/ifc/rac_advanced_sample_project.ifc')
        const data = new Uint8Array(await response.arrayBuffer())

        const modelID = ifcAPI.OpenModel(data, { COORDINATE_TO_ORIGIN: true } as any)
        loadAllGeometry(ifcAPI, modelID)
        ifcAPI.CloseModel(modelID)

        render()
    } catch (e) {
        console.error('IFC load error:', e)
    }

    _cleanupFn = () => {
        window.removeEventListener('resize', onResize)
        controls.removeEventListener('change', render)
        controls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLLoaderIFC() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
