/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_pmrem_equirectangular

import * as THREE from 'three';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let _cleanupFn: (() => void) | null = null;

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = null; }

	// Camera
	const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.25, 20);
	camera.position.set(0, 0, 8);

	// Scene
	const scene = new THREE.Scene();

	// Renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.setAnimationLoop(render);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	container.appendChild(renderer.domElement);

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.update();

	// Load UltraHDR equirectangular texture
	new UltraHDRLoader()
		.setPath('https://threejs.org/examples/textures/equirectangular/')
		.load('royal_esplanade_2k.hdr.jpg', function (map) {
			map.mapping = THREE.EquirectangularReflectionMapping;

			const pmremGenerator = new THREE.PMREMGenerator(renderer);
			const envMap = pmremGenerator.fromEquirectangular(map).texture;

			scene.background = envMap;
			scene.backgroundBlurriness = 0.5;

			pmremGenerator.dispose();

			const geometry = new THREE.SphereGeometry(0.4, 64, 64);

			for (let i = 0; i < 6; i++) {
				for (let j = 0; j < 5; j++) {
					const material = new THREE.MeshPhysicalMaterial({
						roughness: i / 5,
						metalness: j / 4,
						envMap: envMap
					});

					const mesh = new THREE.Mesh(geometry, material);
					mesh.position.x = i - 2.5;
					mesh.position.y = j - 2;
					scene.add(mesh);
				}
			}
		});

	// Handle window resize
	function onWindowResize() {
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	window.addEventListener('resize', onWindowResize);

	// Render loop
	function render() {
		renderer.render(scene, camera);
	}

	// Cleanup function
	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize);
		renderer.setAnimationLoop(null);
		controls.dispose();
		renderer.dispose();
		container.removeChild(renderer.domElement);
	};
};

export default function WebGLPMREMEquirectangular() {
	return (
		<div
			ref={(el) => {
				if (el) init3D(el);
			}}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}
