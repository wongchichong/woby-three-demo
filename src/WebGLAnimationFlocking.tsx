/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_flocking

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const COUNT = 150
const BOUNDS = 50

interface Boid { pos: THREE.Vector3; vel: THREE.Vector3 }

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x112233)
    scene.fog = new THREE.FogExp2(0x112233, 0.006)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.5, 500)
    camera.position.set(0, 20, 80)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x334455, 2))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)

    // Flocking simulation
    const boids: Boid[] = []
    const params = { separation: 5, alignment: 25, cohesion: 50, speed: 0.15 }
    const dummy = new THREE.Object3D()
    const avgPos = new THREE.Vector3()
    const fwd = new THREE.Vector3(0, 0, 1)
    const clock = new THREE.Clock()

    const boidGeo = new THREE.ConeGeometry(0.4, 2, 5)
    boidGeo.rotateX(Math.PI / 2)
    const mesh = new THREE.InstancedMesh(boidGeo, new THREE.MeshLambertMaterial({ color: 0x88ccff }), COUNT)
    scene.add(mesh)

    for (let i = 0; i < COUNT; i++) {
        boids.push({
            pos: new THREE.Vector3((Math.random() - 0.5) * BOUNDS, (Math.random() - 0.5) * BOUNDS * 0.5, (Math.random() - 0.5) * BOUNDS),
            vel: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
        })
    }

    const panel = new GUI()
    panel.add(params, 'separation', 0, 30).name('Separation')
    panel.add(params, 'alignment', 0, 80).name('Alignment')
    panel.add(params, 'cohesion', 0, 100).name('Cohesion')
    panel.add(params, 'speed', 0.05, 0.5, 0.01).name('Speed')

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const dt = Math.min(clock.getDelta(), 0.033)
        const { separation: SEP_DIST, alignment: ALI_DIST, cohesion: COH_DIST } = params
        avgPos.set(0, 0, 0)
        for (let i = 0; i < COUNT; i++) {
            const b = boids[i]
            const sep = new THREE.Vector3(), ali = new THREE.Vector3(), coh = new THREE.Vector3()
            let sepCount = 0, aliCount = 0, cohCount = 0
            for (let j = 0; j < COUNT; j++) {
                if (i === j) continue
                const d = b.pos.distanceTo(boids[j].pos)
                if (d < SEP_DIST && d > 0) { sep.add(b.pos.clone().sub(boids[j].pos).normalize().divideScalar(d)); sepCount++ }
                if (d < ALI_DIST) { ali.add(boids[j].vel); aliCount++ }
                if (d < COH_DIST) { coh.add(boids[j].pos); cohCount++ }
            }
            const steer = new THREE.Vector3()
            if (sepCount > 0) steer.add(sep.divideScalar(sepCount).multiplyScalar(1.5))
            if (aliCount > 0) steer.add(ali.divideScalar(aliCount).sub(b.vel).multiplyScalar(0.05))
            if (cohCount > 0) steer.add(coh.divideScalar(cohCount).sub(b.pos).multiplyScalar(0.003))
            const bound = BOUNDS * 0.8
            if (b.pos.x > bound) steer.x -= 0.5
            if (b.pos.x < -bound) steer.x += 0.5
            if (b.pos.y > bound * 0.5) steer.y -= 0.5
            if (b.pos.y < -bound * 0.5) steer.y += 0.5
            if (b.pos.z > bound) steer.z -= 0.5
            if (b.pos.z < -bound) steer.z += 0.5
            b.vel.add(steer.multiplyScalar(dt * 10))
            const spd = b.vel.length()
            if (spd > params.speed * 60) b.vel.multiplyScalar((params.speed * 60) / spd)
            if (spd < params.speed * 15) b.vel.multiplyScalar((params.speed * 15) / spd)
            b.pos.add(b.vel.clone().multiplyScalar(dt))
            avgPos.add(b.pos)
        }
        avgPos.divideScalar(COUNT)
        for (let i = 0; i < COUNT; i++) {
            const b = boids[i]
            dummy.position.copy(b.pos)
            if (b.vel.lengthSq() > 0.001) dummy.quaternion.setFromUnitVectors(fwd, b.vel.clone().normalize())
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
        camera.position.lerp(avgPos.clone().add(new THREE.Vector3(0, 20, 80)), 0.02)
        camera.lookAt(avgPos)
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        panel.destroy()
        boidGeo.dispose()
        mesh.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationFlocking() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
