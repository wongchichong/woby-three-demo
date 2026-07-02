/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_video_kinect
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

const ASSET_BASE = 'https://threejs.org/examples/'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn()
		_cleanupFn = null
	}

	const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 10000)
	camera.position.set(0, 0, 500)

	const scene = new THREE.Scene()
	const center = new THREE.Vector3()
	center.z = -1000

	const video = document.createElement('video')
	video.id = 'video'
	video.loop = true
	video.muted = true
	video.crossOrigin = 'anonymous'
	video.playsInline = true
	video.style.display = 'none'
	document.body.appendChild(video)

	const sourceWebm = document.createElement('source')
	sourceWebm.src = ASSET_BASE + 'textures/kinect.webm'
	video.appendChild(sourceWebm)

	const sourceMp4 = document.createElement('source')
	sourceMp4.src = ASSET_BASE + 'textures/kinect.mp4'
	video.appendChild(sourceMp4)

	const texture = new THREE.VideoTexture(video)
	texture.minFilter = THREE.NearestFilter
	texture.generateMipmaps = false

	const width = 640, height = 480
	const nearClipping = 850, farClipping = 4000

	const geometry = new THREE.BufferGeometry()

	const vertices = new Float32Array(width * height * 3)

	for (let i = 0, j = 0, l = vertices.length; i < l; i += 3, j++) {
		vertices[i] = j % width
		vertices[i + 1] = Math.floor(j / width)
	}

	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

	const vertexShader = /* glsl */ `
		uniform sampler2D map;

		uniform float width;
		uniform float height;
		uniform float nearClipping, farClipping;

		uniform float pointSize;
		uniform float zOffset;

		varying vec2 vUv;

		const float XtoZ = 1.11146; // tan( 1.0144686 / 2.0 ) * 2.0;
		const float YtoZ = 0.83359; // tan( 0.7898090 / 2.0 ) * 2.0;

		void main() {

			vUv = vec2( position.x / width, position.y / height );

			vec4 color = texture2D( map, vUv );
			float depth = ( color.r + color.g + color.b ) / 3.0;

			// Projection code by @kcmic

			float z = ( 1.0 - depth ) * (farClipping - nearClipping) + nearClipping;

			vec4 pos = vec4(
				( position.x / width - 0.5 ) * z * XtoZ,
				( position.y / height - 0.5 ) * z * YtoZ,
				- z + zOffset,
				1.0);

			gl_PointSize = pointSize;
			gl_Position = projectionMatrix * modelViewMatrix * pos;

		}
	`

	const fragmentShader = /* glsl */ `
		uniform sampler2D map;

		varying vec2 vUv;

		void main() {

			vec4 color = texture2D( map, vUv );
			gl_FragColor = vec4( color.r, color.g, color.b, 0.2 );

		}
	`

	const material = new THREE.ShaderMaterial({
		uniforms: {
			'map': { value: texture },
			'width': { value: width },
			'height': { value: height },
			'nearClipping': { value: nearClipping },
			'farClipping': { value: farClipping },
			'pointSize': { value: 2 },
			'zOffset': { value: 1000 }
		},
		vertexShader,
		fragmentShader,
		blending: THREE.AdditiveBlending,
		depthTest: false, depthWrite: false,
		transparent: true
	})

	const mesh = new THREE.Points(geometry, material)
	scene.add(mesh)

	const gui = new GUI()
	gui.add(material.uniforms.nearClipping, 'value', 1, 10000, 1.0).name('nearClipping')
	gui.add(material.uniforms.farClipping, 'value', 1, 10000, 1.0).name('farClipping')
	gui.add(material.uniforms.pointSize, 'value', 1, 10, 1.0).name('pointSize')
	gui.add(material.uniforms.zOffset, 'value', 0, 4000, 1.0).name('zOffset')

	video.play()

	const renderer = new THREE.WebGLRenderer()
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	renderer.setAnimationLoop(animate)
	container.appendChild(renderer.domElement)

	const mouse = new THREE.Vector3(0, 0, 1)

	const onMouseMove = (event: MouseEvent) => {
		mouse.x = (event.clientX - container.getBoundingClientRect().left - container.clientWidth / 2) * 8
		mouse.y = (event.clientY - container.getBoundingClientRect().top - container.clientHeight / 2) * 8
	}
	container.addEventListener('mousemove', onMouseMove)

	const onWindowResize = () => {
		camera.aspect = container.clientWidth / container.clientHeight
		camera.updateProjectionMatrix()
		renderer.setSize(container.clientWidth, container.clientHeight)
	}
	window.addEventListener('resize', onWindowResize)

	function animate() {
		camera.position.x += (mouse.x - camera.position.x) * 0.05
		camera.position.y += (-mouse.y - camera.position.y) * 0.05
		camera.lookAt(center)
		renderer.render(scene, camera)
	}

	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', onWindowResize)
		container.removeEventListener('mousemove', onMouseMove)
		gui.destroy()
		video.pause()
		video.src = ''
		if (document.body.contains(video)) document.body.removeChild(video)
		geometry.dispose()
		material.dispose()
		texture.dispose()
		renderer.dispose()
		if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
	}
}

export default function WebGLVideoKinect() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
