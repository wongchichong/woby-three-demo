/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_pmrem_test

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { HDRLoader } from '@woby/three/examples/jsm/loaders/HDRLoader'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }
	const width = container.clientWidth
	const height = container.clientHeight
	const aspect = width / height

	// Renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(width, height)

	// Tonemapping
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.toneMappingExposure = 1

	container.appendChild(renderer.domElement)

	// Scene
	const scene = new THREE.Scene()

	// Camera
	const camera = new THREE.PerspectiveCamera(40, aspect, 1, 30)

	const updateCamera = () => {
		const horizontalFoV = 40
		const verticalFoV = 2 * Math.atan(Math.tan(horizontalFoV / 2 * Math.PI / 180) / camera.aspect) * 180 / Math.PI
		camera.fov = verticalFoV
		camera.updateProjectionMatrix()
	}

	updateCamera()
	camera.position.set(0, 0, 16)

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.minDistance = 4
	controls.maxDistance = 20

	// Light
	const directionalLight = new THREE.DirectionalLight(0xffffff, 0) // set intensity to 0 to start
	const x = 597
	const y = 213
	const theta = (x + 0.5) * Math.PI / 512
	const phi = (y + 0.5) * Math.PI / 512

	directionalLight.position.setFromSphericalCoords(100, -phi, Math.PI / 2 - theta)

	scene.add(directionalLight)

	// The spot1Lux HDR environment map is expressed in nits (lux / sr). The directional light has units of lux,
	// so to match a 1 lux light, we set a single pixel with a value equal to 1 divided by the solid
	// angle of the pixel in steradians. This image is 1024 x 512,
	// so the value is 1 / ( sin( phi ) * ( pi / 512 ) ^ 2 ) = 27,490 nits.

	// GUI
	const gui = new GUI({ container: document.body })
	gui.add({ enabled: true }, 'enabled')
		.name('PMREM')
		.onChange((value: boolean) => {
			directionalLight.intensity = value ? 0 : 1

			scene.traverse((child) => {
				if ((child as THREE.Mesh).isMesh) {
					const mesh = child as THREE.Mesh
					;(mesh.material as THREE.MeshPhysicalMaterial).envMapIntensity = 1 - directionalLight.intensity
				}
			})

			render()
		})

	// Render function
	const render = () => {
		renderer.render(scene, camera)
	}

	// Controls change listener
	controls.addEventListener('change', render)

	// PMREM Generator
	const pmremGenerator = new THREE.PMREMGenerator(renderer)
	pmremGenerator.compileEquirectangularShader()

	// Load HDR and create objects
	let radianceMap: THREE.DataTexture | null = null
	const geometry = new THREE.SphereGeometry(0.4, 32, 32)
	const meshes: THREE.Mesh[] = []

	new HDRLoader()
		.setPath('https://threejs.org/examples/textures/equirectangular/')
		.load('spot1Lux.hdr', (texture) => {
			radianceMap = pmremGenerator.fromEquirectangular(texture).texture
			pmremGenerator.dispose()

			scene.background = radianceMap

			for (let x = 0; x <= 10; x++) {
				for (let y = 0; y <= 2; y++) {
					const material = new THREE.MeshPhysicalMaterial({
						roughness: x / 10,
						metalness: y < 1 ? 1 : 0,
						color: y < 2 ? 0xffffff : 0x000000,
						envMap: radianceMap,
						envMapIntensity: 1,
					})

					const mesh = new THREE.Mesh(geometry, material)
					mesh.position.x = x - 5
					mesh.position.y = 1 - y
					scene.add(mesh)
					meshes.push(mesh)
				}
			}

			render()
		})

	// Handle window resize
	const handleResize = () => {
		const w = container.clientWidth
		const h = container.clientHeight

		camera.aspect = w / h
		updateCamera()

		renderer.setSize(w, h)

		render()
	}
	window.addEventListener('resize', handleResize)

	// Initial render
	render()

	// Cleanup function
	_cleanupFn = () => {
		controls.removeEventListener('change', render)
		window.removeEventListener('resize', handleResize)
		if (radianceMap) radianceMap.dispose()
		meshes.forEach((mesh) => {
			if (mesh.geometry && mesh.geometry !== geometry) mesh.geometry.dispose()
			if (Array.isArray(mesh.material)) {
				mesh.material.forEach((m) => m.dispose())
			} else {
				mesh.material.dispose()
			}
		})
		geometry.dispose()
		scene.traverse((obj) => {
			const meshObj = obj as THREE.Mesh
			if (meshObj.geometry && meshObj.geometry !== geometry) meshObj.geometry.dispose()
			if (meshObj.material && !meshes.some((m) => m.material === meshObj.material)) {
				if (Array.isArray(meshObj.material)) {
					meshObj.material.forEach((m) => m.dispose())
				} else {
					meshObj.material.dispose()
				}
			}
		})
		controls.dispose()
		gui.destroy()
		renderer.dispose()
		container.removeChild(renderer.domElement)
	}
}

export default function WebGLPMREMTest() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
