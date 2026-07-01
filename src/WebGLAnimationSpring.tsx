/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_spring

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | undefined

interface SpringNode {
    pos: THREE.Vector3
    vel: THREE.Vector3
    acc: THREE.Vector3
    mass: number
    fixed: boolean
}

interface SpringChain {
    nodes: SpringNode[]
    spheres: THREE.Mesh[]
    lines: THREE.Line[]
    stiffness: number
    damping: number
    restLength: number
    anchorX: number
}

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.Fog(0x1a1a2e, 30, 80)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(0, 5, 15)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x303030))

    const dirLight = new THREE.DirectionalLight(0xffffff, 2)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

    const bar = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })
    )
    bar.position.y = 4
    bar.castShadow = true
    bar.receiveShadow = true
    scene.add(bar)

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x0d0d1a, roughness: 0.8 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -5
    floor.receiveShadow = true
    scene.add(floor)

    // Spring chain definitions: [anchorX, numNodes, stiffness, damping, color]
    const chainDefs: Array<[number, number, number, number, number]> = [
        [-4, 5, 50, 0.98, 0x4fc3f7],
        [0, 5, 30, 0.97, 0xaed581],
        [4, 8, 80, 0.99, 0xff8a65],
    ]

    const buildChain = (anchorX: number, numNodes: number, stiffness: number, damping: number, color: number): SpringChain => {
        const nodes: SpringNode[] = []
        const spheres: THREE.Mesh[] = []
        const lines: THREE.Line[] = []
        const restLength = 1.0
        const anchorY = 4.0
        const sphereMat = new THREE.MeshStandardMaterial({
            color, metalness: 0.3, roughness: 0.5,
            emissive: new THREE.Color(color).multiplyScalar(0.15),
        })
        const sphereGeom = new THREE.SphereGeometry(0.2, 16, 16)
        for (let i = 0; i < numNodes; i++) {
            const node: SpringNode = {
                pos: new THREE.Vector3(anchorX, anchorY - i * restLength, 0),
                vel: new THREE.Vector3(0, 0, 0),
                acc: new THREE.Vector3(0, 0, 0),
                mass: 1.0,
                fixed: i === 0,
            }
            if (i > 0) {
                node.pos.x += (Math.random() - 0.5) * 0.5
                node.pos.z += (Math.random() - 0.5) * 0.3
            }
            nodes.push(node)
            const sphere = new THREE.Mesh(sphereGeom, sphereMat)
            sphere.position.copy(node.pos)
            sphere.castShadow = true
            sphere.receiveShadow = true
            scene.add(sphere)
            spheres.push(sphere)
        }
        const lineMat = new THREE.LineBasicMaterial({ color })
        for (let i = 0; i < numNodes - 1; i++) {
            const pts = [nodes[i].pos.clone(), nodes[i + 1].pos.clone()]
            const lineGeom = new THREE.BufferGeometry().setFromPoints(pts)
            const line = new THREE.Line(lineGeom, lineMat)
            scene.add(line)
            lines.push(line)
        }
        return { nodes, spheres, lines, stiffness, damping, restLength, anchorX }
    }

    const chains: SpringChain[] = []
    for (const [ax, n, s, d, c] of chainDefs) chains.push(buildChain(ax, n, s, d, c))

    const params = { stiffnessMultiplier: 1.0, gravity: 9.8, damping: 0.98 }

    const panel = new GUI({ title: 'Spring Physics' })
    panel.add(params, 'stiffnessMultiplier', 0.1, 2.0, 0.05).name('Stiffness')
    panel.add(params, 'gravity', 0, 20, 0.1).name('Gravity')
    panel.add(params, 'damping', 0.9, 0.999, 0.001).name('Damping')

    const stepChain = (chain: SpringChain) => {
        const { nodes, stiffness, restLength } = chain
        const effStiffness = stiffness * params.stiffnessMultiplier
        const effDamping = chain.damping * (params.damping / 0.98)
        const gravity = params.gravity
        const dt = 0.016
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].fixed) continue
            nodes[i].acc.set(0, -gravity * nodes[i].mass, 0)
            if (i > 0) {
                const diff = new THREE.Vector3().subVectors(nodes[i - 1].pos, nodes[i].pos)
                const dist = diff.length()
                if (dist > 0.0001) {
                    const stretch = dist - restLength
                    const force = diff.normalize().multiplyScalar(effStiffness * stretch)
                    nodes[i].acc.add(force.divideScalar(nodes[i].mass))
                }
            }
            if (i < nodes.length - 1) {
                const diff = new THREE.Vector3().subVectors(nodes[i + 1].pos, nodes[i].pos)
                const dist = diff.length()
                if (dist > 0.0001) {
                    const stretch = dist - restLength
                    const force = diff.normalize().multiplyScalar(effStiffness * stretch)
                    nodes[i].acc.add(force.divideScalar(nodes[i].mass))
                }
            }
            nodes[i].vel.addScaledVector(nodes[i].acc, dt)
            nodes[i].vel.multiplyScalar(effDamping)
            nodes[i].pos.addScaledVector(nodes[i].vel, dt)
            if (nodes[i].pos.y < -4.8) { nodes[i].pos.y = -4.8; nodes[i].vel.y *= -0.3 }
        }
        for (let i = 0; i < nodes.length; i++) chain.spheres[i].position.copy(nodes[i].pos)
        for (let i = 0; i < chain.lines.length; i++) {
            const curve = new THREE.CatmullRomCurve3([
                chain.nodes[i].pos.clone(),
                new THREE.Vector3(
                    (chain.nodes[i].pos.x + chain.nodes[i + 1].pos.x) / 2 + Math.sin(performance.now() * 0.001 + i) * 0.05,
                    (chain.nodes[i].pos.y + chain.nodes[i + 1].pos.y) / 2,
                    (chain.nodes[i].pos.z + chain.nodes[i + 1].pos.z) / 2,
                ),
                chain.nodes[i + 1].pos.clone(),
            ])
            ;(chain.lines[i].geometry as THREE.BufferGeometry).setFromPoints(curve.getPoints(6))
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
        for (const ch of chains) stepChain(ch)
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

export default function WebGLAnimationSpring() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
