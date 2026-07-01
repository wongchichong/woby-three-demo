/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_walk_blend

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x88aabb)
    scene.fog = new THREE.Fog(0x88aabb, 20, 100)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(0, 5, 15)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 2, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshLambertMaterial({ color: 0x446633 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Procedural character
    const root = new THREE.Group()
    scene.add(root)

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.25, 1.2, 12),
        new THREE.MeshLambertMaterial({ color: 0x4488cc })
    )
    body.position.set(0, 2.2, 0)
    body.castShadow = true
    root.add(body)

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xffcc99 })
    )
    head.position.set(0, 3.1, 0)
    head.castShadow = true
    root.add(head)

    const leftArm = new THREE.Group()
    leftArm.position.set(-0.45, 2.7, 0)
    const leftArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8),
        new THREE.MeshLambertMaterial({ color: 0x4488cc })
    )
    leftArmMesh.position.y = -0.45
    leftArmMesh.castShadow = true
    leftArm.add(leftArmMesh)
    root.add(leftArm)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.45, 2.7, 0)
    const rightArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8),
        new THREE.MeshLambertMaterial({ color: 0x4488cc })
    )
    rightArmMesh.position.y = -0.45
    rightArmMesh.castShadow = true
    rightArm.add(rightArmMesh)
    root.add(rightArm)

    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.2, 1.6, 0)
    const leftLegMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 1.0, 8),
        new THREE.MeshLambertMaterial({ color: 0x4488cc })
    )
    leftLegMesh.position.y = -0.5
    leftLegMesh.castShadow = true
    leftLeg.add(leftLegMesh)
    root.add(leftLeg)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.2, 1.6, 0)
    const rightLegMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 1.0, 8),
        new THREE.MeshLambertMaterial({ color: 0x4488cc })
    )
    rightLegMesh.position.y = -0.5
    rightLegMesh.castShadow = true
    rightLeg.add(rightLegMesh)
    root.add(rightLeg)

    const params = { speed: 1.0, walkRadius: 5 }

    const panel = new GUI()
    panel.add(params, 'speed', 0, 3, 0.1)
    panel.add(params, 'walkRadius', 1, 10, 0.5)

    const clock = new THREE.Clock()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const t = clock.getElapsedTime() * params.speed
        const walkCycle = Math.sin(t * 3)
        leftLeg.rotation.x = walkCycle * 0.6
        rightLeg.rotation.x = -walkCycle * 0.6
        leftArm.rotation.x = -walkCycle * 0.4
        rightArm.rotation.x = walkCycle * 0.4
        body.rotation.z = Math.sin(t * 6) * 0.05
        const angle = t * 0.3
        root.position.x = Math.cos(angle) * params.walkRadius
        root.position.z = Math.sin(angle) * params.walkRadius
        root.rotation.y = -angle + Math.PI / 2
        root.position.y = Math.abs(Math.sin(t * 3)) * 0.1
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
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationWalkBlend() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
