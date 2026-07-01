/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_3dtiles

import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TileCreasedNormalsPlugin } from '@woby/three/examples/jsm/misc/TileCreasedNormalsPlugin';
import { TilesRenderer, GlobeControls, CAMERA_FRAME } from '3d-tiles-renderer';
import { CesiumIonAuthPlugin } from '3d-tiles-renderer/core/plugins';
import { GLTFExtensionsPlugin, TilesFadePlugin, UpdateOnChangePlugin } from '3d-tiles-renderer/three/plugins';
import { EffectComposer, EffectPass, RenderPass, SMAAEffect } from 'postprocessing';

// Ion key provided by Cesium for use on threejs.org
const ION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMTFiZTRmZS1mMWIxLTQ5YzYtYjA4Zi0xYTE0MjFmYzQ5OGYiLCJpZCI6MjY3NzgzLCJpYXQiOjE3MzY0NzQxMDh9.ppGPgpse1lq7QeNyljX7THUyK5w1x_4HksSHSlhe5sY';

let _cleanupFn: (() => void) | undefined;

const init3D = async (container: HTMLElement) => {
	if (_cleanupFn) {
		_cleanupFn();
		_cleanupFn = undefined;
	}

	let camera: THREE.PerspectiveCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let tiles: TilesRenderer;
	let controls: GlobeControls;
	let composer: EffectComposer;

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 1e6);

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	container.appendChild(renderer.domElement);

	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

	const DEG2RAD = Math.PI / 180;

	tiles = new TilesRenderer();
	tiles.registerPlugin(new CesiumIonAuthPlugin({ apiToken: ION_KEY, assetId: '2275207', autoRefreshToken: true }));
	tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader }));
	tiles.registerPlugin(new TileCreasedNormalsPlugin({ creaseAngle: 30 * DEG2RAD }));
	tiles.registerPlugin(new TilesFadePlugin());
	tiles.registerPlugin(new UpdateOnChangePlugin());
	tiles.setCamera(camera);
	tiles.setResolutionFromRenderer(camera, renderer);

	scene.add(tiles.group);

	tiles.ellipsoid.getObjectFrame(
		35.6812 * DEG2RAD, 139.80 * DEG2RAD, 500,
		-90 * DEG2RAD, -10 * DEG2RAD, 0,
		camera.matrix, CAMERA_FRAME
	);
	camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

	controls = new GlobeControls(scene, camera, renderer.domElement);
	controls.setEllipsoid(tiles.ellipsoid, tiles.group);
	controls.enableDamping = true;
	controls.adjustHeight = false;

	function enableAdjustHeight() {
		controls.adjustHeight = true;
		renderer.domElement.removeEventListener('pointerdown', enableAdjustHeight);
		renderer.domElement.removeEventListener('wheel', enableAdjustHeight);
	}

	renderer.domElement.addEventListener('pointerdown', enableAdjustHeight);
	renderer.domElement.addEventListener('wheel', enableAdjustHeight);

	// Postprocessing
	composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(new EffectPass(camera, new SMAAEffect()));

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		composer.setSize(window.innerWidth, window.innerHeight);

		tiles.setResolutionFromRenderer(camera, renderer);
	}

	window.addEventListener('resize', onWindowResize);
	onWindowResize();

	function animate() {
		controls.update();
		tiles.update();
		composer.render();
	}

	renderer.setAnimationLoop(animate);

	_cleanupFn = () => {
		window.removeEventListener('resize', onWindowResize);
		renderer.setAnimationLoop(null);
		tiles.dispose();
		controls.dispose();
		composer.dispose();
		renderer.dispose();
		container.removeChild(renderer.domElement);
	};
};

export default function WebGLLoader3DTiles() {
	return (
		<div
			ref={(el) => {
				if (el) init3D(el);
			}}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}
