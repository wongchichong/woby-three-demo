/** @jsxImportSource @woby/three */
import { $, $$, useEffect } from "woby"
import {
    Color, Vector2, MathUtils, BoxGeometry, MeshLambertMaterial, Mesh, Raycaster,
    type OrthographicCamera as TOrthographicCamera, type Scene as TScene,
} from "three"

import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { Event } from '@woby/three/lib/components/Event'

import '@woby/three/src/scenes/Scene'
import '@woby/three/src/cameras/OrthographicCamera'
import '@woby/three/src/renderers/WebGLRenderer'
import '@woby/three/src/lights/DirectionalLight'

export const WebGLInteractiveCubesOrtho = () => {
    const sceneRef = $<TScene>(null)
    const cameraRef = $<TOrthographicCamera>(null)

    let INTERSECTED: (Mesh & { _currentHex?: number }) | null = null
    let theta = 0
    const radius = 25
    const frustumSize = 50
    const aspect = window.innerWidth / window.innerHeight
    const pointer = new Vector2()
    const raycaster = new Raycaster()
    const geometry = new BoxGeometry()

    useEffect(() => {
        const scene = $$(sceneRef); if (!scene) return
        for (let i = 0; i < 2000; i++) {
            const object = new Mesh(geometry, new MeshLambertMaterial({ color: Math.random() * 0xffffff }))
            object.position.x = Math.random() * 40 - 20
            object.position.y = Math.random() * 40 - 20
            object.position.z = Math.random() * 40 - 20
            object.rotation.x = Math.random() * 2 * Math.PI
            object.rotation.y = Math.random() * 2 * Math.PI
            object.rotation.z = Math.random() * 2 * Math.PI
            object.scale.x = Math.random() + 0.5
            object.scale.y = Math.random() + 0.5
            object.scale.z = Math.random() + 0.5
            scene.add(object)
        }
    })

    useEffect(() => {
        const onPointerMove = (event: PointerEvent) => {
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener('pointermove', onPointerMove)
        return () => window.removeEventListener('pointermove', onPointerMove)
    })

    const onCameraFrame = (camera: TOrthographicCamera) => {
        const scene = $$(sceneRef); if (!scene) return
        theta += 0.1
        camera.position.x = radius * Math.sin(MathUtils.degToRad(theta))
        camera.position.y = radius * Math.sin(MathUtils.degToRad(theta))
        camera.position.z = radius * Math.cos(MathUtils.degToRad(theta))
        camera.lookAt(scene.position)
        camera.updateMatrixWorld()
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(scene.children, false)
        if (intersects.length > 0) {
            const obj = intersects[0].object as Mesh & { _currentHex?: number }
            if (INTERSECTED !== obj) {
                if (INTERSECTED) {
                    const prevMat = INTERSECTED.material as MeshLambertMaterial
                    if (INTERSECTED._currentHex !== undefined) prevMat.emissive.setHex(INTERSECTED._currentHex)
                }
                INTERSECTED = obj
                const mat = INTERSECTED.material as MeshLambertMaterial
                INTERSECTED._currentHex = mat.emissive.getHex()
                mat.emissive.setHex(0xff0000)
            }
        } else {
            if (INTERSECTED) {
                const prevMat = INTERSECTED.material as MeshLambertMaterial
                if (INTERSECTED._currentHex !== undefined) prevMat.emissive.setHex(INTERSECTED._currentHex)
            }
            INTERSECTED = null
        }
    }

    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene ref={sceneRef} background={new Color(0xf0f0f0)}>
            <directionalLight color={0xffffff} intensity={3} position={[1, 1, 1]} />
        </scene>
        <orthographicCamera ref={cameraRef} args={[frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 100]} onFrame={onCameraFrame} />
        <Event />
    </Canvas3D>
}

export default WebGLInteractiveCubesOrtho
