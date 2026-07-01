/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_md2_control

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex.js'
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js'
import { Timer } from 'three/examples/jsm/misc/Timer.js'

const ASSET_BASE = 'https://threejs.org/examples/'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 4000)
    camera.position.set(0, 150, 1300)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)
    scene.fog = new THREE.Fog(0xffffff, 1000, 4000)
    scene.add(camera)

    scene.add(new THREE.AmbientLight(0x666666, 3))

    const light = new THREE.DirectionalLight(0xffffff, 7)
    light.position.set(200, 450, 500)
    light.castShadow = true
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 512
    light.shadow.camera.near = 100
    light.shadow.camera.far = 1200
    light.shadow.camera.left = -1000
    light.shadow.camera.right = 1000
    light.shadow.camera.top = 350
    light.shadow.camera.bottom = -350
    scene.add(light)

    const gt = new THREE.TextureLoader().load(ASSET_BASE + 'textures/terrain/grasslight-big.jpg')
    const gg = new THREE.PlaneGeometry(16000, 16000)
    const gm = new THREE.MeshPhongMaterial({ color: 0xffffff, map: gt })

    const ground = new THREE.Mesh(gg, gm)
    ground.rotation.x = -Math.PI / 2
    ground.material.map!.repeat.set(64, 64)
    ground.material.map!.wrapS = THREE.RepeatWrapping
    ground.material.map!.wrapT = THREE.RepeatWrapping
    ground.material.map!.colorSpace = THREE.SRGBColorSpace
    ground.receiveShadow = true
    scene.add(ground)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    const cameraControls = new OrbitControls(camera, renderer.domElement)
    cameraControls.target.set(0, 50, 0)
    cameraControls.update()

    const controls = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
    }

    const characters: any[] = []
    let nCharacters = 0

    const configOgro = {
        baseUrl: ASSET_BASE + 'models/md2/ogro/',
        body: 'ogro.md2',
        skins: ['grok.jpg', 'ogrobase.png', 'arboshak.png', 'ctf_r.png', 'ctf_b.png', 'darkam.png', 'freedom.png',
            'gib.png', 'gordogh.png', 'igdosh.png', 'khorne.png', 'nabogro.png', 'sharokh.png'],
        weapons: [['weapon.md2', 'weapon.jpg']],
        animations: {
            move: 'run',
            idle: 'stand',
            jump: 'jump',
            attack: 'attack',
            crouchMove: 'cwalk',
            crouchIdle: 'cstand',
            crouchAttach: 'crattack',
        },
        walkSpeed: 350,
        crouchSpeed: 175,
    }

    const nRows = 1
    const nSkins = configOgro.skins.length
    nCharacters = nSkins * nRows

    for (let i = 0; i < nCharacters; i++) {
        const character = new MD2CharacterComplex()
        character.scale = 3
        character.controls = controls
        characters.push(character)
    }

    const baseCharacter = new MD2CharacterComplex()
    baseCharacter.scale = 3

    baseCharacter.onLoadComplete = function () {
        let k = 0
        for (let j = 0; j < nRows; j++) {
            for (let i = 0; i < nSkins; i++) {
                const cloneCharacter = characters[k]
                cloneCharacter.shareParts(baseCharacter)
                cloneCharacter.enableShadows(true)
                cloneCharacter.setWeapon(0)
                cloneCharacter.setSkin(i)
                cloneCharacter.root.position.x = (i - nSkins / 2) * 150
                cloneCharacter.root.position.z = j * 250
                scene.add(cloneCharacter.root)
                k++
            }
        }

        const gyro = new Gyroscope()
        gyro.add(camera)
        gyro.add(light, light.target)
        characters[Math.floor(nSkins / 2)].root.add(gyro)
    }

    baseCharacter.loadParts(configOgro)

    const timer = new Timer()

    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
    }

    const onKeyDown = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': controls.moveForward = true; break
            case 'ArrowDown':
            case 'KeyS': controls.moveBackward = true; break
            case 'ArrowLeft':
            case 'KeyA': controls.moveLeft = true; break
            case 'ArrowRight':
            case 'KeyD': controls.moveRight = true; break
        }
    }

    const onKeyUp = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': controls.moveForward = false; break
            case 'ArrowDown':
            case 'KeyS': controls.moveBackward = false; break
            case 'ArrowLeft':
            case 'KeyA': controls.moveLeft = false; break
            case 'ArrowRight':
            case 'KeyD': controls.moveRight = false; break
        }
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    renderer.setAnimationLoop(() => {
        timer.update()
        const delta = timer.getDelta()
        for (let i = 0; i < nCharacters; i++) {
            characters[i].update(delta)
        }
        renderer.render(scene, camera)
    })

    _cleanupFn = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('keyup', onKeyUp)
        for (const character of characters) {
            character.root.traverse((obj: any) => {
                if (obj.geometry) obj.geometry.dispose()
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((mat: THREE.Material) => mat.dispose())
                    } else {
                        obj.material.dispose()
                    }
                }
            })
        }
        cameraControls.dispose()
        timer.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLLoaderMD2Control() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
