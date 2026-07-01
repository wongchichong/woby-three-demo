/** @jsxImportSource woby */

import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const params = {
    autoRotate: true,
    metalness: 1.0,
    roughness: 0.0,
    exposure: 1.0,
    resolution: '2k',
    type: 'HalfFloatType'
};

let _cleanupFn: (() => void) | undefined;

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined; }

    let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera,
        controls: OrbitControls, torusMesh: THREE.Mesh, loader: UltraHDRLoader;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = params.exposure;

    renderer.setAnimationLoop(render);

    scene = new THREE.Scene();

    torusMesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.4, 128, 128, 1, 3),
        new THREE.MeshStandardMaterial({ roughness: params.roughness, metalness: params.metalness })
    );
    scene.add(torusMesh);

    camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        1,
        500
    );
    camera.position.set(0.0, 0.0, -6.0);

    controls = new OrbitControls(camera, renderer.domElement);

    loader = new UltraHDRLoader();
    loader.setDataType(THREE.FloatType);

    const loadEnvironment = (resolution: string = '2k', type: string = 'HalfFloatType') => {

        loader.setDataType(THREE[type as keyof typeof THREE] as any);

        loader.load(`https://threejs.org/examples/textures/equirectangular/spruit_sunrise_${resolution}.hdr.jpg`, (texture) => {

            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.needsUpdate = true;

            scene.background = texture;
            scene.environment = texture;

        });

    };

    loadEnvironment(params.resolution, params.type);

    const gui = new GUI();

    gui.add(params, 'autoRotate');
    gui.add(params, 'metalness', 0, 1, 0.01);
    gui.add(params, 'roughness', 0, 1, 0.01);
    gui.add(params, 'exposure', 0, 4, 0.01);
    gui.add(params, 'resolution', ['2k', '4k']).onChange((value: string) => {

        loadEnvironment(value, params.type);

    });
    gui.add(params, 'type', ['HalfFloatType', 'FloatType']).onChange((value: string) => {

        loadEnvironment(params.resolution, value);

    });

    gui.open();

    function onWindowResize() {

        camera.aspect = container.clientWidth / container.clientHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);

    }

    window.addEventListener('resize', onWindowResize);

    function render() {

        torusMesh.material.roughness = params.roughness;
        torusMesh.material.metalness = params.metalness;

        if (params.autoRotate) {

            torusMesh.rotation.y += 0.005;

        }

        renderer.toneMappingExposure = params.exposure;

        controls.update();

        renderer.render(scene, camera);

    }

    _cleanupFn = () => {
        renderer.setAnimationLoop(null);
        window.removeEventListener('resize', onWindowResize);
        controls.dispose();
        gui.destroy();
        torusMesh.geometry.dispose();
        (torusMesh.material as THREE.Material).dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
};

export const WebGLLoaderTextureUltraHDR = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el); }} style={{ width: '100%', height: '100%' }} />
);

export default WebGLLoaderTextureUltraHDR;
