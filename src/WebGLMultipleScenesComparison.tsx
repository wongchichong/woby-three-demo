/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_multiple_scenes_comparison

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	let sliderPos = container.clientWidth / 2

	const sceneL = new THREE.Scene()
	sceneL.background = new THREE.Color(0xBCD48F)

	const sceneR = new THREE.Scene()
	sceneR.background = new THREE.Color(0x8FBCD4)

	const camera = new THREE.PerspectiveCamera(
		35,
		container.clientWidth / container.clientHeight,
		0.1,
		100
	)
	camera.position.z = 6

	const controls = new OrbitControls(camera, container)

	const light = new THREE.HemisphereLight(0xffffff, 0x444444, 3)
	light.position.set(-2, 2, 2)
	sceneL.add(light.clone())
	sceneR.add(light.clone())

	// initMeshes
	const geometry = new THREE.IcosahedronGeometry(1, 3)

	const meshL = new THREE.Mesh(
		geometry,
		new THREE.MeshStandardMaterial()
	)
	sceneL.add(meshL)

	const meshR = new THREE.Mesh(
		geometry,
		new THREE.MeshStandardMaterial({ wireframe: true })
	)
	sceneR.add(meshR)

	// initSlider
	const slider = document.createElement('div')
	slider.style.position = 'absolute'
	slider.style.cursor = 'ew-resize'
	slider.style.width = '40px'
	slider.style.height = '40px'
	slider.style.backgroundColor = '#F32196'
	slider.style.opacity = '0.7'
	slider.style.borderRadius = '50%'
	slider.style.top = 'calc(50% - 20px)'
	slider.style.left = 'calc(50% - 20px)'
	slider.style.touchAction = 'none' // disable touch scroll
	container.appendChild(slider)

	const onPointerDown = (e: PointerEvent) => {
		if (e.isPrimary === false) return

		controls.enabled = false

		window.addEventListener('pointermove', onPointerMove)
		window.addEventListener('pointerup', onPointerUp)
	}

	const onPointerUp = (e: PointerEvent) => {
		controls.enabled = true

		window.removeEventListener('pointermove', onPointerMove)
		window.removeEventListener('pointerup', onPointerUp)
	}

	const onPointerMove = (e: PointerEvent) => {
		if (e.isPrimary === false) return

		sliderPos = Math.max(0, Math.min(container.clientWidth, e.clientX - container.getBoundingClientRect().left))

		slider.style.left = sliderPos - (slider.offsetWidth / 2) + 'px'
	}

	slider.addEventListener('pointerdown', onPointerDown)

	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()

		renderer.setSize(container.clientWidth, container.clientHeight)
	}

	window.addEventListener('resize', onWindowResize)

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	renderer.setScissorTest(true)
	container.appendChild(renderer.domElement)

	const animate = () => {
		renderer.setScissor(0, 0, sliderPos, container.clientHeight)
		renderer.render(sceneL, camera)

		renderer.setScissor(sliderPos, 0, container.clientWidth, container.clientHeight)
		renderer.render(sceneR, camera)
	}

	renderer.setAnimationLoop(animate)

	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', onWindowResize)
		slider.removeEventListener('pointerdown', onPointerDown)
		window.removeEventListener('pointermove', onPointerMove)
		window.removeEventListener('pointerup', onPointerUp)

		geometry.dispose()
		meshL.material.dispose()
		meshR.material.dispose()
		renderer.dispose()
		container.removeChild(renderer.domElement)
		container.removeChild(slider)
	}
}

export default function WebGLMultipleScenesComparison() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
