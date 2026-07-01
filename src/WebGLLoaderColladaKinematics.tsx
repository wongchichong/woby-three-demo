/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_loader_collada_kinematics

import * as THREE from 'three'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'

let _cleanupFn: (() => void) | undefined

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = undefined }

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000)
    camera.position.set(2, 2, 3)

    const scene = new THREE.Scene()

    const grid = new THREE.GridHelper(20, 20, 0xc1c1c1, 0x8d8d8d)
    scene.add(grid)

    const light = new THREE.HemisphereLight(0xfff7f7, 0x494966, 3)
    scene.add(light)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    let kinematics: any
    let dae: THREE.Object3D | undefined
    const tweenParameters: Record<string, number> = {}

    const setupTween = () => {
        if (!kinematics) return
        const duration = THREE.MathUtils.randInt(1000, 5000)
        const target: Record<string, number> = {}

        for (const prop in kinematics.joints) {
            if (kinematics.joints.hasOwnProperty(prop)) {
                if (!kinematics.joints[prop].static) {
                    const joint = kinematics.joints[prop]
                    const old = tweenParameters[prop]
                    const position = old ? old : joint.zeroPosition
                    tweenParameters[prop] = position
                    target[prop] = THREE.MathUtils.randInt(joint.limits.min, joint.limits.max)
                }
            }
        }

        const t = new TWEEN.Tween(tweenParameters).to(target, duration).easing(TWEEN.Easing.Quadratic.Out)
        t.onUpdate((object: Record<string, number>) => {
            for (const prop in kinematics.joints) {
                if (kinematics.joints.hasOwnProperty(prop) && !kinematics.joints[prop].static) {
                    kinematics.setJointValue(prop, object[prop])
                }
            }
        })
        t.start()
        setTimeout(setupTween, duration)
    }

    const loader = new ColladaLoader()
    loader.load('https://threejs.org/examples/models/collada/abb_irb52_7_120.dae', (collada) => {
        dae = collada.scene
        dae.traverse((child: any) => {
            if (child.isMesh) {
                child.material.flatShading = true
            }
        })
        dae.scale.setScalar(10.0)
        dae.updateMatrix()

        kinematics = collada.kinematics
        scene.add(dae)
        setupTween()
    }, undefined, (error) => {
        console.error('Failed to load Collada model:', error)
    })

    renderer.setAnimationLoop(() => {
        TWEEN.update()
        const timer = Date.now() * 0.0001
        camera.position.x = Math.cos(timer) * 20
        camera.position.y = 10
        camera.position.z = Math.sin(timer) * 20
        camera.lookAt(0, 5, 0)
        renderer.render(scene, camera)
    })

    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    _cleanupFn = () => {
        TWEEN.removeAll()
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
}

export default function WebGLLoaderColladaKinematics() {
    return <div ref={(el) => { if (el) init3D(el) }} class="w-full h-full" />
}
