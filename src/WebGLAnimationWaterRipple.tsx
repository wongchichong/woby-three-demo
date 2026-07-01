/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_water_ripple

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | undefined

const MAX_RIPPLES = 8

const vertexShader = /* glsl */`
uniform float time;
uniform vec2 ripplePos[8];
uniform float rippleTime[8];
uniform float rippleCount;
varying vec2 vUv;
varying float vDisplace;

void main() {
    vUv = uv;
    float disp = 0.0;
    for (int i = 0; i < 8; i++) {
        if (float(i) >= rippleCount) break;
        float age = time - rippleTime[i];
        if (age < 0.0 || age > 3.0) continue;
        vec2 d = position.xz - ripplePos[i];
        float dist = length(d);
        float wave = sin(dist * 4.0 - age * 8.0) * exp(-dist * 0.5) * exp(-age * 1.5);
        disp += wave * 0.3;
    }
    vDisplace = disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y + disp, position.z, 1.0);
}
`

const fragmentShader = /* glsl */`
uniform vec3 waterColor;
uniform float time;
varying vec2 vUv;
varying float vDisplace;

void main() {
    float highlight = smoothstep(0.05, 0.15, vDisplace) * 0.8;
    float deephint = smoothstep(-0.15, -0.05, vDisplace) * 0.3;
    vec3 col = waterColor + vec3(highlight) - vec3(0.0, 0.0, deephint);
    gl_FragColor = vec4(col, 0.9);
}
`

const buoyDefs: [number, number, number][] = [
    [3, 0.1, 2],
    [-4, 0.1, -3],
    [1, 0.1, -5],
]
const rockDefs: [number, number, number, number][] = [
    [-8, -0.4, 6, 0.8],
    [7, -0.3, -7, 0.6],
    [-7, -0.5, -6, 0.9],
    [8, -0.3, 4, 0.65],
]

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(0, 8, 14)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x5577aa, 1.0))

    const dirLight = new THREE.DirectionalLight(0xffeecc, 1.5)
    dirLight.position.set(8, 10, 5)
    dirLight.castShadow = true
    scene.add(dirLight)

    // Water plane with custom shader
    const ripplePosFlat = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector2())
    const rippleTimeFlat = new Array(MAX_RIPPLES).fill(-999)
    const waterMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            ripplePos: { value: ripplePosFlat },
            rippleTime: { value: rippleTimeFlat },
            rippleCount: { value: 0 },
            waterColor: { value: new THREE.Color(0.05, 0.3, 0.6) },
        },
        vertexShader, fragmentShader,
        transparent: true, side: THREE.DoubleSide,
    })
    const waterGeom = new THREE.PlaneGeometry(20, 20, 200, 200)
    const water = new THREE.Mesh(waterGeom, waterMat)
    water.rotation.x = -Math.PI / 2
    water.receiveShadow = true
    scene.add(water)

    // Ripple state
    const ripplePos: THREE.Vector2[] = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector2())
    const rippleTime: number[] = new Array(MAX_RIPPLES).fill(-999)
    let rippleCount = 0, rippleHead = 0
    let lastAutoRipple = 0
    const AUTO_RIPPLE_INTERVAL = 2.0

    const addRipple = (x: number, z: number, now: number) => {
        ripplePos[rippleHead].set(x, z)
        rippleTime[rippleHead] = now
        rippleHead = (rippleHead + 1) % MAX_RIPPLES
        if (rippleCount < MAX_RIPPLES) rippleCount++
    }

    // Buoys
    const buoys: THREE.Mesh[] = []
    for (const [bx, by, bz] of buoyDefs) {
        const buoy = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0xff6633 })
        )
        buoy.position.set(bx, by, bz)
        buoy.castShadow = true
        scene.add(buoy)
        buoys.push(buoy)
    }

    // Rocks
    for (const [rx, ry, rz, rs] of rockDefs) {
        const rock = new THREE.Mesh(
            new THREE.IcosahedronGeometry(rs, 1),
            new THREE.MeshPhongMaterial({ color: 0x555555 })
        )
        rock.position.set(rx, ry, rz)
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        rock.castShadow = true
        rock.receiveShadow = true
        scene.add(rock)
    }

    // Click to ripple
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const hitPoint = new THREE.Vector3()
    const clock = new THREE.Clock()

    const onClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
            const cx = Math.max(-10, Math.min(10, hitPoint.x))
            const cz = Math.max(-10, Math.min(10, hitPoint.z))
            addRipple(cx, cz, clock.getElapsedTime())
        }
    }
    renderer.domElement.addEventListener('click', onClick)

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const time = clock.getElapsedTime()
        if (time - lastAutoRipple > AUTO_RIPPLE_INTERVAL) {
            const rx = (Math.random() - 0.5) * 16
            const rz = (Math.random() - 0.5) * 16
            addRipple(rx, rz, time)
            lastAutoRipple = time
        }
        for (let i = 0; i < MAX_RIPPLES; i++) {
            ripplePosFlat[i].copy(ripplePos[i])
            rippleTimeFlat[i] = rippleTime[i]
        }
        waterMat.uniforms.time.value = time
        waterMat.uniforms.rippleCount.value = rippleCount

        // Animate buoys
        for (let i = 0; i < buoyDefs.length; i++) {
            const [bx, , bz] = buoyDefs[i]
            let disp = 0.0
            for (let r = 0; r < rippleCount; r++) {
                const age = time - rippleTime[r]
                if (age < 0.0 || age > 3.0) continue
                const dx = bx - ripplePos[r].x
                const dz = bz - ripplePos[r].y
                const dist = Math.sqrt(dx * dx + dz * dz)
                disp += Math.sin(dist * 4.0 - age * 8.0) * Math.exp(-dist * 0.5) * Math.exp(-age * 1.5) * 0.3
            }
            buoys[i].position.y = buoyDefs[i][1] + disp
        }

        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        renderer.domElement.removeEventListener('click', onClick)
        controls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationWaterRipple() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
