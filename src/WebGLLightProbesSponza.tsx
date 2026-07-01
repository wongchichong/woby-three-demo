/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_lightprobes_sponza

import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Timer } from 'three/examples/jsm/misc/Timer.js';
import { LightProbeGrid } from '@woby/three/examples/jsm/lighting/LightProbeGrid';
import { LightProbeGridHelper } from '@woby/three/examples/jsm/helpers/LightProbeGridHelper';

let _cleanupFn: (() => void) | null = null;

const MODEL_INDEX_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/model-index.json';
const SAMPLE_ASSETS_BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/';

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = null; }

	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let controls: FirstPersonControls;
	let timer: Timer;
	let probes: InstanceType<typeof LightProbeGrid> | null = null;
	let probesHelper: InstanceType<typeof LightProbeGridHelper> | null = null;
	let modelSize: THREE.Vector3 | null = null;
	let dirLight: THREE.DirectionalLight | null = null;
	let sky: Sky | null = null;
	let gui: InstanceType<typeof GUI> | null = null;

	const sun = new THREE.Vector3();

	const _box = new THREE.Box3();
	const _size = new THREE.Vector3();
	const _center = new THREE.Vector3();

	// Progress bar
	const progressBar = document.createElement('progress');
	progressBar.id = 'progressBar';
	progressBar.value = 0;
	progressBar.max = 100;
	progressBar.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)';
	container.appendChild(progressBar);

	// Info overlay
	const infoEl = document.createElement('div');
	infoEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;padding:10px;box-sizing:border-box;text-align:center;color:white;font-family:monospace;font-size:14px;z-index:50;pointer-events:none;';
	const infoLink = document.createElement('a');
	infoLink.href = 'https://threejs.org';
	infoLink.target = '_blank';
	infoLink.rel = 'noopener';
	infoLink.style.color = 'white';
	infoLink.textContent = 'three.js';
	infoEl.appendChild(infoLink);
	infoEl.appendChild(document.createTextNode(' - light probe volume (Sponza)'));
	infoEl.appendChild(document.createElement('br'));
	infoEl.appendChild(document.createTextNode('WASD to move, mouse to look'));
	container.style.position = 'relative';
	container.appendChild(infoEl);

	async function init() {
		timer = new Timer();

		camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
		camera.position.set(-10.25, 4.99, 0.40);
		camera.rotation.set(1.6505, -1.5008, 1.6507);

		scene = new THREE.Scene();

		sky = new Sky();
		sky.scale.setScalar(450000);
		scene.add(sky);

		const skyUniforms = sky.material.uniforms;
		skyUniforms['turbidity'].value = 10;
		skyUniforms['rayleigh'].value = 2;
		skyUniforms['mieCoefficient'].value = 0.005;
		skyUniforms['mieDirectionalG'].value = 0.8;

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;
		container.appendChild(renderer.domElement);

		controls = new FirstPersonControls(camera, renderer.domElement);
		controls.movementSpeed = 2.0;
		controls.lookSpeed = 0.16;

		const manager = new THREE.LoadingManager();
		manager.onProgress = function (url, loaded, total) {
			progressBar.value = loaded / total * 100;
		};

		manager.onLoad = function () {
			progressBar.remove();
		};

		const loader = new GLTFLoader(manager);
		const modelURL = await getSponzaModelURL();
		const gltf = await loader.loadAsync(modelURL);
		const model = gltf.scene;
		const embeddedLights: THREE.Object3D[] = [];

		model.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				const mesh = child as THREE.Mesh;
				mesh.castShadow = true;
				mesh.receiveShadow = true;
			} else if ((child as THREE.Light).isLight) {
				embeddedLights.push(child);
			}
		});

		for (const light of embeddedLights) {
			if (light.parent) light.parent.remove(light);
		}

		scene.add(model);

		_box.setFromObject(model);
		modelSize = _box.getSize(_size).clone();
		const modelCenter = _box.getCenter(_center).clone();
		const targetY = modelCenter.y + modelSize.y * 0.2;
		const lightBaseDistance = Math.max(modelSize.x, modelSize.z);
		const probeFar = Math.max(modelSize.x, modelSize.y, modelSize.z) * 2.0;
		let rebakeTimer: ReturnType<typeof setTimeout> | null = null;
		let isBaking = false;
		let bakeQueued = false;

		dirLight = new THREE.DirectionalLight(0xfff2dc, 100.0);
		dirLight.target.position.set(modelCenter.x, targetY, modelCenter.z);
		scene.add(dirLight.target);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.setScalar(2048);
		const shadowExtent = Math.max(modelSize.x, modelSize.z) * 0.7;
		dirLight.shadow.camera.left = -shadowExtent;
		dirLight.shadow.camera.right = shadowExtent;
		dirLight.shadow.camera.top = shadowExtent;
		dirLight.shadow.camera.bottom = -shadowExtent;
		dirLight.shadow.camera.near = 0.1;
		dirLight.shadow.camera.far = modelSize.y * 4.0;
		scene.add(dirLight);

		const params = {
			enabled: true,
			showProbes: false,
			probeSize: 0.2,
			boundsX: -0.5,
			boundsY: 6,
			boundsZ: -0.3,
			sizeX: 21,
			sizeY: 11,
			sizeZ: 9,
			countX: 10,
			countY: 7,
			countZ: 7,
			bounces: 1,
			lightAzimuth: -45,
			lightElevation: 55,
			lightIntensity: 100.0,
			shadows: true
		};

		function updateLightPosition() {
			if (!dirLight || !sky) return;
			const azimuth = THREE.MathUtils.degToRad(params.lightAzimuth);
			const elevation = THREE.MathUtils.degToRad(params.lightElevation);
			const radius = lightBaseDistance;
			const horizontal = Math.cos(elevation) * radius;
			const vertical = Math.sin(elevation) * radius;

			dirLight.position.set(
				modelCenter.x + Math.cos(azimuth) * horizontal,
				targetY + vertical,
				modelCenter.z + Math.sin(azimuth) * horizontal
			);
			dirLight.target.position.set(modelCenter.x, targetY, modelCenter.z);
			dirLight.target.updateMatrixWorld();

			const phi = THREE.MathUtils.degToRad(90 - params.lightElevation);
			const theta = THREE.MathUtils.degToRad(params.lightAzimuth);
			sun.setFromSphericalCoords(1, phi, theta);
			sky.material.uniforms['sunPosition'].value.copy(sun);
		}

		function scheduleRebake() {
			if (rebakeTimer !== null) clearTimeout(rebakeTimer);
			rebakeTimer = setTimeout(() => {
				rebakeTimer = null;
				bakeWithSettings();
			}, 250);
		}

		async function bakeWithSettings() {
			if (isBaking) {
				bakeQueued = true;
				return;
			}

			isBaking = true;

			do {
				bakeQueued = false;

				if (probes) {
					scene.remove(probes);
					probes.dispose();
				}

				probes = new LightProbeGrid(
					params.sizeX, params.sizeY, params.sizeZ,
					params.countX, params.countY, params.countZ
				);
				probes.position.set(params.boundsX, params.boundsY, params.boundsZ);
				// Add to the scene before baking so bounce passes can sample the prior pass's atlas.
				scene.add(probes);
				// Hide the helper spheres so they don't appear in the cubemap captures.
				if (probesHelper) probesHelper.visible = false;
				await probes.bake(renderer, scene, {
					cubemapSize: 32,
					near: 0.05,
					far: probeFar,
					bounces: params.bounces
				});
				probes.visible = params.enabled;

				if (!probesHelper) {
					probesHelper = new LightProbeGridHelper(probes, params.probeSize);
					probesHelper.visible = params.showProbes;
					scene.add(probesHelper);
				} else {
					probesHelper.probes = probes;
					probesHelper.update();
					probesHelper.visible = params.showProbes;
				}

			} while (bakeQueued);

			isBaking = false;
		}

		function setShadowsEnabled(enabled: boolean) {
			if (!renderer || !dirLight) return;
			renderer.shadowMap.enabled = enabled;
			dirLight.castShadow = enabled;
		}

		updateLightPosition();

		gui = new GUI();
		gui.add(params, 'enabled').name('GI').onChange((value: boolean) => {
			if (probes) probes.visible = value;
		});

		gui.add(params, 'lightAzimuth', -180, 180, 1).name('Light Azimuth').onChange(() => {
			updateLightPosition();
			scheduleRebake();
		});
		gui.add(params, 'lightElevation', 5, 85, 1).name('Light Elevation').onChange(() => {
			updateLightPosition();
			scheduleRebake();
		});
		gui.add(params, 'lightIntensity', 0, 100, 0.1).name('Light Intensity').onChange((value: number) => {
			if (dirLight) dirLight.intensity = value;
			scheduleRebake();
		});
		gui.add(params, 'shadows').name('Shadows').onChange((value: boolean) => {
			setShadowsEnabled(value);
			scheduleRebake();
		});

		gui.add(params, 'countX', 2, 32, 1).name('Probes X').onChange(scheduleRebake);
		gui.add(params, 'countY', 2, 16, 1).name('Probes Y').onChange(scheduleRebake);
		gui.add(params, 'countZ', 2, 16, 1).name('Probes Z').onChange(scheduleRebake);
		gui.add(params, 'bounces', 0, 2, 1).name('Bounces').onChange(scheduleRebake);

		gui.add(params, 'showProbes').name('Show Probes').onChange((value: boolean) => {
			if (probesHelper) probesHelper.visible = value;
		});
		gui.add(params, 'probeSize', 0.05, 2.0, 0.05).name('Probe Size').onChange((value: number) => {
			if (probesHelper) {
				scene.remove(probesHelper);
				probesHelper.dispose();
				probesHelper = new LightProbeGridHelper(probes, value);
				probesHelper.visible = params.showProbes;
				scene.add(probesHelper);
			}
		});

		gui.add({ log: () => {
			console.log('position:', camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2));
			console.log('rotation:', camera.rotation.x.toFixed(4), camera.rotation.y.toFixed(4), camera.rotation.z.toFixed(4));
		} }, 'log').name('Log Camera');

		setShadowsEnabled(params.shadows);
		await bakeWithSettings();

		window.addEventListener('resize', onWindowResize);
	}

	async function getSponzaModelURL() {
		const response = await fetch(MODEL_INDEX_URL);
		const models = await response.json();
		const sponzaInfo = models.find((model: { name: string }) => model.name === 'Sponza');

		if (!sponzaInfo) {
			throw new Error('Sponza entry was not found in the glTF sample model index.');
		}

		const variants = sponzaInfo.variants || {};
		const variantName = variants['glTF-Binary'] || variants['glTF'] || variants['glTF-Embedded'] || Object.values(variants)[0];

		if (!variantName) {
			throw new Error('Sponza has no supported glTF variant in the model index.');
		}

		const variantFolder = (variantName as string).endsWith('.glb') ? 'glTF-Binary' : 'glTF';
		return `${SAMPLE_ASSETS_BASE_URL}${sponzaInfo.name}/${variantFolder}/${variantName}`;
	}

	function onWindowResize() {
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	function animate(timestamp: number) {
		timer.update(timestamp);
		controls.update(timer.getDelta());
		renderer.render(scene, camera);
	}

	// Initialize
	init().then(() => {
		renderer.setAnimationLoop(animate);
	});

	// Cleanup function
	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize);
		renderer.setAnimationLoop(null);
		if (gui) gui.destroy();
		if (probes) probes.dispose();
		if (probesHelper) probesHelper.dispose();
		controls.dispose();
		renderer.dispose();
		container.removeChild(renderer.domElement);
		if (infoEl.parentNode) container.removeChild(infoEl);
		if (progressBar.parentNode) container.removeChild(progressBar);
	};
};

export default function WebGLLightProbesSponza() {
	return (
		<div
			ref={(el) => {
				if (el) init3D(el);
			}}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}