/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_raycaster_texture

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

const WRAPPING = {
	'RepeatWrapping': THREE.RepeatWrapping,
	'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
	'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping
}

const params = {
	wrapS: THREE.RepeatWrapping,
	wrapT: THREE.RepeatWrapping,
	offsetX: 0,
	offsetY: 0,
	repeatX: 1,
	repeatY: 1,
	rotation: 0
}

class CanvasTextureHelper {
	_canvas: HTMLCanvasElement
	_context2D: CanvasRenderingContext2D | null
	_xCross: number = 0
	_yCross: number = 0
	_crossRadius: number = 57
	_crossMax: number = 40
	_crossMin: number = 4
	_crossThickness: number = 4
	_parentTexture: THREE.Texture[] = []
	_background: HTMLImageElement

	constructor(parentTexture?: THREE.Texture) {
		this._canvas = document.createElement('canvas')
		this._canvas.width = 1024
		this._canvas.height = 1024
		this._context2D = this._canvas.getContext('2d')

		if (parentTexture) {
			this._parentTexture.push(parentTexture)
			parentTexture.image = this._canvas
		}

		this._background = document.createElement('img')
		this._background.addEventListener('load', () => {
			this._canvas.width = this._background.naturalWidth
			this._canvas.height = this._background.naturalHeight

			this._crossRadius = Math.ceil(Math.min(this._canvas.width, this._canvas.height) / 30)
			this._crossMax = Math.ceil(0.70710678 * this._crossRadius)
			this._crossMin = Math.ceil(this._crossMax / 10)
			this._crossThickness = Math.ceil(this._crossMax / 10)

			this._draw()
		})
		this._background.crossOrigin = ''
		this._background.src = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'

		this._draw()
	}

	addParent(parentTexture: THREE.Texture): void {
		if (this._parentTexture.indexOf(parentTexture) === -1) {
			this._parentTexture.push(parentTexture)
			parentTexture.image = this._canvas
		}
	}

	setCrossPosition(x: number, y: number): void {
		this._xCross = x * this._canvas.width
		this._yCross = y * this._canvas.height

		this._draw()
	}

