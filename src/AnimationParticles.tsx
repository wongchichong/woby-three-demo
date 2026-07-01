/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_particles

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | undefined

interface Particle {
    x: number; y: number; z: number
    speed: number
    offset: number
}

const particleColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94]

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    scene.add(new THREE.AmbientLight(0xffffff, 0.3))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7)
    scene.add(dirLight)

    // Central torus knot
    const torus = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.3, 128, 32),
        new THREE.MeshStandardMaterial({ color: 0x9b59b6, roughness: 0.2, metalness: 0.8, wireframe: true })
    )
    scene.add(torus)

    // Particles
    const particles: Particle[] = Array.from({ length: 50 }, () => ({
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
        speed: 0.5 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2,
    }))

    const particleMeshes: THREE.Mesh[] = []
    for (let i = 0; i < particles.length; i++) {
        const size = 0.05 + (i % 5) * 0.02
        const color = particleColors[i % particleColors.length]
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 8),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
        )
        mesh.position.set(particles[i].x, particles[i].y, particles[i].z)
        scene.add(mesh)
        particleMeshes.push(mesh)
    }

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const t = performance.now() * 0.001
        torus.rotation.x += 0.01
        torus.rotation.y += 0.02

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i]
            const time = t * p.speed
            particleMeshes[i].position.x = p.x + Math.sin(time + p.offset) * 0.5
            particleMeshes[i].position.y = p.y + Math.cos(time * 0.7 + p.offset) * 0.5
            particleMeshes[i].position.z = p.z + Math.sin(time * 0.5 + p.offset) * 0.3
        }

        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        controls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function AnimationParticles() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
