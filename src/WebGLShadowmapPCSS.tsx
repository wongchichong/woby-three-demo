/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

// PCSS chunk patch (adapted from three.js example webgl_shadowmap_pcss).
// Replaces the shadow getShadow function with a blocker-search + variable-radius PCF.
const PCSS = /* glsl */`
#define LIGHT_WORLD_SIZE 0.005
#define LIGHT_FRUSTUM_WIDTH 3.75
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
#define NEAR_PLANE 9.5
#define NUM_SAMPLES 17
#define NUM_RINGS 11
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES

vec2 poissonDisk[NUM_SAMPLES];

void initPoissonSamples(const in vec2 randomSeed) {
    float ANGLE_STEP = PI2 * float(NUM_RINGS) / float(NUM_SAMPLES);
    float INV_NUM_SAMPLES = 1.0 / float(NUM_SAMPLES);
    float angle = rand(randomSeed) * PI2;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;
    for (int i = 0; i < NUM_SAMPLES; i++) {
        poissonDisk[i] = vec2(cos(angle), sin(angle)) * pow(radius, 0.75);
        radius += radiusStep;
        angle += ANGLE_STEP;
    }
}

float penumbraSize(const in float zReceiver, const in float zBlocker) {
    return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker(sampler2D shadowMap, const in vec2 uv, const in float zReceiver) {
    float searchRadius = LIGHT_SIZE_UV * (zReceiver - NEAR_PLANE) / zReceiver;
    float blockerDepthSum = 0.0;
    int numBlockers = 0;
    for (int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++) {
        float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
        if (shadowMapDepth < zReceiver) {
            blockerDepthSum += shadowMapDepth;
            numBlockers++;
        }
    }
    if (numBlockers == 0) return -1.0;
    return blockerDepthSum / float(numBlockers);
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius) {
    float sum = 0.0;
    for (int i = 0; i < PCF_NUM_SAMPLES; i++) {
        float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * filterRadius));
        if (zReceiver <= depth) sum += 1.0;
    }
    for (int i = 0; i < PCF_NUM_SAMPLES; i++) {
        float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + -poissonDisk[i].yx * filterRadius));
        if (zReceiver <= depth) sum += 1.0;
    }
    return sum / (2.0 * float(PCF_NUM_SAMPLES));
}

float PCSS(sampler2D shadowMap, vec4 coords) {
    vec2 uv = coords.xy;
    float zReceiver = coords.z;
    initPoissonSamples(uv);
    float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver);
    if (avgBlockerDepth == -1.0) return 1.0;
    float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
    float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;
    return PCF_Filter(shadowMap, uv, zReceiver, filterRadius);
}
`

const PCSSGetShadow = /* glsl */`
return PCSS(shadowMap, shadowCoord);
`

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    // Save originals to restore on cleanup
    const originalShadowParsFragment = THREE.ShaderChunk.shadowmap_pars_fragment
    const originalShadowmapPars = originalShadowParsFragment

    // Inject PCSS code at top of shadowmap_pars_fragment, and override the
    // PCF function called inside getShadow.
    THREE.ShaderChunk.shadowmap_pars_fragment =
        originalShadowParsFragment
            .replace(
                '#ifdef USE_SHADOWMAP',
                '#ifdef USE_SHADOWMAP\n' + PCSS
            )
            .replace(
                '#if defined( SHADOWMAP_TYPE_PCF )',
                PCSSGetShadow + '\n#if defined( SHADOWMAP_TYPE_PCF )'
            )

    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x303030)
    scene.fog = new THREE.Fog(0x303030, 10, 40)

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 100)
    camera.position.set(7, 7, 10)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1, 0)
    controls.update()

    scene.add(new THREE.AmbientLight(0xffffff, 0.3))

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
    dirLight.position.set(6, 8, 4)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    const sc = dirLight.shadow.camera
    sc.near = 0.5; sc.far = 40
    sc.left = -8; sc.right = 8
    sc.top = 8; sc.bottom = -8
    dirLight.shadow.bias = -0.0005
    scene.add(dirLight)

    // Ground
    const groundGeo = new THREE.PlaneGeometry(40, 40)
    const groundMat = new THREE.MeshPhongMaterial({ color: 0xa0a0a0 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Stacked boxes
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)
    const boxMats: THREE.Material[] = []
    const colors = [0xff5566, 0x66cc66, 0xffcc33, 0x44aaff, 0xaa66ff]
    const boxes: THREE.Mesh[] = []
    for (let i = 0; i < 5; i++) {
        const mat = new THREE.MeshPhongMaterial({ color: colors[i] })
        boxMats.push(mat)
        const box = new THREE.Mesh(boxGeo, mat)
        box.position.set(-2.5 + i * 1.2, 0.5 + (i % 2) * 0.6, 0)
        box.castShadow = true; box.receiveShadow = true
        scene.add(box)
        boxes.push(box)
    }

    // Floating spheres
    const sphereGeo = new THREE.SphereGeometry(0.55, 32, 16)
    const sphereMat = new THREE.MeshPhongMaterial({ color: 0xffffff })
    const spheres: THREE.Mesh[] = []
    for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(sphereGeo, sphereMat)
        s.position.set(-3 + i * 2, 2.4 + (i % 2) * 0.4, 2)
        s.castShadow = true; s.receiveShadow = true
        scene.add(s)
        spheres.push(s)
    }

    let animId = 0
    const clock = new THREE.Clock()
    const animate = () => {
        animId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()
        spheres.forEach((s, i) => {
            s.position.y = 2.4 + Math.sin(t * 1.2 + i) * 0.3
        })
        controls.update()
        renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
        const W = container.clientWidth
        const H = container.clientHeight
        camera.aspect = W / H
        camera.updateProjectionMatrix()
        renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        groundGeo.dispose(); groundMat.dispose()
        boxGeo.dispose(); boxMats.forEach(m => m.dispose())
        sphereGeo.dispose(); sphereMat.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        // Critical: restore original shadow chunk so other demos aren't affected
        THREE.ShaderChunk.shadowmap_pars_fragment = originalShadowmapPars
    }
}

export const WebGLShadowmapPCSS = () => (
    <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
)
export default WebGLShadowmapPCSS
