/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_blend

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x202030)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 2, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(3, 5, 2)
    scene.add(dirLight)

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x88aaff })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const mixer = new THREE.AnimationMixer(mesh)

    const qA = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0)
    const qB = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
    const qC = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2)
    const rotTrack = new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1, 2], [qA.x, qA.y, qA.z, qA.w, qB.x, qB.y, qB.z, qB.w, qC.x, qC.y, qC.z, qC.w])
    const rotClip = new THREE.AnimationClip('rotate', 2, [rotTrack])
    const scaleTrack = new THREE.VectorKeyframeTrack('.scale', [0, 1, 2], [1, 1, 1, 1.5, 0.5, 1.5, 1, 1, 1])
    const scaleClip = new THREE.AnimationClip('scale', 2, [scaleTrack])
    const rotAction = mixer.clipAction(rotClip); rotAction.play()
    const scaleAction = mixer.clipAction(scaleClip); scaleAction.play()

    const params = { rotateWeight: 1, scaleWeight: 1 }
    const clock = new THREE.Clock()

    const panel = new GUI()
    panel.add(params, 'rotateWeight', 0, 1).onChange((v: number) => rotAction.setEffectiveWeight(v))
    panel.add(params, 'scaleWeight', 0, 1).onChange((v: number) => scaleAction.setEffectiveWeight(v))

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        mixer.update(clock.getDelta())
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
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationBlend() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}