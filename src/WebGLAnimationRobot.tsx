/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_robot

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 60)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(6, 5, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 20
    controls.target.set(0, 2, 0)

    scene.add(new THREE.AmbientLight(0x404060, 2))

    const dirLight = new THREE.DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

    const pointLight = new THREE.PointLight(0x4488ff, 2, 15)
    pointLight.position.set(-3, 4, -3)
    scene.add(pointLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshPhongMaterial({ color: 0x16213e, depthWrite: false })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    scene.add(new THREE.GridHelper(30, 30, 0x223366, 0x223366))

    // Target sphere
    const targetMat = new THREE.MeshPhongMaterial({ color: 0x00ffaa, emissive: new THREE.Color(0x00aa66), emissiveIntensity: 0.8, shininess: 200 })
    const target = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), targetMat)
    target.position.set(0, 3.5, 0)
    const targetLight = new THREE.PointLight(0x00ffaa, 1.5, 4)
    target.add(targetLight)
    scene.add(target)

    // Robot arm hierarchy
    const shoulder = new THREE.Group()
    shoulder.position.set(0, 0.55, 0)
    const shoulderMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16),
        new THREE.MeshPhongMaterial({ color: 0x2255aa, shininess: 150 })
    )
    shoulderMesh.castShadow = true
    shoulder.add(shoulderMesh)

    const armUpper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 2.0, 12),
        new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 120 })
    )
    armUpper.position.y = 1.15
    armUpper.castShadow = true
    shoulder.add(armUpper)

    const elbow = new THREE.Group()
    elbow.position.set(0, 2.3, 0)
    const elbowJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 12),
        new THREE.MeshPhongMaterial({ color: 0x2255aa, shininess: 150 })
    )
    elbowJoint.castShadow = true
    elbow.add(elbowJoint)

    const armLower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.20, 1.6, 12),
        new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 120 })
    )
    armLower.position.y = 0.9
    armLower.castShadow = true
    elbow.add(armLower)

    const wrist = new THREE.Group()
    wrist.position.set(0, 1.8, 0)
    const wristJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 16, 12),
        new THREE.MeshPhongMaterial({ color: 0x2255aa, shininess: 150 })
    )
    wristJoint.castShadow = true
    wrist.add(wristJoint)

    const gripperGroup = new THREE.Group()
    gripperGroup.position.set(0, 0.25, 0)
    const gripperBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.25),
        new THREE.MeshPhongMaterial({ color: 0x444455, shininess: 80 })
    )
    gripperBase.castShadow = true
    gripperGroup.add(gripperBase)

    const fingerLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.4, 0.09),
        new THREE.MeshPhongMaterial({ color: 0xcc4422, shininess: 100 })
    )
    fingerLeft.position.set(-0.12, 0.28, 0)
    fingerLeft.castShadow = true
    gripperGroup.add(fingerLeft)

    const fingerRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.4, 0.09),
        new THREE.MeshPhongMaterial({ color: 0xcc4422, shininess: 100 })
    )
    fingerRight.position.set(0.12, 0.28, 0)
    fingerRight.castShadow = true
    gripperGroup.add(fingerRight)

    wrist.add(gripperGroup)
    elbow.add(wrist)
    shoulder.add(elbow)

    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.0, 0.4, 16),
        new THREE.MeshPhongMaterial({ color: 0x444455, shininess: 80 })
    )
    base.position.y = 0.2
    base.castShadow = true
    base.receiveShadow = true
    base.add(shoulder)
    scene.add(base)

    const params = {
        shoulderSpeed: 0.6,
        armFlex: 0.5,
        gripperOpen: 0.5,
        targetRadius: 2.5,
        targetHeight: 3.5,
        autoAnimate: true,
    }

    const panel = new GUI({ title: 'Robot Arm' })
    panel.add(params, 'shoulderSpeed', 0, 2, 0.01).name('Shoulder Speed')
    panel.add(params, 'armFlex', 0, 1.2, 0.01).name('Arm Flex Amplitude')
    panel.add(params, 'gripperOpen', 0, 1, 0.01).name('Gripper Open')
    panel.add(params, 'targetRadius', 0.5, 5, 0.1).name('Target Radius')
    panel.add(params, 'targetHeight', 1, 6, 0.1).name('Target Height')
    panel.add(params, 'autoAnimate').name('Auto Animate')

    const clock = new THREE.Clock()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const elapsed = clock.getElapsedTime()
        if (params.autoAnimate) {
            shoulder.rotation.y = elapsed * params.shoulderSpeed
            const elbowAngle = Math.sin(elapsed * 1.1) * params.armFlex * 0.5
            elbow.rotation.z = elbowAngle - 0.3
            const forearmAngle = Math.sin(elapsed * 1.4 + 1.0) * params.armFlex * 0.6 + 0.2
            wrist.rotation.z = forearmAngle
            wrist.rotation.y = Math.sin(elapsed * 0.9) * 0.4
            const autoGrip = (Math.sin(elapsed * 2.0) * 0.5 + 0.5) * 0.15
            const gripOffset = params.gripperOpen * 0.18 + autoGrip
            fingerLeft.position.x = -(0.12 + gripOffset)
            fingerRight.position.x = (0.12 + gripOffset)
            const tx = Math.cos(elapsed * 0.7) * params.targetRadius
            const tz = Math.sin(elapsed * 1.1) * params.targetRadius * 0.6
            const ty = params.targetHeight + Math.sin(elapsed * 1.3) * 0.8
            target.position.set(tx, ty, tz)
            targetMat.emissiveIntensity = 0.5 + 0.5 * Math.sin(elapsed * 3.0)
        } else {
            const gripOffset = params.gripperOpen * 0.18
            fingerLeft.position.x = -(0.12 + gripOffset)
            fingerRight.position.x = (0.12 + gripOffset)
        }
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

export default function WebGLAnimationRobot() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
