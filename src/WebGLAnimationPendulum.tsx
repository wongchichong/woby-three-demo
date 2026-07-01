/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_pendulum

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111)

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 15)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new THREE.AmbientLight(0xffffff, 1))

    const pivot = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
    )
    scene.add(pivot)

    const arm1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
        new THREE.MeshLambertMaterial({ color: 0xcccccc })
    )
    scene.add(arm1)

    const arm2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
    )
    scene.add(arm2)

    const bob1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0xff4444 })
    )
    scene.add(bob1)

    const bob2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshLambertMaterial({ color: 0x4444ff })
    )
    scene.add(bob2)

    const TRAIL_LEN = 500
    const trailPositions = new Float32Array(TRAIL_LEN * 3)
    let trailCount = 0
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3).setUsage(THREE.DynamicDrawUsage))
    trailGeo.setDrawRange(0, 0)
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.6 }))
    scene.add(trail)

    const params = {
        gravity: 9.8, L1: 3, L2: 3, m1: 1, m2: 1,
        trail: true,
    }
    let a1 = Math.PI / 2, a2 = Math.PI / 2
    let a1v = 0, a2v = 0

    const resetPendulum = () => {
        a1 = Math.PI / 2; a2 = Math.PI / 2; a1v = 0; a2v = 0; trailCount = 0
        trailGeo.setDrawRange(0, 0)
    }

    const stepPhysics = (dt: number) => {
        const g = params.gravity, L1 = params.L1, L2 = params.L2, m1 = params.m1, m2 = params.m2
        const dA = a1 - a2
        const denom1 = (2 * m1 + m2) * L1 - m2 * L1 * Math.cos(2 * dA)
        const denom2 = (L2 / L1) * denom1
        const a1a = (-g * (2 * m1 + m2) * Math.sin(a1)
            - m2 * g * Math.sin(a1 - 2 * a2)
            - 2 * Math.sin(dA) * m2 * (a2v * a2v * L2 + a1v * a1v * L1 * Math.cos(dA))) / denom1
        const a2a = (2 * Math.sin(dA) * (a1v * a1v * L1 * (m1 + m2)
            + g * (m1 + m2) * Math.cos(a1)
            + a2v * a2v * L2 * m2 * Math.cos(dA))) / denom2
        a1v += a1a * dt
        a2v += a2a * dt
        a1 += a1v * dt
        a2 += a2v * dt
    }

    const panel = new GUI()
    panel.add(params, 'gravity', 1, 30, 0.5).name('Gravity')
    panel.add(params, 'L1', 1, 5, 0.1).name('Arm 1 Length')
    panel.add(params, 'L2', 1, 5, 0.1).name('Arm 2 Length')
    panel.add(params, 'trail').name('Show Trail')
    panel.add({ reset: resetPendulum }, 'reset').name('Reset')

    const clock = new THREE.Clock()

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const dt = Math.min(clock.getDelta(), 0.02)
        for (let i = 0; i < 4; i++) stepPhysics(dt / 4)

        const L1 = params.L1, L2 = params.L2
        const x1 = L1 * Math.sin(a1), y1 = -L1 * Math.cos(a1)
        const x2 = x1 + L2 * Math.sin(a2), y2 = y1 - L2 * Math.cos(a2)

        bob1.position.set(x1, y1, 0)
        bob2.position.set(x2, y2, 0)
        arm1.position.set(x1 / 2, y1 / 2, 0)
        arm1.scale.y = L1
        arm1.rotation.z = -a1
        arm2.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0)
        arm2.scale.y = L2
        arm2.rotation.z = -a2

        if (params.trail && trailCount < TRAIL_LEN) {
            trailPositions[trailCount * 3 + 0] = x2
            trailPositions[trailCount * 3 + 1] = y2
            trailPositions[trailCount * 3 + 2] = 0
            trailCount++
            trailGeo.setDrawRange(0, trailCount)
            ;(trailGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
        }
        trail.visible = params.trail

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

export default function WebGLAnimationPendulum() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
