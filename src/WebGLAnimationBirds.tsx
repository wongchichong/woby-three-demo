/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_birds

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

const BIRD_COUNT = 300

interface Bird { pos: THREE.Vector3; vel: THREE.Vector3; acc: THREE.Vector3 }

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.002)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 3000)
    camera.position.set(0, 0, 500)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(0, 1, 1)
    scene.add(dirLight)

    const birds: Bird[] = []
    const params = { separation: 25, alignment: 0.04, cohesion: 0.005, freedom: 0.75, speed: 2.5 }
    const bounds = 400
    const dummy = new THREE.Object3D()
    const _sep = new THREE.Vector3(), _ali = new THREE.Vector3(), _coh = new THREE.Vector3()
    const clock = new THREE.Clock()
    let frame = 0

    for (let i = 0; i < BIRD_COUNT; i++) {
        birds.push({
            pos: new THREE.Vector3((Math.random() - 0.5) * bounds, (Math.random() - 0.5) * bounds * 0.5, (Math.random() - 0.5) * bounds),
            vel: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
            acc: new THREE.Vector3(),
        })
    }

    const birdGeo = new THREE.BufferGeometry()
    const verts = new Float32Array([0, 0, -2, -3, 0, 1, 0, 0, 0, 3, 0, 1, 0, 0, 0, 0, 0.5, 0.5])
    const idx = new Uint16Array([0, 1, 2, 0, 2, 3, 0, 4, 5])
    birdGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    birdGeo.setIndex(new THREE.BufferAttribute(idx, 1))
    birdGeo.computeVertexNormals()

    const birdMat = new THREE.MeshPhongMaterial({ color: 0x555555, side: THREE.DoubleSide })
    const mesh = new THREE.InstancedMesh(birdGeo, birdMat, BIRD_COUNT)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(mesh)

    const color = new THREE.Color()
    for (let i = 0; i < BIRD_COUNT; i++) {
        color.setHSL(i / BIRD_COUNT, 0.4, 0.5)
        mesh.setColorAt(i, color)
    }

    const panel = new GUI()
    panel.add(params, 'separation', 10, 60).name('Separation range')
    panel.add(params, 'alignment', 0.01, 0.1, 0.01).name('Alignment')
    panel.add(params, 'cohesion', 0.001, 0.02, 0.001).name('Cohesion')
    panel.add(params, 'freedom', 0.1, 2, 0.05).name('Freedom')
    panel.add(params, 'speed', 1, 6, 0.5).name('Speed')

    const stepBoids = () => {
        const sep = params.separation, aliW = params.alignment, cohW = params.cohesion, maxSpeed = params.speed
        for (let i = 0; i < BIRD_COUNT; i++) {
            const b = birds[i]
            _sep.set(0, 0, 0); _ali.set(0, 0, 0); _coh.set(0, 0, 0)
            let sepCount = 0, aliCount = 0
            for (let j = 0; j < BIRD_COUNT; j++) {
                if (i === j) continue
                const d = b.pos.distanceTo(birds[j].pos)
                if (d < sep && d > 0) { _sep.addScaledVector(b.pos.clone().sub(birds[j].pos).normalize(), 1 / d); sepCount++ }
                if (d < 100) { _ali.add(birds[j].vel); _coh.add(birds[j].pos); aliCount++ }
            }
            b.acc.set(0, 0, 0)
            if (sepCount > 0) b.acc.addScaledVector(_sep.divideScalar(sepCount), 1.5)
            if (aliCount > 0) {
                _ali.divideScalar(aliCount).sub(b.vel).multiplyScalar(aliW); b.acc.add(_ali)
                _coh.divideScalar(aliCount).sub(b.pos).multiplyScalar(cohW); b.acc.add(_coh)
            }
            b.acc.x += (Math.random() - 0.5) * params.freedom
            b.acc.y += (Math.random() - 0.5) * params.freedom
            b.acc.z += (Math.random() - 0.5) * params.freedom
            b.vel.add(b.acc)
            const speed = b.vel.length()
            if (speed > maxSpeed) b.vel.setLength(maxSpeed)
            if (speed < 1) b.vel.setLength(1)
            b.pos.add(b.vel)
            const H = bounds / 2
            if (b.pos.x > H) b.pos.x = -H
            if (b.pos.x < -H) b.pos.x = H
            if (b.pos.y > H * 0.5) b.pos.y = -H * 0.5
            if (b.pos.y < -H * 0.5) b.pos.y = H * 0.5
            if (b.pos.z > H) b.pos.z = -H
            if (b.pos.z < -H) b.pos.z = H
        }
    }

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        if (frame % 2 === 0) stepBoids()
        frame++
        const t = clock.getElapsedTime()
        for (let i = 0; i < BIRD_COUNT; i++) {
            const b = birds[i]
            dummy.position.copy(b.pos)
            if (b.vel.lengthSq() > 0.001) {
                dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), b.vel.clone().normalize())
            }
            const flapAngle = Math.sin(t * 6 + i * 0.1) * 0.4
            dummy.rotateZ(flapAngle)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
        camera.position.x = Math.sin(t * 0.05) * 500
        camera.position.z = Math.cos(t * 0.05) * 500
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        panel.destroy()
        birdGeo.dispose()
        birdMat.dispose()
        mesh.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationBirds() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}