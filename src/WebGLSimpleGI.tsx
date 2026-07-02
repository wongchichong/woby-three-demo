/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_simple_gi

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

class GIMesh extends THREE.Mesh {
	copy(source: any) {
		super.copy(source)
		this.geometry = source.geometry.clone()
		return this
	}
}

//

class SimpleGI {
	private SIZE = 32
	private SIZE2 = this.SIZE * this.SIZE

	private camera: THREE.PerspectiveCamera
	private clone: THREE.Scene
	private rt: THREE.WebGLRenderTarget
	private normalMatrix: THREE.Matrix3
	private position: THREE.Vector3
	private normal: THREE.Vector3
	private bounces = 0
	private currentVertex = 0
	private color: Float32Array
	private buffer: Uint8Array

	constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
		this.camera = new THREE.PerspectiveCamera(90, 1, 0.01, 100)

		scene.updateMatrixWorld(true)

		this.clone = scene.clone()
		this.clone.matrixWorldAutoUpdate = false

		this.rt = new THREE.WebGLRenderTarget(this.SIZE, this.SIZE)

		this.normalMatrix = new THREE.Matrix3()

		this.position = new THREE.Vector3()
		this.normal = new THREE.Vector3()

		this.color = new Float32Array(3)
		this.buffer = new Uint8Array(this.SIZE2 * 4)

		this.compute(renderer, scene)
	}

	private compute(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
		if (this.bounces === 3) return

		const object = scene.children[0] // torusKnot
		const geometry = (object as THREE.Mesh).geometry as THREE.BufferGeometry

		const attributes = geometry.attributes
		const positions = attributes.position.array as Float32Array
		const normals = attributes.normal.array as Float32Array

		if (attributes.color === undefined) {
			const colors = new Float32Array(positions.length)
			geometry.setAttribute(
				'color',
				new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
			)
		}

		const colors = attributes.color.array as Float32Array

		const startVertex = this.currentVertex
		const totalVertex = positions.length / 3

		for (let i = 0; i < 32; i++) {
			if (this.currentVertex >= totalVertex) break

			this.position.fromArray(positions, this.currentVertex * 3)
			this.position.applyMatrix4(object.matrixWorld)

			this.normal.fromArray(normals, this.currentVertex * 3)
			this.normal
				.applyMatrix3(this.normalMatrix.getNormalMatrix(object.matrixWorld))
				.normalize()

			this.camera.position.copy(this.position)
			this.camera.lookAt(this.position.add(this.normal))

			renderer.setRenderTarget(this.rt)
			renderer.render(this.clone, this.camera)

			renderer.readRenderTargetPixels(this.rt, 0, 0, this.SIZE, this.SIZE, this.buffer)

			this.color[0] = 0
			this.color[1] = 0
			this.color[2] = 0

			for (let k = 0, kl = this.buffer.length; k < kl; k += 4) {
				this.color[0] += this.buffer[k + 0]
				this.color[1] += this.buffer[k + 1]
				this.color[2] += this.buffer[k + 2]
			}

			colors[this.currentVertex * 3 + 0] = this.color[0] / (this.SIZE2 * 255)
			colors[this.currentVertex * 3 + 1] = this.color[1] / (this.SIZE2 * 255)
			colors[this.currentVertex * 3 + 2] = this.color[2] / (this.SIZE2 * 255)

			this.currentVertex++
		}

		attributes.color.addUpdateRange(startVertex * 3, (this.currentVertex - startVertex) * 3)
		attributes.color.needsUpdate = true

		if (this.currentVertex >= totalVertex) {
			this.clone = scene.clone()
			this.clone.matrixWorldAutoUpdate = false

			this.bounces++
			this.currentVertex = 0
		}

		requestAnimationFrame(() => this.compute(renderer, scene))
	}
}

//

let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	init()

	function init() {
		camera = new THREE.PerspectiveCamera(
			70,
			container.clientWidth / container.clientHeight,
			0.1,
			100
		)
		camera.position.z = 4

		scene = new THREE.Scene()

		// torus knot

		const torusGeometry = new THREE.TorusKnotGeometry(0.75, 0.3, 128, 32, 1)
		const material = new THREE.MeshBasicMaterial({ vertexColors: true })

		const torusKnot = new GIMesh(torusGeometry, material)
		scene.add(torusKnot)

		// room

		const materials: THREE.MeshBasicMaterial[] = []

		for (let i = 0; i < 8; i++) {
			materials.push(
				new THREE.MeshBasicMaterial({
					color: Math.random() * 0xffffff,
					side: THREE.BackSide,
				})
			)
		}

		const boxGeometry = new THREE.BoxGeometry(3, 3, 3)

		const box = new THREE.Mesh(boxGeometry, materials)
		scene.add(box)

		//

		renderer = new THREE.WebGLRenderer()
		renderer.setPixelRatio(window.devicePixelRatio)
		renderer.setSize(container.clientWidth, container.clientHeight)
		renderer.setAnimationLoop(animate)
		container.appendChild(renderer.domElement)

		new SimpleGI(renderer, scene)

		const controls = new OrbitControls(camera, renderer.domElement)
		controls.minDistance = 1
		controls.maxDistance = 10

		window.addEventListener('resize', onWindowResize)

		_cleanupFn = () => {
			renderer.setAnimationLoop(null)
			window.removeEventListener('resize', onWindowResize)
			controls.dispose()
			torusGeometry.dispose()
			material.dispose()
			boxGeometry.dispose()
			materials.forEach((m) => m.dispose())
			renderer.dispose()
			container.removeChild(renderer.domElement)
		}
	}

	function onWindowResize() {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()

		renderer.setSize(container.clientWidth, container.clientHeight)
	}

	function animate() {
		renderer.setRenderTarget(null)
		renderer.render(scene, camera)
	}
}

export default function WebGLSimpleGI() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}