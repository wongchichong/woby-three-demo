/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_geometry_terrain_raycast

import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	const worldWidth = 256
	const worldDepth = 256
	const worldHalfWidth = worldWidth / 2
	const worldHalfDepth = worldDepth / 2

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	renderer.setAnimationLoop(animate)
	container.appendChild(renderer.domElement)

	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0xbfd1e5)

	const camera = new THREE.PerspectiveCamera(
		60,
		container.clientWidth / container.clientHeight,
		10,
		20000
	)

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.minDistance = 1000
	controls.maxDistance = 10000
	controls.maxPolarAngle = Math.PI / 2

	// Generate heightmap data
	const generateHeight = (width: number, height: number) => {
		const size = width * height
		const data = new Uint8Array(size)
		const perlin = new ImprovedNoise()
		const z = Math.random() * 100

		let quality = 1

		for (let j = 0; j < 4; j++) {
			for (let i = 0; i < size; i++) {
				const x = i % width
				const y = ~~(i / width)
				data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75)
			}
			quality *= 5
		}

		return data
	}

	// Generate texture with lighting
	const generateTexture = (data: Uint8Array, width: number, height: number) => {
		const vector3 = new THREE.Vector3(0, 0, 0)
		const sun = new THREE.Vector3(1, 1, 1)
		sun.normalize()

		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height

		const context = canvas.getContext('2d')!
		context.fillStyle = '#000'
		context.fillRect(0, 0, width, height)

		const image = context.getImageData(0, 0, canvas.width, canvas.height)
		const imageData = image.data

		for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
			vector3.x = data[j - 2] - data[j + 2]
			vector3.y = 2
			vector3.z = data[j - width * 2] - data[j + width * 2]
			vector3.normalize()

			const shade = vector3.dot(sun)

			imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007)
			imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007)
			imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007)
		}

		context.putImageData(image, 0, 0)

		// Scale 4x
		const canvasScaled = document.createElement('canvas')
		canvasScaled.width = width * 4
		canvasScaled.height = height * 4

		const contextScaled = canvasScaled.getContext('2d')!
		contextScaled.scale(4, 4)
		contextScaled.drawImage(canvas, 0, 0)

		const imageScaled = contextScaled.getImageData(0, 0, canvasScaled.width, canvasScaled.height)
		const imageDataScaled = imageScaled.data

		for (let i = 0, l = imageDataScaled.length; i < l; i += 4) {
			const v = ~~(Math.random() * 5)
			imageDataScaled[i] += v
			imageDataScaled[i + 1] += v
			imageDataScaled[i + 2] += v
		}

		contextScaled.putImageData(imageScaled, 0, 0)

		return canvasScaled
	}

	const data = generateHeight(worldWidth, worldDepth)

	// Note: upstream does NOT multiply by 10 here - height is raw data value
	controls.target.y = data[worldHalfWidth + worldHalfDepth * worldWidth] + 500
	camera.position.y = controls.target.y + 2000
	camera.position.x = 2000
	controls.update()

	const geometry = new THREE.PlaneGeometry(7500, 7500, worldWidth - 1, worldDepth - 1)
	geometry.rotateX(-Math.PI / 2)

	const vertices = geometry.attributes.position.array as Float32Array

	for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
		vertices[j + 1] = data[i] * 10
	}

	const texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth))
	texture.wrapS = THREE.ClampToEdgeWrapping
	texture.wrapT = THREE.ClampToEdgeWrapping
	texture.colorSpace = THREE.SRGBColorSpace

	const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }))
	scene.add(mesh)

	// Create raycast marker
	const geometryHelper = new THREE.ConeGeometry(20, 100, 3)
	geometryHelper.translate(0, 50, 0)
	geometryHelper.rotateX(Math.PI / 2)
	const helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial())
	scene.add(helper)

	// Stats
	const stats = new Stats()
	container.appendChild(stats.dom)

	// Raycaster setup
	const raycaster = new THREE.Raycaster()
	const pointer = new THREE.Vector2()

	const onPointerMove = (event: PointerEvent) => {
		pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1
		pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)

		// See if the ray from the camera into the world hits one of our meshes
		const intersects = raycaster.intersectObject(mesh)

		// Toggle rotation bool for meshes that we clicked
		if (intersects.length > 0) {
			helper.position.set(0, 0, 0)
			helper.lookAt(intersects[0].face!.normal)
			helper.position.copy(intersects[0].point)
		}
	}

	container.addEventListener('pointermove', onPointerMove)

	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}

	window.addEventListener('resize', onWindowResize)

	function animate() {
		render()
		stats.update()
	}

	function render() {
		renderer.render(scene, camera)
	}

	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', onWindowResize)
		container.removeEventListener('pointermove', onPointerMove)

		controls.dispose()
		geometry.dispose()
		mesh.material.dispose()
		texture.dispose()
		geometryHelper.dispose()
		helper.material.dispose()
		renderer.dispose()
		container.removeChild(renderer.domElement)
		container.removeChild(stats.dom)
	}
}

export default function WebGLGeometryTerrainRaycast() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}