/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_animation_walk

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x5e5d5d)
    scene.fog = new THREE.Fog(0x5e5d5d, 2, 20)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 2, -5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    const PI90 = Math.PI / 2
    const orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.target.set(0, 1, 0)
    orbitControls.enableDamping = true
    orbitControls.enablePan = false
    orbitControls.maxPolarAngle = PI90 - 0.05
    orbitControls.update()

    const group = new THREE.Group(); scene.add(group)
    const followGroup = new THREE.Group(); scene.add(followGroup)

    const dirLight = new THREE.DirectionalLight(0xffffff, 5)
    dirLight.position.set(-2, 5, -3); dirLight.castShadow = true
    const shadowCam = dirLight.shadow.camera as THREE.OrthographicCamera
    shadowCam.top = shadowCam.right = 2; shadowCam.bottom = shadowCam.left = -2
    shadowCam.near = 3; shadowCam.far = 8
    dirLight.shadow.mapSize.set(1024, 1024)
    followGroup.add(dirLight); followGroup.add(dirLight.target)

    const ctrl = {
        key: [0, 0, 0] as number[],
        ease: new THREE.Vector3(),
        position: new THREE.Vector3(),
        up: new THREE.Vector3(0, 1, 0),
        rotate: new THREE.Quaternion(),
        current: 'Idle',
        fadeDuration: 0.5,
        runVelocity: 5,
        walkVelocity: 1.8,
        rotateSpeed: 0.05,
        floorDecale: 0,
    }

    let floor: THREE.Mesh | null = null
    let mixer: THREE.AnimationMixer | null = null
    let actions: Record<string, THREE.AnimationAction> = {}

    const onKeyDown = (e: KeyboardEvent) => {
        const key = ctrl.key
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': case 'KeyZ': key[0] = -1; break
            case 'ArrowDown': case 'KeyS': key[0] = 1; break
            case 'ArrowLeft': case 'KeyA': case 'KeyQ': key[1] = -1; break
            case 'ArrowRight': case 'KeyD': key[1] = 1; break
            case 'ShiftLeft': case 'ShiftRight': key[2] = 1; break
        }
    }
    const onKeyUp = (e: KeyboardEvent) => {
        const key = ctrl.key
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': case 'KeyZ': key[0] = key[0] < 0 ? 0 : key[0]; break
            case 'ArrowDown': case 'KeyS': key[0] = key[0] > 0 ? 0 : key[0]; break
            case 'ArrowLeft': case 'KeyA': case 'KeyQ': key[1] = key[1] < 0 ? 0 : key[1]; break
            case 'ArrowRight': case 'KeyD': key[1] = key[1] > 0 ? 0 : key[1]; break
            case 'ShiftLeft': case 'ShiftRight': key[2] = 0; break
        }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    new RGBELoader().setPath('textures/equirectangular/').load('lobe.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.environment = texture
        ;(scene as any).environmentIntensity = 1.5

        const size = 50, repeat = 16
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
        const floorT = new THREE.TextureLoader().load('textures/floors/FloorsCheckerboard_S_Diffuse.jpg')
        floorT.colorSpace = THREE.SRGBColorSpace; floorT.repeat.set(repeat, repeat)
        floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.anisotropy = maxAnisotropy
        const floorN = new THREE.TextureLoader().load('textures/floors/FloorsCheckerboard_S_Normal.jpg')
        floorN.repeat.set(repeat, repeat); floorN.wrapS = floorN.wrapT = THREE.RepeatWrapping; floorN.anisotropy = maxAnisotropy
        const fmat = new THREE.MeshStandardMaterial({
            map: floorT, normalMap: floorN, normalScale: new THREE.Vector2(0.5, 0.5),
            color: 0x404040, depthWrite: false, roughness: 0.85,
        } as any)
        const fg = new THREE.PlaneGeometry(size, size, 50, 50); fg.rotateX(-PI90)
        floor = new THREE.Mesh(fg, fmat); floor.receiveShadow = true; scene.add(floor)
        ctrl.floorDecale = (size / repeat) * 4

        const bulbGeometry = new THREE.SphereGeometry(0.05, 16, 8)
        const bulbLight = new THREE.PointLight(0xffee88, 2, 500, 2)
        const bulbMat = new THREE.MeshStandardMaterial({ emissive: 0xffffee, emissiveIntensity: 1, color: 0x000000 } as any)
        bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat))
        bulbLight.position.set(1, 0.1, -3); bulbLight.castShadow = true
        floor.add(bulbLight)

        new GLTFLoader().load('models/gltf/Soldier.glb', (gltf) => {
            const model = gltf.scene; group.add(model)
            model.rotation.y = Math.PI; group.rotation.y = Math.PI
            model.traverse((o: any) => {
                if (o.isMesh) {
                    const mat = o.material as THREE.MeshStandardMaterial
                    if (o.name === 'vanguard_Mesh') {
                        o.castShadow = true; o.receiveShadow = true
                        mat.metalness = 1.0; mat.roughness = 0.2; mat.color.set(1, 1, 1)
                        mat.metalnessMap = mat.map
                    } else {
                        mat.metalness = 1; mat.roughness = 0; mat.transparent = true
                        mat.opacity = 0.8; mat.color.set(1, 1, 1)
                    }
                }
            })
            mixer = new THREE.AnimationMixer(model)
            actions = {
                Idle: mixer.clipAction(gltf.animations[0]),
                Walk: mixer.clipAction(gltf.animations[3]),
                Run: mixer.clipAction(gltf.animations[1]),
            }
            for (const m in actions) {
                actions[m].enabled = true; actions[m].setEffectiveTimeScale(1)
                if (m !== 'Idle') actions[m].setEffectiveWeight(0)
            }
            actions.Idle.play()
        })
    })

    const clock = new THREE.Clock()
    const fade = ctrl.fadeDuration

    const onResize = () => {
        const w = container.clientWidth; const h = container.clientHeight
        camera.aspect = w / h; camera.updateProjectionMatrix()
        renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const animate = () => {
        const delta = clock.getDelta()
        const key = ctrl.key
        const azimuth = orbitControls.getAzimuthalAngle()
        const active = !(key[0] === 0 && key[1] === 0)
        const play = active ? (key[2] ? 'Run' : 'Walk') : 'Idle'
        if (ctrl.current !== play && actions[play] && actions[ctrl.current]) {
            const current = actions[play]; const old = actions[ctrl.current]
            ctrl.current = play
            current.reset(); current.weight = 1.0; current.stopFading(); old.stopFading()
            if (play !== 'Idle') current.time = old.time * (current.getClip().duration / old.getClip().duration)
            ;(old as any)._scheduleFading(fade, old.getEffectiveWeight(), 0)
            ;(current as any)._scheduleFading(fade, current.getEffectiveWeight(), 1)
            current.play()
        }
        if (ctrl.current !== 'Idle' && floor) {
            const velocity = ctrl.current === 'Run' ? ctrl.runVelocity : ctrl.walkVelocity
            ctrl.ease.set(key[1], 0, key[0]).multiplyScalar(velocity * delta)
            const angle = Math.atan2(Math.sin(Math.atan2(ctrl.ease.x, ctrl.ease.z) + azimuth), Math.cos(Math.atan2(ctrl.ease.x, ctrl.ease.z) + azimuth))
            ctrl.rotate.setFromAxisAngle(ctrl.up, angle)
            ctrl.ease.applyAxisAngle(ctrl.up, azimuth)
            ctrl.position.add(ctrl.ease)
            camera.position.add(ctrl.ease)
            group.position.copy(ctrl.position)
            group.quaternion.rotateTowards(ctrl.rotate, ctrl.rotateSpeed)
            orbitControls.target.copy(ctrl.position).add(new THREE.Vector3(0, 1, 0))
            followGroup.position.copy(ctrl.position)
            const dx = ctrl.position.x - floor.position.x; const dz = ctrl.position.z - floor.position.z
            if (Math.abs(dx) > ctrl.floorDecale) floor.position.x += dx
            if (Math.abs(dz) > ctrl.floorDecale) floor.position.z += dz
        }
        if (mixer) mixer.update(delta)
        orbitControls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
    }
    animate()

    _cleanupFn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('keyup', onKeyUp)
        orbitControls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLAnimationWalk() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
