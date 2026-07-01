/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_lightprobes

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { LightProbeGrid } from '@woby/three/examples/jsm/lighting/LightProbeGrid';
import { LightProbeGridHelper } from '@woby/three/examples/jsm/helpers/LightProbeGridHelper';

let _cleanupFn: (() => void) | null = null;

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn();
		_cleanupFn = null;
	}

	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let probes: InstanceType<typeof LightProbeGrid> | null = null;
	let probesHelper: InstanceType<typeof LightProbeGridHelper> | null = null;
	let gui: InstanceType<typeof GUI> | null = null;

	// Camera

	camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
	camera.position.set(0, 2.5, 8);

	// Scene

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x111111);

	// Cornell box

	const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
	const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
	const greenMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

	// Floor
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), wallMaterial);
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);

	// Ceiling
	const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), wallMaterial);
	ceiling.rotation.x = Math.PI / 2;
	ceiling.position.y = 5;
	ceiling.receiveShadow = true;
	scene.add(ceiling);

	// Back wall
	const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), wallMaterial);
	backWall.position.set(0, 2.5, -3);
	backWall.receiveShadow = true;
	scene.add(backWall);

	// Front wall
	const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), wallMaterial);
	frontWall.rotation.y = Math.PI;
	frontWall.position.set(0, 2.5, 3);
	frontWall.receiveShadow = true;
	scene.add(frontWall);

	// Left wall (red)
	const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), redMaterial);
	leftWall.rotation.y = Math.PI / 2;
	leftWall.position.set(-3, 2.5, 0);
	leftWall.receiveShadow = true;
	scene.add(leftWall);

	// Right wall (green)
	const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), greenMaterial);
	rightWall.rotation.y = -Math.PI / 2;
	rightWall.position.set(3, 2.5, 0);
	rightWall.receiveShadow = true;
	scene.add(rightWall);

	// Objects inside the box

	const objectMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });

	// Tall box
	const tallBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), objectMaterial);
	tallBox.position.set(-0.8, 1.25, -0.8);
	tallBox.rotation.y = Math.PI / 8;
	tallBox.castShadow = true;
	tallBox.receiveShadow = true;
	scene.add(tallBox);

	// Short box
	const shortBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), objectMaterial);
	shortBox.position.set(1, 0.6, 0.5);
	shortBox.rotation.y = -Math.PI / 6;
	shortBox.castShadow = true;
	shortBox.receiveShadow = true;
	scene.add(shortBox);

	// Sphere (to show smooth GI variation)
	const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), objectMaterial.clone());
	sphere.position.set(1, 1.9, 0.5);
	sphere.castShadow = true;
	sphere.receiveShadow = true;
	scene.add(sphere);

	// Light
	const light = new THREE.PointLight(0xffffff, 40);
	light.position.set(0, 4.5, 0);
	light.castShadow = true;
	light.shadow.mapSize.setScalar(256);
	light.shadow.radius = 10;
	light.shadow.normalBias = -0.02;
	scene.add(light);

	// Dim ambient to see GI effect better
	const ambient = new THREE.AmbientLight(0xffffff, 0.05);
	scene.add(ambient);

	// Renderer

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;

	// Controls

	controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 2.5, 0);
	controls.update();

	// Bake light probe volume

	async function bakeWithResolution(resolution: number) {
		if (probes) {
			scene.remove(probes);
			probes.dispose();
		}

		probes = new LightProbeGrid(5.6, 4.7, 5.6, resolution, resolution, resolution);
		probes.position.set(0, 2.45, 0);
		await probes.bake(renderer, scene, { cubemapSize: 32, near: 0.05, far: 20 });
		probes.visible = params.enabled;
		scene.add(probes);

		// Update debug visualization

		if (!probesHelper) {
			probesHelper = new LightProbeGridHelper(probes);
			probesHelper.visible = params.showProbes;
			scene.add(probesHelper);
		} else {
			probesHelper.probes = probes;
			probesHelper.update();
		}
	}

	const params = {
		enabled: true,
		showProbes: false,
		resolution: 6
	};

	// Animation loop

	function animate() {
		renderer.render(scene, camera);
	}

	renderer.setAnimationLoop(animate);

	container.appendChild(renderer.domElement);

	// Initialize probes (async IIFE to allow await at top level of init)
	(async () => {
		await bakeWithResolution(params.resolution);

		// GUI

		gui = new GUI();
		gui.add(params, 'enabled').name('GI').onChange((value: boolean) => {
			if (probes) probes.visible = value;
		});
		gui.add(params, 'resolution', 2, 12, 1).name('Resolution').onFinishChange((value: number) => {
			bakeWithResolution(value);
		});
		gui.add(params, 'showProbes').name('Show Probes').onChange((value: boolean) => {
			if (probesHelper) probesHelper.visible = value;
		});
	})();

	//

	window.addEventListener('resize', onWindowResize);

	function onWindowResize() {
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	// Cleanup function
	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize);
		renderer.setAnimationLoop(null);
		if (gui) gui.destroy();
		if (probes) probes.dispose();
		if (probesHelper) probesHelper.dispose();
		controls.dispose();
		renderer.dispose();
		floor.geometry.dispose();
		ceiling.geometry.dispose();
		backWall.geometry.dispose();
		frontWall.geometry.dispose();
		leftWall.geometry.dispose();
		rightWall.geometry.dispose();
		tallBox.geometry.dispose();
		shortBox.geometry.dispose();
		sphere.geometry.dispose();
		(sphere.material).dispose();
		wallMaterial.dispose();
		redMaterial.dispose();
		greenMaterial.dispose();
		objectMaterial.dispose();
		light.dispose();
		ambient.dispose();
		if (container.contains(renderer.domElement)) {
			container.removeChild(renderer.domElement);
		}
	};
};

export default function WebGLLightProbes() {
	return (
		<div
			ref={(el) => {
				if (el) init3D(el);
			}}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}
