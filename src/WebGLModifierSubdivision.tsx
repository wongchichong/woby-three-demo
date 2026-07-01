/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_modifier_subdivision

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

const ASSET_BASE = 'https://threejs.org/examples/'

function loopSubdivision(geometry: THREE.BufferGeometry, iterations: number): THREE.BufferGeometry {
	let geo = geometry.clone()
	for (let i = 0; i < iterations; i++) geo = _subdivideOnce(geo)
	return geo
}

function _subdivideOnce(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
	const posAttr = geometry.attributes.position
	const uvAttr = geometry.attributes.uv
	const indexAttr = geometry.index

	const newPositions: number[] = []
	const newUVs: number[] = []
	const newIndices: number[] = []
	const edgeMap = new Map<string, number>()

	const getEdgeKey = (a: number, b: number) => Math.min(a, b) + '_' + Math.max(a, b)

	const getMidpoint = (i0: number, i1: number): number => {
		const key = getEdgeKey(i0, i1)
		if (edgeMap.has(key)) return edgeMap.get(key)!
		const idx = newPositions.length / 3
		newPositions.push(
			(posAttr.getX(i0) + posAttr.getX(i1)) * 0.5,
			(posAttr.getY(i0) + posAttr.getY(i1)) * 0.5,
			(posAttr.getZ(i0) + posAttr.getZ(i1)) * 0.5
		)
		if (uvAttr) {
			newUVs.push(
				(uvAttr.getX(i0) + uvAttr.getX(i1)) * 0.5,
				(uvAttr.getY(i0) + uvAttr.getY(i1)) * 0.5
			)
		}
		edgeMap.set(key, idx)
		return idx
	}

	const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3

	for (let t = 0; t < triCount; t++) {
		const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3
		const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1
		const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2

		const v0 = newPositions.length / 3
		newPositions.push(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0))
		const v1 = newPositions.length / 3
		newPositions.push(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1))
		const v2 = newPositions.length / 3
		newPositions.push(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2))
		if (uvAttr) {
			newUVs.push(uvAttr.getX(i0), uvAttr.getY(i0))
			newUVs.push(uvAttr.getX(i1), uvAttr.getY(i1))
			newUVs.push(uvAttr.getX(i2), uvAttr.getY(i2))
		}

		const m01 = getMidpoint(i0, i1)
		const m12 = getMidpoint(i1, i2)
		const m20 = getMidpoint(i2, i0)

		newIndices.push(v0, m01, m20, v1, m12, m01, v2, m20, m12, m01, m12, m20)
	}

	const result = new THREE.BufferGeometry()
	result.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3))
	if (newUVs.length > 0) result.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(newUVs), 2))
	result.setIndex(newIndices)
	result.computeVertexNormals()
	return result
}

