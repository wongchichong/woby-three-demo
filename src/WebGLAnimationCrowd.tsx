/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_crowd

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const BOUNDS = 30
const COUNT = 200

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x334455)
    scene.fog = new THREE.Fog(0x334455, 30, 80)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(0, 25, 45)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x607080, 1.5))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(BOUNDS * 2, BOUNDS * 2),
        new THREE.MeshLambertMaterial({ color: 0x445544 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Crowd simulation
    const positions: THREE.Vector3[] = []
    const velocities: THREE.Vector2[] = []
    const dummy = new THREE.Object3D()
    const clock = new THREE.Clock()
    const params = { speed: 1.0 }

    for (let i = 0; i < COUNT; i++) {
        positions.push(new THREE.Vector3((Math.random() - 0.5) * BOUNDS * 1.8, 0, (Math.random() - 0.5) * BOUNDS * 1.8))
        const angle = Math.random() * Math.PI * 2
        velocities.push(new THREE.Vector2(Math.cos(angle), Math.sin(angle)))
    }

    const bodies = new THREE.InstancedMesh(
        new THREE.ConeGeometry(0.25, 1.0, 8),
        new THREE.MeshLambertMaterial({ color: 0x88aaff }),
        COUNT
    )
    bodies.castShadow = true
    scene.add(bodies)

    const heads = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xffddaa }),
        COUNT
    )
    heads.castShadow = true
    scene.add(heads)

    const panel = new GUI()
    panel.add(params, 'speed', 0.1, 5, 0.1).name('Speed')

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const dt = Math.min(clock.getDelta(), 0.05) * params.speed
        for (let i = 0; i < COUNT; i++) {
            const pos = positions[i]
            const vel = velocities[i]
            let sx = 0, sz = 0
            for (let j = 0; j < COUNT; j++) {
                if (j === i) continue
                const dx = pos.x - positions[j].x
                const dz = pos.z - positions[j].z
                const d2 = dx * dx + dz * dz
                if (d2 < 2.5 && d2 > 0.001) {
                    const inv = 1 / Math.sqrt(d2)
                    sx += dx * inv; sz += dz * inv
                }
            }
            vel.x += sx * dt * 2; vel.y += sz * dt * 2
            const spd = Math.sqrt(vel.x * vel.x + vel.y * vel.y)
            if (spd > 0.001) { vel.x /= spd; vel.y /= spd }
            pos.x += vel.x * dt * 4; pos.z += vel.y * dt * 4
            if (pos.x > BOUNDS) pos.x -= BOUNDS * 2
            if (pos.x < -BOUNDS) pos.x += BOUNDS * 2
            if (pos.z > BOUNDS) pos.z -= BOUNDS * 2
            if (pos.z < -BOUNDS) pos.z += BOUNDS * 2
            const angle = Math.atan2(vel.x, vel.y)
            dummy.position.set(pos.x, 0.5, pos.z); dummy.rotation.y = angle
            dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix)
            dummy.position.set(pos.x, 1.2, pos.z); dummy.rotation.set(0, angle, 0)
            dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix)
        }
        bodies.instanceMatrix.needsUpdate = true
        heads.instanceMatrix.needsUpdate = true

        const t = clock.getElapsedTime()
        camera.position.x = Math.sin(t * 0.05) * 50
        camera.position.z = Math.cos(t * 0.05) * 50
        camera.lookAt(0, 0, 0)

        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        panel.destroy()
        bodies.dispose()
        heads.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationCrowd() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