	_draw(): void {
		if (!this._context2D) return

		this._context2D.clearRect(0, 0, this._canvas.width, this._canvas.height)

		// Background.
		this._context2D.drawImage(this._background, 0, 0)

		// Yellow cross.
		this._context2D.lineWidth = this._crossThickness * 3
		this._context2D.strokeStyle = '#FFFF00'

		this._context2D.beginPath()
		this._context2D.moveTo(this._xCross - this._crossMax - 2, this._yCross - this._crossMax - 2)
		this._context2D.lineTo(this._xCross - this._crossMin, this._yCross - this._crossMin)

		this._context2D.moveTo(this._xCross + this._crossMin, this._yCross + this._crossMin)
		this._context2D.lineTo(this._xCross + this._crossMax + 2, this._yCross + this._crossMax + 2)

		this._context2D.moveTo(this._xCross - this._crossMax - 2, this._yCross + this._crossMax + 2)
		this._context2D.lineTo(this._xCross - this._crossMin, this._yCross + this._crossMin)

		this._context2D.moveTo(this._xCross + this._crossMin, this._yCross - this._crossMin)
		this._context2D.lineTo(this._xCross + this._crossMax + 2, this._yCross - this._crossMax - 2)

		this._context2D.stroke()

		for (let i = 0; i < this._parentTexture.length; i++) {
			this._parentTexture[i].needsUpdate = true
		}
	}
}

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	const width = container.clientWidth
	const height = container.clientHeight

	let canvas: CanvasTextureHelper
	let planeTexture: THREE.Texture, cubeTexture: THREE.Texture, circleTexture: THREE.Texture

	// Scene setup
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0xeeeeee)

	const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000)
	camera.position.x = -30
	camera.position.y = 40
	camera.position.z = 50
	camera.lookAt(scene.position)

	const renderer = new THREE.WebGLRenderer()
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(width, height)
	container.appendChild(renderer.domElement)

	// Raycaster and mouse tracking
	const raycaster = new THREE.Raycaster()
	const mouse = new THREE.Vector2()
	const onClickPosition = new THREE.Vector2()

	// A cube, in the middle.
	cubeTexture = new THREE.Texture(undefined, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping)
	cubeTexture.colorSpace = THREE.SRGBColorSpace
	canvas = new CanvasTextureHelper(cubeTexture)
	const cubeMaterial = new THREE.MeshBasicMaterial({ map: cubeTexture })
	const cubeGeometry = new THREE.BoxGeometry(20, 20, 20)
	let uvs = cubeGeometry.attributes.uv.array as Float32Array
	// Set a specific texture mapping.
	for (let i = 0; i < uvs.length; i++) {
		uvs[i] *= 2
	}

	const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
	cube.position.x = 4
	cube.position.y = -5
	cube.position.z = 0
	scene.add(cube)

	// A plane on the left
	planeTexture = new THREE.Texture(undefined, THREE.UVMapping, THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping)
	planeTexture.colorSpace = THREE.SRGBColorSpace
	canvas.addParent(planeTexture)
	const planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture })
	const planeGeometry = new THREE.PlaneGeometry(25, 25, 1, 1)
	uvs = planeGeometry.attributes.uv.array as Float32Array

	// Set a specific texture mapping.
	for (let i = 0; i < uvs.length; i++) {
		uvs[i] *= 2
	}

	const plane = new THREE.Mesh(planeGeometry, planeMaterial)
	plane.position.x = -16
	plane.position.y = -5
	plane.position.z = 0
	scene.add(plane)

	// A circle on the right.
	circleTexture = new THREE.Texture(undefined, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping)
	circleTexture.colorSpace = THREE.SRGBColorSpace
	canvas.addParent(circleTexture)
	const circleMaterial = new THREE.MeshBasicMaterial({ map: circleTexture })
	const circleGeometry = new THREE.CircleGeometry(25, 40, 0, Math.PI * 2)
	uvs = circleGeometry.attributes.uv.array as Float32Array

	// Set a specific texture mapping.
	for (let i = 0; i < uvs.length; i++) {
		uvs[i] = (uvs[i] - 0.25) * 2
	}

	const circle = new THREE.Mesh(circleGeometry, circleMaterial)
	circle.position.x = 24
	circle.position.y = -5
	circle.position.z = 0
	scene.add(circle)

	// Helper functions
	const getMousePosition = (dom: HTMLElement, x: number, y: number): [number, number] => {
		const rect = dom.getBoundingClientRect()
		return [(x - rect.left) / rect.width, (y - rect.top) / rect.height]
	}

	const getIntersects = (point: THREE.Vector2, objects: THREE.Object3D[]): THREE.Intersection[] => {
		mouse.set((point.x * 2) - 1, -(point.y * 2) + 1)

		raycaster.setFromCamera(mouse, camera)

		return raycaster.intersectObjects(objects, false)
	}

	// GUI
	const gui = new GUI()
	gui.title('Circle Texture Settings')

	const setwrapS = (value: THREE.Wrapping) => {
		circleTexture.wrapS = value
		circleTexture.needsUpdate = true
	}

	const setwrapT = (value: THREE.Wrapping) => {
		circleTexture.wrapT = value
		circleTexture.needsUpdate = true
	}

	gui.add(params, 'wrapS', WRAPPING).onChange(setwrapS)
	gui.add(params, 'wrapT', WRAPPING).onChange(setwrapT)
	gui.add(params, 'offsetX', 0, 5)
	gui.add(params, 'offsetY', 0, 5)
	gui.add(params, 'repeatX', 0, 5)
	gui.add(params, 'repeatY', 0, 5)
	gui.add(params, 'rotation', 0, 2 * Math.PI)
	gui.open()

	// Event handlers
	const onMouseMove = (evt: MouseEvent) => {
		evt.preventDefault()

		const array = getMousePosition(container, evt.clientX, evt.clientY)
		onClickPosition.fromArray(array)

		const intersects = getIntersects(onClickPosition, scene.children)

		if (intersects.length > 0 && intersects[0].uv) {
			const uv = intersects[0].uv
			const material = intersects[0].object.material as THREE.MeshBasicMaterial
			if (material.map) {
				material.map.transformUv(uv)
			}
			canvas.setCrossPosition(uv.x, uv.y)
		}
	}

	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}

	window.addEventListener('resize', onWindowResize)
	container.addEventListener('mousemove', onMouseMove)

	// Animation loop
	const animate = () => {
		// update texture parameters
		circleTexture.offset.x = params.offsetX
		circleTexture.offset.y = params.offsetY
		circleTexture.repeat.x = params.repeatX
		circleTexture.repeat.y = params.repeatY
		circleTexture.rotation = params.rotation

		renderer.render(scene, camera)
	}
	renderer.setAnimationLoop(animate)

	// Cleanup function
	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		container.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('resize', onWindowResize)

		planeGeometry.dispose()
		cubeGeometry.dispose()
		circleGeometry.dispose()
		planeMaterial.dispose()
		cubeMaterial.dispose()
		circleMaterial.dispose()
		planeTexture.dispose()
		cubeTexture.dispose()
		circleTexture.dispose()

		gui.destroy()
		renderer.dispose()

		if (renderer.domElement.parentElement === container) {
			container.removeChild(renderer.domElement)
		}
	}
}

export default function WebGLRaycasterTexture() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
