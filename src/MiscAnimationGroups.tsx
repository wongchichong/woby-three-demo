/** @jsxImportSource woby */
// https://threejs.org/examples/#misc_animation_groups

import * as THREE from 'three'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 1000)
    camera.position.set(50, 50, 100)
    camera.lookAt(scene.position)

    // all objects of this animation group share a common animation state
    const animationGroup = new THREE.AnimationObjectGroup()

    const geometry = new THREE.BoxGeometry(5, 5, 5)
    const material = new THREE.MeshBasicMaterial({ transparent: true })

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.x = 32 - (16 * i)
            mesh.position.y = 0
            mesh.position.z = 32 - (16 * j)
            scene.add(mesh)
            animationGroup.add(mesh)
        }
    }

    // create some keyframe tracks
    const xAxis = new THREE.Vector3(1, 0, 0)
    const qInitial = new THREE.Quaternion().setFromAxisAngle(xAxis, 0)
    const qFinal = new THREE.Quaternion().setFromAxisAngle(xAxis, Math.PI)
    const quaternionKF = new THREE.QuaternionKeyframeTrack(
        '.quaternion',
        [0, 1, 2],
        [qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w, qInitial.x, qInitial.y, qInitial.z, qInitial.w]
    )

    const colorKF = new THREE.ColorKeyframeTrack(
        '.material.color',
        [0, 1, 2],
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        THREE.InterpolateDiscrete
    )
    const opacityKF = new THREE.NumberKeyframeTrack('.material.opacity', [0, 1, 2], [1, 0, 1])

    const clip = new THREE.AnimationClip('default', 3, [quaternionKF, colorKF, opacityKF])

    const mixer = new THREE.AnimationMixer(animationGroup)
    mixer.clipAction(clip).play()

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const clock = new THREE.Clock()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const delta = clock.getDelta()
        mixer.update(delta)
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function MiscAnimationGroups() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
