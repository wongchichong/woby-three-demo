/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_modifier_curve_instanced

import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { InstancedFlow } from 'three/examples/jsm/modifiers/CurveModifier.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const ACTION_SELECT = 1
const ACTION_NONE = 0

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	const width = container.clientWidth
	const height = container.clientHeight

	// Scene
	const scene = new THREE.Scene()

	// Camera - match upstream exactly
	const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000)
	camera.position.set(2, 2, 4)
	camera.lookAt(scene.position)

	// Curve handles for TransformControls
	const curveHandles: THREE.Mesh[] = []
	const mouse = new THREE.Vector2()
	let action = ACTION_NONE

	// Box geometry for curve handles
	const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
	const boxMaterial = new THREE.MeshBasicMaterial()

	// Create curves with handles
	const curves = [
		[
			{ x: 1, y: -0.5, z: -1 },
			{ x: 1, y: -0.5, z: 1 },
			{ x: -1, y: -0.5, z: 1 },
			{ x: -1, y: -0.5, z: -1 },
		],
		[
			{ x: -1, y: 0.5, z: -1 },
			{ x: -1, y: 0.5, z: 1 },
			{ x: 1, y: 0.5, z: 1 },
			{ x: 1, y: 0.5, z: -1 },
		],
	].map((curvePoints) => {
		const curveVertices = curvePoints.map((handlePos) => {
			const handle = new THREE.Mesh(boxGeometry, boxMaterial)
			handle.position.copy(handlePos)
			curveHandles.push(handle)
			scene.add(handle)
			return handle.position
		})

		const curve = new THREE.CatmullRomCurve3(curveVertices)
		curve.curveType = 'centripetal'
		curve.closed = true

		const points = curve.getPoints(50)
		const line = new THREE.LineLoop(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({ color: 0x00ff00 })
		)

		scene.add(line)

		return {
			curve,
			line,
		}
	})

	// Lighting - DirectionalLight first, then AmbientLight (match upstream order)
	const light = new THREE.DirectionalLight(0xffaa33, 3)
	light.position.set(-10, 10, 10)
	scene.add(light)

	const light2 = new THREE.AmbientLight(0x003973, 3)
	scene.add(light2)

	// Renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(width, height)
	container.appendChild(renderer.domElement)

	// Raycaster for selection
	const rayCaster = new THREE.Raycaster()

	// TransformControls
	const control = new TransformControls(camera, renderer.domElement)
	control.addEventListener('dragging-changed', (event) => {
		if (!event.value) {
			curves.forEach(({ curve, line }, i) => {
				const points = curve.getPoints(50)
				line.geometry.setFromPoints(points)
				if (flow) flow.updateCurve(i, curve)
			})
		}
	})

	// Stats
	const stats = new Stats()
	container.appendChild(stats.dom)

	// Flow (instanced) - loaded after font
	let flow: InstancedFlow | null = null

	const loader = new FontLoader()
	loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
		const geometry = new TextGeometry('Hello three.js!', {
			font: font,
			size: 0.2,
			depth: 0.05,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 0.02,
			bevelSize: 0.01,
			bevelOffset: 0,
			bevelSegments: 5,
		})

		geometry.rotateX(Math.PI)

		const material = new THREE.MeshStandardMaterial({
			color: 0x99ffff,
		})

		const numberOfInstances = 8
		flow = new InstancedFlow(numberOfInstances, curves.length, geometry, material)

		curves.forEach(({ curve }, i) => {
			flow!.updateCurve(i, curve)
			scene.add(flow!.object3D)
		})

		for (let i = 0; i < numberOfInstances; i++) {
			const curveIndex = i % curves.length
			flow!.setCurve(i, curveIndex)
			flow!.moveIndividualAlongCurve(i, i * 1 / numberOfInstances)
			flow!.object3D.setColorAt(i, new THREE.Color(0xffffff * Math.random()))
		}
	})

	// Pointer down handler
	const onPointerDown = (event: PointerEvent) => {
		action = ACTION_SELECT
		const rect = renderer.domElement.getBoundingClientRect()
		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
	}
	renderer.domElement.addEventListener('pointerdown', onPointerDown)

	// Resize handler
	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}
	window.addEventListener('resize', onWindowResize)

	// Animation loop
	const animate = () => {
		if (action === ACTION_SELECT) {
			rayCaster.setFromCamera(mouse, camera)
			action = ACTION_NONE
			const intersects = rayCaster.intersectObjects(curveHandles, false)
			if (intersects.length) {
				const target = intersects[0].object
				control.attach(target)
				scene.add(control.getHelper())
			}
		}

		if (flow) {
			flow.moveAlongCurve(0.001)
		}

		renderer.render(scene, camera)
		stats.update()
	}
	renderer.setAnimationLoop(animate)

	// Cleanup
	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		renderer.domElement.removeEventListener('pointerdown', onPointerDown)
		window.removeEventListener('resize', onWindowResize)

		control.detach()
		control.dispose()
		boxGeometry.dispose()
		boxMaterial.dispose()
		curves.forEach(({ line }) => {
			line.geometry.dispose()
			;(line.material as THREE.Material).dispose()
		})

		renderer.dispose()

		if (renderer.domElement.parentElement === container) {
			container.removeChild(renderer.domElement)
		}
		if (stats.dom.parentElement === container) {
			container.removeChild(stats.dom)
		}
	}
}

export const WebGLModifierCurveInstanced = () => (
	<div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
)

export default WebGLModifierCurveInstanced
