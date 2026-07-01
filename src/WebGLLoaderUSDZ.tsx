/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_usdz

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';

let _cleanupFn: (() => void) | undefined;

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn();
		_cleanupFn = undefined;
	}

	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;

	// Camera
	camera = new THREE.PerspectiveCamera(
		60,
		container.clientWidth / container.clientHeight,
		0.1,
		100
	);
	camera.position.set(0, 0.75, -1.5);

	// Scene
	scene = new THREE.Scene();

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 2.0;
	container.appendChild(renderer.domElement);

	// Controls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 1;
	controls.maxDistance = 8;

	// Loaders
	const hdrLoader = new RGBELoader()
		.setPath('https://threejs.org/examples/textures/equirectangular/');

	const usdzLoader = new USDZLoader()
		.setPath('https://threejs.org/examples/models/usdz/');

	// Load HDR and USDZ
	Promise.all([
		hdrLoader.loadAsync('venice_sunset_1k.hdr'),
		usdzLoader.loadAsync('saeukkang.usdz'),
	]).then(([texture, model]) => {
		// Environment
		texture.mapping = THREE.EquirectangularReflectionMapping;

		scene.background = texture;
		scene.backgroundBlurriness = 0.5;
		scene.environment = texture;

		// Model
		model.position.y = 0.25;
		model.position.z = -0.25;
		scene.add(model);
	});

	// Resize
	function onWindowResize() {
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	window.addEventListener('resize', onWindowResize);

	// Animation loop
	function animate() {
		renderer.render(scene, camera);
	}

	renderer.setAnimationLoop(animate);

	// Cleanup
	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize);
		renderer.setAnimationLoop(null);
		controls.dispose();
		renderer.dispose();
		container.removeChild(renderer.domElement);
	};
};

export default function WebGLLoaderUSDZ() {
	return (
		<div
			ref={(el) => {
				if (el) init3D(el);
			}}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}
