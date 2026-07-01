/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_modifier_simplifier

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

	const info = document.createElement('div')
	info.style.position = 'absolute'
	info.style.top = '10px'
	info.style.width = '100%'
	info.style.textAlign = 'center'
	info.style.color = 'white'
	info.style.pointerEvents = 'none'
	info.innerHTML = '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> - Vertex Reduction using SimplifyModifier'
	container.appendChild(info)

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	container.appendChild(renderer.domElement)

	const scene = new THREE.Scene()

	const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 1000)
	camera.position.z = 15

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.addEventListener('change', render)
	controls.enablePan = false
	controls.enableZoom = false

	scene.add(new THREE.AmbientLight(0xffffff, 0.6))

	const light = new THREE.PointLight(0xffffff, 400)
	camera.add(light)
	scene.add(camera)

	let originalMesh: THREE.Mesh | null = null
	let simplifiedMesh: THREE.Mesh | null = null

	new GLTFLoader().load(
		'https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb',
		function (gltf) {
			const mesh = gltf.scene.children[0] as THREE.Mesh
			mesh.position.x = -3
			mesh.rotation.y = Math.PI / 2
			scene.add(mesh)
			originalMesh = mesh

			const modifier = new SimplifyModifier()

			const simplified = mesh.clone() as THREE.Mesh
			simplified.material = (simplified.material as THREE.Material).clone()
			;(simplified.material as THREE.MeshStandardMaterial).flatShading = true
			const count = Math.floor(
				(simplified.geometry as THREE.BufferGeometry).attributes.position.count * 0.875
			)
			simplified.geometry = modifier.modify(
				simplified.geometry as THREE.BufferGeometry,
				count
			)

			simplified.position.x = 3
			simplified.rotation.y = -Math.PI / 2
			scene.add(simplified)
			simplifiedMesh = simplified

			render()
		}
	)

	const onWindowResize = () => {
		renderer.setSize(container.clientWidth, container.clientHeight)
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		render()
	}
	window.addEventListener('resize', onWindowResize)

	function render() {
		renderer.render(scene, camera)
	}

	render()

	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize)
		controls.dispose()
		if (originalMesh) {
			originalMesh.geometry.dispose()
			;(originalMesh.material as THREE.Material).dispose()
		}
		if (simplifiedMesh) {
			simplifiedMesh.geometry.dispose()
			;(simplifiedMesh.material as THREE.Material).dispose()
		}
		renderer.dispose()
		if (container.contains(info)) container.removeChild(info)
		if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
	}
}

export default function WebGLModifierSimplifier() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
