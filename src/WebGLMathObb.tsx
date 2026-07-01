/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_math_obb

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBB } from 'three/examples/jsm/math/OBB.js'
import { Timer } from 'three/examples/jsm/misc/Timer.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

	const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 1, 1000)
	camera.position.set(0, 0, 75)

	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0xffffff)

	const timer = new Timer()

	const raycaster = new THREE.Raycaster()
	const mouse = new THREE.Vector2()

	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 4)
	hemiLight.position.set(1, 1, 1)
	scene.add(hemiLight)

	const size = new THREE.Vector3(10, 5, 6)
	const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
	geometry.userData.obb = new OBB()
	geometry.userData.obb.halfSize.copy(size).multiplyScalar(0.5)

	const objects: THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial>[] = []
	for (let i = 0; i < 100; i++) {
		const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }))
		object.matrixAutoUpdate = false

		object.position.x = Math.random() * 80 - 40
		object.position.y = Math.random() * 80 - 40
		object.position.z = Math.random() * 80 - 40

		object.rotation.x = Math.random() * 2 * Math.PI
		object.rotation.y = Math.random() * 2 * Math.PI
		object.rotation.z = Math.random() * 2 * Math.PI

		object.scale.x = Math.random() + 0.5
		object.scale.y = Math.random() + 0.5
		object.scale.z = Math.random() + 0.5

		scene.add(object)

		object.userData.obb = new OBB()

		objects.push(object)
	}

	const hitbox = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true }))

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	container.appendChild(renderer.domElement)

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true

	const stats = new Stats()
	container.appendChild(stats.dom)

	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}
	window.addEventListener('resize', onWindowResize)

	const onClick = (event: MouseEvent) => {
		event.preventDefault()

		const rect = renderer.domElement.getBoundingClientRect()
		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

		raycaster.setFromCamera(mouse, camera)

		const intersectionPoint = new THREE.Vector3()
		const intersections: { distance: number; object: THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial> }[] = []

		for (let i = 0, il = objects.length; i < il; i++) {
			const object = objects[i]
			const obb = object.userData.obb as OBB
			const ray = raycaster.ray

			if (obb.intersectRay(ray, intersectionPoint) !== null) {
				const distance = ray.origin.distanceTo(intersectionPoint)
				intersections.push({ distance, object })
			}
		}

		if (intersections.length > 0) {
			intersections.sort((a, b) => a.distance - b.distance)
			intersections[0].object.add(hitbox)
		} else {
			const parent = hitbox.parent
			if (parent) parent.remove(hitbox)
		}
	}
	document.addEventListener('click', onClick)

	const animate = () => {
		timer.update()
		controls.update()

		const delta = timer.getDelta()

		for (let i = 0, il = objects.length; i < il; i++) {
			const object = objects[i]

			object.rotation.x += delta * Math.PI * 0.2
			object.rotation.y += delta * Math.PI * 0.1

			object.updateMatrix()
			object.updateMatrixWorld()

			const obb = object.userData.obb as OBB
			const geometryOBB = geometry.userData.obb as OBB
			obb.copy(geometryOBB)
			obb.applyMatrix4(object.matrixWorld)

			object.material.color.setHex(0x00ff00)
		}

		for (let i = 0, il = objects.length; i < il; i++) {
			const object = objects[i]
			const obb = object.userData.obb as OBB

			for (let j = i + 1, jl = objects.length; j < jl; j++) {
				const objectToTest = objects[j]
				const obbToTest = objectToTest.userData.obb as OBB

				if (obb.intersectsOBB(obbToTest) === true) {
					object.material.color.setHex(0xff0000)
					objectToTest.material.color.setHex(0xff0000)
				}
			}
		}

		renderer.render(scene, camera)
		stats.update()
	}
	renderer.setAnimationLoop(animate)

	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', onWindowResize)
		document.removeEventListener('click', onClick)
		controls.dispose()
		timer.dispose()
		geometry.dispose()
		objects.forEach(obj => {
			obj.material.dispose()
		})
		hitbox.geometry.dispose()
		;(hitbox.material as THREE.Material).dispose()
		renderer.dispose()
		if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
		if (container.contains(stats.dom)) container.removeChild(stats.dom)
	}
}

export default function WebGLMathOBB() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
