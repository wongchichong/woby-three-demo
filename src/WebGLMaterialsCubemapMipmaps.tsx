/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_materials_cubemap_mipmaps

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const ASSET_BASE = 'https://threejs.org/examples/'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

	const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 10000)
	camera.position.z = 500

	const scene = new THREE.Scene()

	// renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	renderer.setAnimationLoop(animate)
	container.appendChild(renderer.domElement)

	// controls
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.minPolarAngle = Math.PI / 4
	controls.maxPolarAngle = Math.PI / 1.5

	// Load customized cube texture with mipmaps
	async function loadCubeTextureWithMipmaps() {
		const path = ASSET_BASE + 'textures/cube/angus/'
		const format = '.jpg'
		const mipmaps: THREE.CubeTexture[] = []
		const maxLevel = 8

		async function loadCubeTexture(urls: string[]) {
			return new Promise<THREE.CubeTexture>(function (resolve) {
				new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
					resolve(cubeTexture)
				})
			})
		}

		const pendings: Promise<void>[] = []

		for (let level = 0; level <= maxLevel; ++level) {
			const urls: string[] = []
			for (let face = 0; face < 6; ++face) {
				urls.push(path + 'cube_m0' + level + '_c0' + face + format)
			}
			const mipmapLevel = level
			pendings.push(
				loadCubeTexture(urls).then(function (cubeTexture) {
					mipmaps[mipmapLevel] = cubeTexture
				})
			)
		}

		await Promise.all(pendings)

		const customizedCubeTexture = mipmaps.shift()!
		customizedCubeTexture.mipmaps = mipmaps
		customizedCubeTexture.colorSpace = THREE.SRGBColorSpace
		customizedCubeTexture.minFilter = THREE.LinearMipMapLinearFilter
		customizedCubeTexture.magFilter = THREE.LinearFilter
		customizedCubeTexture.generateMipmaps = false
		customizedCubeTexture.needsUpdate = true

		return customizedCubeTexture
	}

	loadCubeTextureWithMipmaps().then(function (cubeTexture) {
		const sphere = new THREE.SphereGeometry(100, 128, 128)

		let material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: cubeTexture })
		material.name = 'manual mipmaps'

		let mesh = new THREE.Mesh(sphere, material)
		mesh.position.set(100, 0, 0)
		scene.add(mesh)

		material = material.clone()
		material.name = 'auto mipmaps'

		const autoCubeTexture = cubeTexture.clone()
		autoCubeTexture.mipmaps = []
		autoCubeTexture.generateMipmaps = true
		autoCubeTexture.needsUpdate = true

		material.envMap = autoCubeTexture

		mesh = new THREE.Mesh(sphere, material)
		mesh.position.set(-100, 0, 0)
		scene.add(mesh)
	})

	function onWindowResize() {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}

	function animate() {
		renderer.render(scene, camera)
	}

	window.addEventListener('resize', onWindowResize)

	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', onWindowResize)
		controls.dispose()
		scene.traverse((obj) => {
			const mesh = obj as THREE.Mesh
			if (mesh.geometry) mesh.geometry.dispose()
			if (mesh.material) {
				const mat = mesh.material as THREE.Material
				mat.dispose()
			}
		})
		renderer.dispose()
		if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
	}
}

export default function WebGLMaterialsCubemapMipmaps() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
