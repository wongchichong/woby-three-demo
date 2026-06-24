/** @jsxImportSource woby */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

const vertexShader = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize(vWorldPosition + offset).y;
  gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
}`

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const W = container.clientWidth || window.innerWidth
    const H = container.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const bgColor = new THREE.Color().setHSL(0.6, 0, 1)
    const scene = new THREE.Scene()
    scene.background = bgColor
    scene.fog = new THREE.Fog(bgColor, 1, 5000)

    const camera = new THREE.PerspectiveCamera(30, W / H, 1, 5000)
    camera.position.set(0, 0, 250)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2)
    hemiLight.color.setHSL(0.6, 1, 0.6)
    hemiLight.groundColor.setHSL(0.095, 1, 0.75)
    hemiLight.position.set(0, 50, 0)
    scene.add(hemiLight)
    const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10)
    scene.add(hemiLightHelper)

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.color.setHSL(0.1, 1, 0.95)
    dirLight.position.set(-1, 1.75, 1).multiplyScalar(30)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    const d = 50
    dirLight.shadow.camera.left = -d; dirLight.shadow.camera.right = d
    dirLight.shadow.camera.top = d; dirLight.shadow.camera.bottom = -d
    dirLight.shadow.camera.far = 3500
    dirLight.shadow.bias = -0.0001
    scene.add(dirLight)
    const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10)
    scene.add(dirLightHelper)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(10000, 10000),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    )
    ;(ground.material as THREE.MeshLambertMaterial).color.setHSL(0.095, 1, 0.75)
    ground.position.y = -33
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const uniforms = {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 },
    }
    uniforms.topColor.value.copy(hemiLight.color)
    ;(scene.fog as THREE.Fog).color.copy(uniforms.bottomColor.value)
    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(4000, 32, 15),
        new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: THREE.BackSide })
    )
    scene.add(sky)

    const mixers: THREE.AnimationMixer[] = []
    new GLTFLoader().load('models/gltf/Flamingo.glb', (gltf) => {
        const mesh = gltf.scene.children[0] as THREE.Mesh
        mesh.scale.set(0.35, 0.35, 0.35)
        mesh.position.y = 15
        mesh.rotation.y = -1
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)
        const mixer = new THREE.AnimationMixer(mesh)
        mixer.clipAction(gltf.animations[0]).setDuration(1).play()
        mixers.push(mixer)
    })

    const params = {
        toggleHemisphereLight: () => { hemiLight.visible = !hemiLight.visible; hemiLightHelper.visible = !hemiLightHelper.visible },
        toggleDirectionalLight: () => { dirLight.visible = !dirLight.visible; dirLightHelper.visible = !dirLightHelper.visible },
        shadowIntensity: 1,
    }
    const gui = new GUI()
    gui.add(params, 'toggleHemisphereLight').name('toggle hemisphere light')
    gui.add(params, 'toggleDirectionalLight').name('toggle directional light')
    gui.add(params, 'shadowIntensity', 0, 1).name('shadow intensity').onChange((v: number) => { dirLight.shadow.intensity = v })
    gui.open()

    const clock = new THREE.Clock()
    let animId = 0
    const animate = () => {
        animId = requestAnimationFrame(animate)
        const delta = clock.getDelta()
        for (let i = 0; i < mixers.length; i++) mixers[i].update(delta)
        renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
        const nW = container.clientWidth || window.innerWidth
        const nH = container.clientHeight || window.innerHeight
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        gui.destroy()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLLightsHemisphere2 = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)

export default WebGLLightsHemisphere2
