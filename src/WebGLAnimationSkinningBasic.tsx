/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_skinning_basic

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222233)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 3, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 1, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))

    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ color: 0x334455, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -2
    ground.receiveShadow = true
    scene.add(ground)

    // Build skinned mesh procedurally
    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8, 8)
    const bones: THREE.Bone[] = []
    const boneHeights = [0, 1, 2, 3, 3.5]
    const boneNames = ['root', 'spine', 'chest', 'neck', 'head']
    for (let i = 0; i < 5; i++) {
        const bone = new THREE.Bone()
        bone.name = boneNames[i]
        bones.push(bone)
    }
    for (let i = 1; i < bones.length; i++) {
        bones[i - 1].add(bones[i])
        bones[i].position.y = boneHeights[i] - boneHeights[i - 1]
    }
    bones[0].position.y = -2

    const positionAttr = geometry.attributes.position
    const vertexCount = positionAttr.count
    const skinIndices: number[] = []
    const skinWeights: number[] = []
    for (let i = 0; i < vertexCount; i++) {
        const y = positionAttr.getY(i)
        const normalizedY = y + 2
        let boneIdx0 = 0, boneIdx1 = 1, weight0 = 1.0, weight1 = 0.0
        if (normalizedY <= 1.0) {
            boneIdx0 = 0; boneIdx1 = 1; weight1 = normalizedY / 1.0; weight0 = 1.0 - weight1
        } else if (normalizedY <= 2.0) {
            boneIdx0 = 1; boneIdx1 = 2; weight1 = (normalizedY - 1.0) / 1.0; weight0 = 1.0 - weight1
        } else if (normalizedY <= 3.0) {
            boneIdx0 = 2; boneIdx1 = 3; weight1 = (normalizedY - 2.0) / 1.0; weight0 = 1.0 - weight1
        } else {
            boneIdx0 = 3; boneIdx1 = 4; weight1 = (normalizedY - 3.0) / 0.5
            weight0 = 1.0 - Math.min(weight1, 1.0); weight1 = Math.min(weight1, 1.0)
        }
        skinIndices.push(boneIdx0, boneIdx1, 0, 0)
        skinWeights.push(weight0, weight1, 0, 0)
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

    const material = new THREE.MeshPhongMaterial({ color: 0x8888ff, side: THREE.DoubleSide })
    const mesh = new THREE.SkinnedMesh(geometry, material)
    mesh.castShadow = true
    const skeleton = new THREE.Skeleton(bones)
    mesh.add(bones[0])
    mesh.bind(skeleton)
    scene.add(mesh)
    const skeletonHelper = new THREE.SkeletonHelper(mesh)
    scene.add(skeletonHelper)

    const duration = 3.0
    const spineTrack = new THREE.NumberKeyframeTrack(`${boneNames[1]}.rotation[z]`, [0, 0.75, 1.5, 2.25, 3.0], [0, 0.3, 0, -0.3, 0])
    const chestTrack = new THREE.NumberKeyframeTrack(`${boneNames[2]}.rotation[y]`, [0, 1.5, 3.0], [0.2, -0.2, 0.2])
    const headTrack = new THREE.NumberKeyframeTrack(`${boneNames[3]}.rotation[x]`, [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0], [0, 0.2, 0, -0.15, 0, 0.2, 0])
    const clip = new THREE.AnimationClip('sway', duration, [spineTrack, chestTrack, headTrack])
    const mixer = new THREE.AnimationMixer(mesh)
    const action = mixer.clipAction(clip)
    action.play()

    const params = { speed: 1.0, paused: false }
    const clock = new THREE.Clock()

    const panel = new GUI()
    panel.add(params, 'speed', 0.1, 3.0, 0.05).name('Animation Speed').onChange((v: number) => { mixer.timeScale = v })
    panel.add(params, 'paused').name('Pause').onChange((v: boolean) => { action.paused = v })
    panel.open()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const delta = clock.getDelta()
        if (!params.paused) mixer.update(delta)
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        panel.destroy()
        controls.dispose()
        mixer.stopAllAction()
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationSkinningBasic() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
