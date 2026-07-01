/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_ldraw

import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';

let _cleanupFn: (() => void) | undefined;

const ldrawPath = 'https://threejs.org/examples/models/ldraw/officialLibrary/';

const modelFileList: Record<string, string> = {
	'Car': 'models/car.ldr_Packed.mpd',
	'Lunar Vehicle': 'models/1621-1-LunarMPVVehicle.mpd_Packed.mpd',
	'Radar Truck': 'models/889-1-RadarTruck.mpd_Packed.mpd',
	'Trailer': 'models/4838-1-MiniVehicles.mpd_Packed.mpd',
	'Bulldozer': 'models/4915-1-MiniConstruction.mpd_Packed.mpd',
	'Helicopter': 'models/4918-1-MiniFlyers.mpd_Packed.mpd',
	'Plane': 'models/5935-1-IslandHopper.mpd_Packed.mpd',
	'Lighthouse': 'models/30023-1-Lighthouse.ldr_Packed.mpd',
	'X-Wing mini': 'models/30051-1-X-wingFighter-Mini.mpd_Packed.mpd',
	'AT-ST mini': 'models/30054-1-AT-ST-Mini.mpd_Packed.mpd',
	'AT-AT mini': 'models/4489-1-AT-AT-Mini.mpd_Packed.mpd',
	'Shuttle': 'models/4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
	'TIE Interceptor': 'models/6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd',
	'Star fighter': 'models/6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
	'X-Wing': 'models/7140-1-X-wingFighter.mpd_Packed.mpd',
	'AT-ST': 'models/10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd',
	'Window': 'models/6156-1-WindowBrick.mpd_Packed.mpd'
};

