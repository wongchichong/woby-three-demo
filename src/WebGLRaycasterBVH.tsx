/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_raycaster_bvh

import * as THREE from 'three'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, BVHHelper } from 'three-mesh-bvh'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

let _cleanupFn: (() => void) | null = null

const MAX_RAYS = 3000
const RAY_COLOR = 0x444444

const params = {
	count: 150,
	firstHitOnly: true,
	useBVH: true,
	displayHelper: false,
	helperDepth: 10,
}

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	// environment
	const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 100)
	camera.position.z = 10

	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0xeeeeee)

	const ambient = new THREE.HemisphereLight(0xffffff, 0x999999, 3)
	scene.add(ambient)

	// renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	renderer.setAnimationLoop(animate)
	container.appendChild(renderer.domElement)

	const stats = new Stats()
	container.appendChild(stats.dom)

	// raycast visualizations
	const lineGeometry = new THREE.BufferGeometry()
	lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_RAYS * 2 * 3), 3))
	const lineSegments = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
		color: RAY_COLOR,
		transparent: true,
		opacity: 0.25,
		depthWrite: false
	}))

	const sphereInstance = new THREE.InstancedMesh(
		new THREE.SphereGeometry(),
		new THREE.MeshBasicMaterial({ color: RAY_COLOR }),
		2 * MAX_RAYS
	)
	sphereInstance.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
	sphereInstance.count = 0

	scene.add(sphereInstance, lineSegments)

	// reusable variables
	const _raycaster = new THREE.Raycaster()
	const _position = new THREE.Vector3()
	const _quaternion = new THREE.Quaternion()
	const _scale = new THREE.Vector3(1, 1, 1)
	const _matrix = new THREE.Matrix4()
	const _axis = new THREE.Vector3()

	// load the bunny
	let mesh: THREE.Mesh | null = null
	let helper: BVHHelper | null = null
	let bvh: ReturnType<typeof computeBoundsTree> | null = null

	const loader = new FBXLoader()
	loader.load('https://threejs.org/examples/models/fbx/stanford-bunny.fbx', (object) => {
		mesh = object.children[0] as THREE.Mesh
		const geometry = mesh.geometry as THREE.BufferGeometry

		geometry.translate(0, 0.5 / 0.0075, 0)
		geometry.computeBoundsTree()
		bvh = geometry.boundsTree

		if (!params.useBVH) {
			geometry.boundsTree = null
		}

		scene.add(mesh)
		mesh.scale.setScalar(0.0075)

		helper = new BVHHelper(mesh)
		helper.color.set(0xE91E63)
		scene.add(helper)
	})

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.minDistance = 5
	controls.maxDistance = 75

	// set up gui
	const gui = new GUI()
	const rayFolder = gui.addFolder('Raycasting')
	rayFolder.add(params, 'count', 1, MAX_RAYS, 1)
	rayFolder.add(params, 'firstHitOnly')
	rayFolder.add(params, 'useBVH').onChange((v: boolean) => {
		if (mesh && bvh) {
			(mesh.geometry as THREE.BufferGeometry).boundsTree = v ? bvh : null
		}
	})

	const helperFolder = gui.addFolder('BVH Helper')
	helperFolder.add(params, 'displayHelper')
	helperFolder.add(params, 'helperDepth', 1, 20, 1).onChange((v: number) => {
		if (helper) {
			helper.depth = v
			helper.update()
		}
	})

	// init rays
	const initRays = () => {
		const position = new THREE.Vector3()
		const quaternion = new THREE.Quaternion()
		const scale = new THREE.Vector3(1, 1, 1)
		const matrix = new THREE.Matrix4()

		for (let i = 0; i < MAX_RAYS * 2; i++) {
			position.randomDirection().multiplyScalar(3.75)
			matrix.compose(position, quaternion, scale)
			sphereInstance.setMatrixAt(i, matrix)
		}
	}
	initRays()

	// update rays
	const updateRays = () => {
		if (!mesh) return

		_raycaster.firstHitOnly = params.firstHitOnly
		const rayCount = params.count

		let lineNum = 0
		for (let i = 0; i < rayCount; i++) {
			// get the current ray origin
			sphereInstance.getMatrixAt(i * 2, _matrix)
			_matrix.decompose(_position, _quaternion, _scale)

			// rotate it about the origin
			const offset = 1e-4 * window.performance.now()
			_axis.set(
				Math.sin(i * 100 + offset),
				Math.cos(-i * 10 + offset),
				Math.sin(i * 1 + offset),
			).normalize()
			_position.applyAxisAngle(_axis, 0.001)

			// update the position
			_scale.setScalar(0.02)
			_matrix.compose(_position, _quaternion, _scale)
			sphereInstance.setMatrixAt(i * 2, _matrix)

			// raycast
			_raycaster.ray.origin.copy(_position)
			_raycaster.ray.direction.copy(_position).multiplyScalar(-1).normalize()

			// update hits points and lines
			const hits = _raycaster.intersectObject(mesh)
			if (hits.length !== 0) {
				const hit = hits[0]
				const point = hit.point
				_scale.setScalar(0.01)
				_matrix.compose(point, _quaternion, _scale)
				sphereInstance.setMatrixAt(i * 2 + 1, _matrix)

				lineSegments.geometry.attributes.position.setXYZ(lineNum++, _position.x, _position.y, _position.z)
				lineSegments.geometry.attributes.position.setXYZ(lineNum++, point.x, point.y, point.z)
			} else {
				sphereInstance.setMatrixAt(i * 2 + 1, _matrix)
				lineSegments.geometry.attributes.position.setXYZ(lineNum++, _position.x, _position.y, _position.z)
				lineSegments.geometry.attributes.position.setXYZ(lineNum++, 0, 0, 0)
			}
		}

		sphereInstance.count = rayCount * 2
		sphereInstance.instanceMatrix.needsUpdate = true

		lineSegments.geometry.setDrawRange(0, lineNum)
		lineSegments.geometry.attributes.position.needsUpdate = true
	}

	// resize listener
	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}
	window.addEventListener('resize', onWindowResize)

	// render
	const render = () => {
		if (helper) {
			helper.visible = params.displayHelper
		}

		if (mesh) {
			mesh.rotation.y += 0.002
			mesh.updateMatrixWorld()
		}

		updateRays()

		renderer.render(scene, camera)
	}

	// animation loop
	function animate() {
		render()
		stats.update()
	}

	// Cleanup function
	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', onWindowResize)

		gui.destroy()

		if (mesh && mesh.geometry) {
			const geometry = mesh.geometry as THREE.BufferGeometry
			if (geometry.boundsTree) {
				geometry.disposeBoundsTree()
			}
			geometry.dispose()
		}
		if (mesh) {
			(mesh.material as THREE.Material).dispose()
		}

		if (helper) {
			scene.remove(helper)
		}

		lineGeometry.dispose()
		;(lineSegments.material as THREE.Material).dispose()
		sphereInstance.geometry.dispose()
		;(sphereInstance.material as THREE.Material).dispose()

		controls.dispose()
		renderer.dispose()

		if (renderer.domElement.parentElement === container) {
			container.removeChild(renderer.domElement)
		}
		if (stats.dom.parentElement === container) {
			container.removeChild(stats.dom)
		}
	}
}

export default function WebGLRaycasterBVH() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
