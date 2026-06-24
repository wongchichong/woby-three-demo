/** @jsxImportSource woby */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const W = container.clientWidth || window.innerWidth
    const H = container.clientHeight || window.innerHeight
    const PI90 = Math.PI / 2

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x5e5d5d)
    scene.fog = new THREE.Fog(0x5e5d5d, 2, 20)

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 2, -5)

    const orbitControls = new OrbitControls(camera, renderer.domElement)
    orbitControls.target.set(0, 1, 0)
    orbitControls.enableDamping = true
    orbitControls.enablePan = false
    orbitControls.maxPolarAngle = PI90 - 0.05
    orbitControls.update()

    const group = new THREE.Group(); scene.add(group)
    const followGroup = new THREE.Group(); scene.add(followGroup)

    const dirLight = new THREE.DirectionalLight(0xffffff, 5)
    dirLight.position.set(-2, 5, -3)
    dirLight.castShadow = true
    const shadowCam = dirLight.shadow.camera
    shadowCam.top = shadowCam.right = 2
    shadowCam.bottom = shadowCam.left = -2
    shadowCam.near = 3; shadowCam.far = 8
    dirLight.shadow.mapSize.set(1024, 1024)
    followGroup.add(dirLight)
    followGroup.add(dirLight.target)

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
    const settings = { fixe_transition: true }

    let floor: THREE.Mesh | null = null
    let mixer: THREE.AnimationMixer | null = null
    let actions: Record<string, THREE.AnimationAction> = {}

    const setWeight = (action: THREE.AnimationAction, weight: number) => {
        action.enabled = true
        action.setEffectiveTimeScale(1)
        action.setEffectiveWeight(weight)
    }

    const onKeyDown = (event: KeyboardEvent) => {
        const key = ctrl.key
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': case 'KeyZ': key[0] = -1; break
            case 'ArrowDown': case 'KeyS': key[0] = 1; break
            case 'ArrowLeft': case 'KeyA': case 'KeyQ': key[1] = -1; break
            case 'ArrowRight': case 'KeyD': key[1] = 1; break
            case 'ShiftLeft': case 'ShiftRight': key[2] = 1; break
        }
    }
    const onKeyUp = (event: KeyboardEvent) => {
        const key = ctrl.key
        switch (event.code) {
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
        floorT.colorSpace = THREE.SRGBColorSpace
        floorT.repeat.set(repeat, repeat)
        floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping
        floorT.anisotropy = maxAnisotropy
        const floorN = new THREE.TextureLoader().load('textures/floors/FloorsCheckerboard_S_Normal.jpg')
        floorN.repeat.set(repeat, repeat)
        floorN.wrapS = floorN.wrapT = THREE.RepeatWrapping
        floorN.anisotropy = maxAnisotropy
        const fmat = new THREE.MeshStandardMaterial({
            map: floorT, normalMap: floorN, normalScale: new THREE.Vector2(0.5, 0.5),
            color: 0x404040, depthWrite: false, roughness: 0.85
        } as any)
        const fg = new THREE.PlaneGeometry(size, size, 50, 50)
        fg.rotateX(-PI90)
        floor = new THREE.Mesh(fg, fmat)
        floor.receiveShadow = true
        scene.add(floor)
        ctrl.floorDecale = (size / repeat) * 4

        const bulbGeometry = new THREE.SphereGeometry(0.05, 16, 8)
        const bulbLight = new THREE.PointLight(0xffee88, 2, 500, 2)
        const bulbMat = new THREE.MeshStandardMaterial({ emissive: 0xffffee, emissiveIntensity: 1, color: 0x000000 } as any)
        bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat))
        bulbLight.position.set(1, 0.1, -3)
        bulbLight.castShadow = true
        floor.add(bulbLight)

        new GLTFLoader().load('models/gltf/Soldier.glb', (gltf) => {
            const model = gltf.scene
            group.add(model)
            model.rotation.y = Math.PI
            group.rotation.y = Math.PI
            model.traverse((object: any) => {
                if (object.isMesh) {
                    const mat = object.material
                    if (object.name === 'vanguard_Mesh') {
                        object.castShadow = true; object.receiveShadow = true
                        mat.metalness = 1.0; mat.roughness = 0.2
                        mat.color.set(1, 1, 1); mat.metalnessMap = mat.map
                    } else {
                        mat.metalness = 1; mat.roughness = 0
                        mat.transparent = true; mat.opacity = 0.8
                        mat.color.set(1, 1, 1)
                    }
                }
            })
            const skeleton = new THREE.SkeletonHelper(model)
            ;(skeleton as any).setColors?.(new THREE.Color(0xe000ff), new THREE.Color(0x00e0ff))
            skeleton.visible = false
            scene.add(skeleton)
            mixer = new THREE.AnimationMixer(model)
            actions = {
                Idle: mixer.clipAction(gltf.animations[0]),
                Walk: mixer.clipAction(gltf.animations[3]),
                Run: mixer.clipAction(gltf.animations[1]),
            }
            for (const m in actions) {
                actions[m].enabled = true
                actions[m].setEffectiveTimeScale(1)
                if (m !== 'Idle') actions[m].setEffectiveWeight(0)
            }
            actions.Idle.play()
        })
    })

    const clock = new THREE.Clock()
    let animId = 0

    const animate = () => {
        animId = requestAnimationFrame(animate)
        const delta = clock.getDelta()
        const fade = ctrl.fadeDuration
        const key = ctrl.key
        const azimuth = orbitControls.getAzimuthalAngle()
        const active = !(key[0] === 0 && key[1] === 0)
        const play = active ? (key[2] ? 'Run' : 'Walk') : 'Idle'
        if (ctrl.current !== play && actions[play] && actions[ctrl.current]) {
            const current = actions[play]
            const old = actions[ctrl.current]
            ctrl.current = play
            if (settings.fixe_transition) {
                current.reset()
                current.weight = 1.0
                current.stopFading()
                old.stopFading()
                if (play !== 'Idle') current.time = old.time * (current.getClip().duration / old.getClip().duration)
                ;(old as any)._scheduleFading(fade, old.getEffectiveWeight(), 0)
                ;(current as any)._scheduleFading(fade, current.getEffectiveWeight(), 1)
                current.play()
            } else {
                setWeight(current, 1.0)
                old.fadeOut(fade)
                current.reset().fadeIn(fade).play()
            }
        }
        if (ctrl.current !== 'Idle' && floor) {
            const velocity = ctrl.current === 'Run' ? ctrl.runVelocity : ctrl.walkVelocity
            ctrl.ease.set(key[1], 0, key[0]).multiplyScalar(velocity * delta)
            const angle = Math.atan2(
                Math.sin(Math.atan2(ctrl.ease.x, ctrl.ease.z) + azimuth),
                Math.cos(Math.atan2(ctrl.ease.x, ctrl.ease.z) + azimuth)
            )
            ctrl.rotate.setFromAxisAngle(ctrl.up, angle)
            ctrl.ease.applyAxisAngle(ctrl.up, azimuth)
            ctrl.position.add(ctrl.ease)
            camera.position.add(ctrl.ease)
            group.position.copy(ctrl.position)
            group.quaternion.rotateTowards(ctrl.rotate, ctrl.rotateSpeed)
            orbitControls.target.copy(ctrl.position).add(new THREE.Vector3(0, 1, 0))
            followGroup.position.copy(ctrl.position)
            const dx = ctrl.position.x - floor.position.x
            const dz = ctrl.position.z - floor.position.z
            if (Math.abs(dx) > ctrl.floorDecale) floor.position.x += dx
            if (Math.abs(dz) > ctrl.floorDecale) floor.position.z += dz
        }
        if (mixer) mixer.update(delta)
        orbitControls.update()
        renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
        const nW = container.clientWidth || window.innerWidth
        const nH = container.clientHeight || window.innerHeight
        camera.aspect = nW / nH
        camera.updateProjectionMatrix()
        renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        cancelAnimationFrame(animId)
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('keyup', onKeyUp)
        window.removeEventListener('resize', onResize)
        orbitControls.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export const WebGLAnimationWalk = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)

export default WebGLAnimationWalk