function getGeometry(name: string): THREE.BufferGeometry {
	switch (name.toLowerCase()) {
		case 'box': return new THREE.BoxGeometry()
		case 'capsule': return new THREE.CapsuleGeometry(0.5, 0.5, 3, 5)
		case 'circle': return new THREE.CircleGeometry(0.6, 10)
		case 'cone': return new THREE.ConeGeometry(0.6, 1.5, 5, 3)
		case 'cylinder': return new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 4)
		case 'dodecahedron': return new THREE.DodecahedronGeometry(0.6)
		case 'icosahedron': return new THREE.IcosahedronGeometry(0.6)
		case 'lathe': {
			const points = []
			for (let i = 0; i < 65; i += 5) {
				const x = (Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 + 50) * 1.2
				const y = (i - 5) * 3
				points.push(new THREE.Vector2(x * 0.0075, y * 0.005))
			}
			const g = new THREE.LatheGeometry(points, 4)
			g.center()
			return g
		}
		case 'octahedron': return new THREE.OctahedronGeometry(0.7)
		case 'plane': return new THREE.PlaneGeometry()
		case 'ring': return new THREE.RingGeometry(0.3, 0.6, 10)
		case 'sphere': return new THREE.SphereGeometry(0.6, 8, 4)
		case 'tetrahedron': return new THREE.TetrahedronGeometry(0.8)
		case 'torus': return new THREE.TorusGeometry(0.48, 0.24, 4, 6)
		case 'torusknot': return new THREE.TorusKnotGeometry(0.38, 0.18, 20, 4)
		default: return new THREE.BoxGeometry()
	}
}

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

	const params = {
		geometry: 'Box',
		iterations: 3,
		flatShading: false,
		textured: true,
		wireframe: false,
	}

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	container.appendChild(renderer.domElement)

	const scene = new THREE.Scene()

	const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight)
	camera.position.set(0, 0.7, 2.1)

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.addEventListener('change', render)
	controls.rotateSpeed = 0.5
	controls.minZoom = 1
	controls.target.set(0, 0, 0)
	controls.update()

	scene.add(new THREE.HemisphereLight(0xffffff, 0x737373, 3))
	const frontLight = new THREE.DirectionalLight(0xffffff, 1.5)
	const backLight = new THREE.DirectionalLight(0xffffff, 1.5)
	frontLight.position.set(0, 1, 1)
	backLight.position.set(0, 1, -1)
	scene.add(frontLight, backLight)

	const texture = new THREE.TextureLoader().load(ASSET_BASE + 'textures/uv_grid_opengl.jpg', () => {
		texture.wrapS = THREE.RepeatWrapping
		texture.wrapT = THREE.RepeatWrapping
		texture.colorSpace = THREE.SRGBColorSpace
		render()
	})

	const meshNormal = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())
	const meshSmooth = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())
	meshNormal.position.set(-0.7, 0, 0)
	meshSmooth.position.set(0.7, 0, 0)
	scene.add(meshNormal, meshSmooth)

	const wireMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: true, wireframe: true })
	const wireNormal = new THREE.Mesh(new THREE.BufferGeometry(), wireMaterial)
	const wireSmooth = new THREE.Mesh(new THREE.BufferGeometry(), wireMaterial)
	wireNormal.visible = false
	wireSmooth.visible = false
	wireNormal.position.copy(meshNormal.position)
	wireSmooth.position.copy(meshSmooth.position)
	scene.add(wireNormal, wireSmooth)

	function disposeMaterial(mat: THREE.Material | THREE.Material[]) {
		const arr = Array.isArray(mat) ? mat : [mat]
		arr.forEach(m => m.dispose())
	}

	function updateMaterial() {
		disposeMaterial(meshNormal.material as THREE.Material)
		disposeMaterial(meshSmooth.material as THREE.Material)

		const geom = params.geometry.toLowerCase()
		const needsDoubleSide = ['circle', 'lathe', 'plane', 'ring'].includes(geom)

		const mat = new THREE.MeshStandardMaterial({
			color: params.textured ? 0xffffff : 0x808080,
			flatShading: params.flatShading,
			map: params.textured ? texture : null,
			polygonOffset: true,
			polygonOffsetFactor: 1,
			polygonOffsetUnits: 1,
			side: needsDoubleSide ? THREE.DoubleSide : THREE.FrontSide,
		})
		meshNormal.material = meshSmooth.material = mat
		render()
	}

	function updateMeshes() {
		const normalGeometry = getGeometry(params.geometry)
		const smoothGeometry = loopSubdivision(normalGeometry, params.iterations)

		meshNormal.geometry.dispose()
		meshSmooth.geometry.dispose()
		meshNormal.geometry = normalGeometry
		meshSmooth.geometry = smoothGeometry

		wireNormal.geometry.dispose()
		wireSmooth.geometry.dispose()
		wireNormal.geometry = normalGeometry.clone()
		wireSmooth.geometry = smoothGeometry.clone()

		updateMaterial()
	}

	function render() {
		renderer.render(scene, camera)
	}

	updateMeshes()

	const onWindowResize = () => {
		renderer.setSize(container.clientWidth, container.clientHeight)
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		render()
	}
	window.addEventListener('resize', onWindowResize)

	const geomTypes = ['Box', 'Capsule', 'Circle', 'Cone', 'Cylinder', 'Dodecahedron', 'Icosahedron', 'Lathe', 'Octahedron', 'Plane', 'Ring', 'Sphere', 'Tetrahedron', 'Torus', 'TorusKnot']
	const gui = new GUI()

	const folder1 = gui.addFolder('Subdivide Params')
	folder1.add(params, 'geometry', geomTypes).onFinishChange(updateMeshes)
	folder1.add(params, 'iterations').min(0).max(5).step(1).onFinishChange(updateMeshes)

	const folder2 = gui.addFolder('Material')
	folder2.add(params, 'flatShading').onFinishChange(updateMaterial)
	folder2.add(params, 'textured').onFinishChange(updateMaterial)
	folder2.add(params, 'wireframe').onFinishChange(() => {
		wireNormal.visible = wireSmooth.visible = params.wireframe
		render()
	})

	render()

	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize)
		controls.dispose()
		texture.dispose()
		meshNormal.geometry.dispose()
		meshSmooth.geometry.dispose()
		wireNormal.geometry.dispose()
		wireSmooth.geometry.dispose()
		disposeMaterial(meshNormal.material as THREE.Material)
		wireMaterial.dispose()
		gui.destroy()
		renderer.dispose()
		if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
	}
}

export default function WebGLModifierSubdivision() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