const init3D = (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn();
		_cleanupFn = undefined;
	}

	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let gui: GUI;
	let guiData: {
		modelFileName: string;
		displayLines: boolean;
		conditionalLines: boolean;
		smoothNormals: boolean;
		buildingStep: number;
		noBuildingSteps: string;
		flatColors: boolean;
		mergeModel: boolean;
	};

	let model: THREE.Group | null = null;
	let progressBarDiv: HTMLDivElement;

	// Camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.set(150, 200, 250);

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true, outputColorSpace: THREE.SRGBColorSpace });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	container.appendChild(renderer.domElement);

	// Scene
	const pmremGenerator = new THREE.PMREMGenerator(renderer);

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xdeebed);
	scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

	// Controls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;

	// GUI Data
	guiData = {
		modelFileName: modelFileList['Car'],
		displayLines: true,
		conditionalLines: true,
		smoothNormals: true,
		buildingStep: 0,
		noBuildingSteps: 'No steps.',
		flatColors: false,
		mergeModel: false
	};

	// Progress bar
	progressBarDiv = document.createElement('div');
	progressBarDiv.innerText = 'Loading...';
	progressBarDiv.style.fontSize = '3em';
	progressBarDiv.style.color = '#888';
	progressBarDiv.style.display = 'block';
	progressBarDiv.style.position = 'absolute';
	progressBarDiv.style.top = '50%';
	progressBarDiv.style.width = '100%';
	progressBarDiv.style.textAlign = 'center';

	// Load the model
	reloadObject(true);

	function updateObjectsVisibility() {
		if (!model) return;

		model.traverse((c) => {
			if ((c as THREE.LineSegments).isLineSegments) {
				if ((c as any).isConditionalLine) {
					c.visible = guiData.conditionalLines;
				} else {
					c.visible = guiData.displayLines;
				}
			} else if ((c as THREE.Group).isGroup) {
				// Hide objects with building step > gui setting
				c.visible = c.userData.buildingStep <= guiData.buildingStep;
			}
		});
	}

	function reloadObject(resetCamera: boolean) {
		if (model) {
			scene.remove(model);
		}

		model = null;
		updateProgressBar(0);
		showProgressBar();

		// Only smooth when not rendering with flat colors to improve processing time
		const lDrawLoader = new LDrawLoader();
		lDrawLoader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
		lDrawLoader.smoothNormals = guiData.smoothNormals && !guiData.flatColors;
		lDrawLoader
			.setPath(ldrawPath)
			.load(guiData.modelFileName, function (group2: THREE.Group) {
				if (model) {
					scene.remove(model);
				}

				model = group2;

				// Demonstrate how to use convert to flat colors to better mimic the lego instructions look
				if (guiData.flatColors) {
					function convertMaterial(material: THREE.Material): THREE.MeshBasicMaterial {
						const sourceMat = material as THREE.MeshStandardMaterial;
						const newMaterial = new THREE.MeshBasicMaterial();
						newMaterial.color.copy(sourceMat.color);
						newMaterial.polygonOffset = sourceMat.polygonOffset;
						newMaterial.polygonOffsetUnits = sourceMat.polygonOffsetUnits;
						newMaterial.polygonOffsetFactor = sourceMat.polygonOffsetFactor;
						newMaterial.opacity = sourceMat.opacity;
						newMaterial.transparent = sourceMat.transparent;
						newMaterial.depthWrite = sourceMat.depthWrite;
						newMaterial.toneMapped = false;

						return newMaterial;
					}

					model.traverse((c) => {
						if ((c as THREE.Mesh).isMesh) {
							const mesh = c as THREE.Mesh;
							if (Array.isArray(mesh.material)) {
								mesh.material = mesh.material.map(convertMaterial);
							} else {
								mesh.material = convertMaterial(mesh.material);
							}
						}
					});
				}

				// Merge model geometries by material
				if (guiData.mergeModel) model = LDrawUtils.mergeObject(model);

				// Convert from LDraw coordinates: rotate 180 degrees around OX
				model.rotation.x = Math.PI;

				scene.add(model);

				guiData.buildingStep = model.userData.numBuildingSteps - 1;

				updateObjectsVisibility();

				// Adjust camera and light
				const bbox = new THREE.Box3().setFromObject(model);
				const size = bbox.getSize(new THREE.Vector3());
				const radius = Math.max(size.x, Math.max(size.y, size.z)) * 0.5;

				if (resetCamera) {
					controls.target0.copy(bbox.getCenter(new THREE.Vector3()));
					controls.position0.set(-2.3, 1, 2).multiplyScalar(radius).add(controls.target0);
					controls.reset();
				}

				createGUI();

				hideProgressBar();
			}, onProgress, onError);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function createGUI() {
		if (gui) {
			gui.destroy();
		}

		gui = new GUI();

		gui.add(guiData, 'modelFileName', modelFileList).name('Model').onFinishChange(function () {
			reloadObject(true);
		});

		gui.add(guiData, 'flatColors').name('Flat Colors').onChange(function () {
			reloadObject(false);
		});

		gui.add(guiData, 'mergeModel').name('Merge model').onChange(function () {
			reloadObject(false);
		});

		if (model && model.userData.numBuildingSteps > 1) {
			gui.add(guiData, 'buildingStep', 0, model.userData.numBuildingSteps - 1).step(1).name('Building step').onChange(updateObjectsVisibility);
		} else {
			gui.add(guiData, 'noBuildingSteps').name('Building step').onChange(updateObjectsVisibility);
		}

		gui.add(guiData, 'smoothNormals').name('Smooth Normals').onChange(function changeNormals() {
			reloadObject(false);
		});

		gui.add(guiData, 'displayLines').name('Display Lines').onChange(updateObjectsVisibility);
		gui.add(guiData, 'conditionalLines').name('Conditional Lines').onChange(updateObjectsVisibility);
	}

	function animate() {
		controls.update();
		render();
	}

	function render() {
		renderer.render(scene, camera);
	}

	function onProgress(xhr: { lengthComputable: boolean; loaded: number; total: number }) {
		if (xhr.lengthComputable) {
			updateProgressBar(xhr.loaded / xhr.total);
			console.log(Math.round(xhr.loaded / xhr.total * 100) + '% downloaded');
		}
	}

	function onError(error: unknown) {
		const message = 'Error loading model';
		progressBarDiv.innerText = message;
		console.log(message);
		console.error(error);
	}

	function showProgressBar() {
		container.appendChild(progressBarDiv);
	}

	function hideProgressBar() {
		container.removeChild(progressBarDiv);
	}

	function updateProgressBar(fraction: number) {
		progressBarDiv.innerText = 'Loading... ' + Math.round(fraction * 100) + '%';
	}

	window.addEventListener('resize', onWindowResize);

	renderer.setAnimationLoop(animate);

	// Cleanup function
	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize);
		renderer.setAnimationLoop(null);
		if (model) {
			model.traverse((child: THREE.Object3D) => {
				if ((child as THREE.Mesh).isMesh) {
					const mesh = child as THREE.Mesh;
					mesh.geometry.dispose();
					if (Array.isArray(mesh.material)) {
						mesh.material.forEach((mat) => mat.dispose());
					} else {
						mesh.material.dispose();
					}
				}
			});
			scene.remove(model);
		}
		if (gui) {
			gui.destroy();
		}
		controls.dispose();
		pmremGenerator.dispose();
		scene.environment?.dispose();
		(scene.background as THREE.Color)?.dispose();
		renderer.dispose();
		container.removeChild(renderer.domElement);
	};
};

export default function WebGLLoaderLDraw() {
	return (
		<div
			ref={(el) => {
				if (el) init3D(el);
			}}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}
