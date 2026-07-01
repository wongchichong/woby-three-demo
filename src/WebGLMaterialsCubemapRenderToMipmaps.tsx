/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_materials_cubemap_render_to_mipmaps

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const ASSET_BASE = 'https://threejs.org/examples/'

const CubemapFilterShader = {
	name: 'CubemapFilterShader',
	uniforms: {
		cubeTexture: { value: null },
		mipIndex: { value: 0 },
	},
	vertexShader: /* glsl */ `

		varying vec3 vWorldDirection;

		#include <common>

		void main() {
			vWorldDirection = transformDirection(position, modelMatrix);
			#include <begin_vertex>
			#include <project_vertex>
			gl_Position.z = gl_Position.w;
		}
		`,
	fragmentShader: /* glsl */ `

		uniform samplerCube cubeTexture;
		varying vec3 vWorldDirection;

		uniform float mipIndex;

		#include <common>

		void main() {
			vec3 cubeCoordinates = normalize(vWorldDirection);

			vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
			if (mipIndex == 0.0) color.rgb = vec3(1.0, 1.0, 1.0);
			else if (mipIndex == 1.0) color.rgb = vec3(0.0, 0.0, 1.0);
			else if (mipIndex == 2.0) color.rgb = vec3(0.0, 1.0, 1.0);
			else if (mipIndex == 3.0) color.rgb = vec3(0.0, 1.0, 0.0);
			else if (mipIndex == 4.0) color.rgb = vec3(1.0, 1.0, 0.0);

			gl_FragColor = textureCube(cubeTexture, cubeCoordinates, 0.0) * color;
		}
		`,
}

async function loadCubeTexture(urls: string[]) {
	return new Promise<THREE.CubeTexture>(function (resolve) {
		new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
			resolve(cubeTexture)
		})
	})
}

function allocateCubemapRenderTarget(cubeMapSize: number) {
	const params = {
		magFilter: THREE.LinearFilter,
		minFilter: THREE.LinearMipMapLinearFilter,
		generateMipmaps: false,
		type: THREE.HalfFloatType,
		format: THREE.RGBAFormat,
		colorSpace: THREE.LinearSRGBColorSpace,
		depthBuffer: false,
	}

	const rt = new THREE.WebGLCubeRenderTarget(cubeMapSize, params)

	const mipLevels = Math.log(cubeMapSize) * Math.LOG2E + 1.0
	for (let i = 0; i < mipLevels; i++) rt.texture.mipmaps.push({} as any)

	rt.texture.mapping = THREE.CubeReflectionMapping
	return rt
}

function renderToCubeTexture(renderer: THREE.WebGLRenderer, cubeMapRenderTarget: THREE.WebGLCubeRenderTarget, sourceCubeTexture: THREE.CubeTexture) {
	const geometry = new THREE.BoxGeometry(5, 5, 5)

	const material = new THREE.ShaderMaterial({
		name: CubemapFilterShader.name,
		uniforms: THREE.UniformsUtils.clone(CubemapFilterShader.uniforms),
		vertexShader: CubemapFilterShader.vertexShader,
		fragmentShader: CubemapFilterShader.fragmentShader,
		side: THREE.BackSide,
		blending: THREE.NoBlending,
	})

	material.uniforms.cubeTexture.value = sourceCubeTexture

	const mesh = new THREE.Mesh(geometry, material)
	const cubeCamera = new THREE.CubeCamera(1, 10, cubeMapRenderTarget)
	const mipmapCount = Math.floor(Math.log2(Math.max(cubeMapRenderTarget.width, cubeMapRenderTarget.height)))

	for (let mipmap = 0; mipmap < mipmapCount; mipmap++) {
		material.uniforms.mipIndex.value = mipmap
		material.needsUpdate = true

		cubeMapRenderTarget.viewport.set(0, 0, cubeMapRenderTarget.width >> mipmap, cubeMapRenderTarget.height >> mipmap)

		cubeCamera.activeMipmapLevel = mipmap
		cubeCamera.update(renderer, mesh)
	}

	mesh.geometry.dispose()
	;(mesh.material as THREE.Material).dispose()
}

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(container.clientWidth, container.clientHeight)
	container.appendChild(renderer.domElement)

	const scene = new THREE.Scene()

	const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 10000)
	camera.position.z = 500

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.minPolarAngle = Math.PI / 4
	controls.maxPolarAngle = Math.PI / 1.5

	const r = ASSET_BASE + 'textures/cube/Park3Med/'
	const urls = [
		r + 'px.jpg', r + 'nx.jpg',
		r + 'py.jpg', r + 'ny.jpg',
		r + 'pz.jpg', r + 'nz.jpg'
	]

	loadCubeTexture(urls).then((cubeTexture) => {
		const cubeMapRenderTarget = allocateCubemapRenderTarget(512)
		renderToCubeTexture(renderer, cubeMapRenderTarget, cubeTexture)

		const sphere = new THREE.SphereGeometry(100, 128, 128)
		let material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: cubeTexture })

		let mesh = new THREE.Mesh(sphere, material)
		mesh.position.set(-100, 0, 0)
		scene.add(mesh)

		material = material.clone()
		material.envMap = cubeMapRenderTarget.texture

		mesh = new THREE.Mesh(sphere, material)
		mesh.position.set(100, 0, 0)
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

	renderer.setAnimationLoop(animate)
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

export default function WebGLMaterialsCubemapRenderToMipmaps() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
}
