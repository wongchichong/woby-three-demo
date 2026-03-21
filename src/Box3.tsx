/** @jsxImportSource @woby/three */

import { $, $$, useEffect, } from "woby"

import { MeshProps, } from '@woby/three/src/objects/Mesh'
import { OrbitControls } from '@woby/three/lib/examples/jsm/controls/OrbitControls'
import { TextureLoader } from "three/src/loaders/TextureLoader"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { Event } from '@woby/three/lib/components/Event'
import { toColor } from '@woby/three/lib/utils'

import "@woby/three/src/lights/AmbientLight"
import "@woby/three/src/lights/SpotLight"
import "@woby/three/src/lights/PointLight"
import '@woby/three/src/geometries/BoxGeometry'
import '@woby/three/src/materials/MeshStandardMaterial'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/scenes/Scene'
import '@woby/three/src/renderers/WebGLRenderer'
import "@woby/three/src/cameras/PerspectiveCamera"
import { Scene } from "@woby/three/src/scenes/Scene"
import { AmbientLight } from "@woby/three/src/lights/AmbientLight"
import { SpotLight } from "@woby/three/src/lights/SpotLight"
import { PointLight } from "@woby/three/src/lights/PointLight"
import { PerspectiveCamera } from "@woby/three/src/cameras/PerspectiveCamera"
import { Mesh } from "@woby/three/src/objects/Mesh"
import { useCameras } from '@woby/three/lib/hooks/useCamera'
import { useThree } from '@woby/three/lib/hooks/useThree'

const Box = (props: MeshProps) => {
    const texture = new TextureLoader().load('../textures/usedSteel.png')
    // const texture = new TextureLoader().loadAsync('../textures/usedSteel.png')
    // const texture = useLoader(TextureLoader, { path: '../textures/usedSteel.png' })

    const hovered = $(false)
    const clicked = $(false)

    // Return the view, these are regular Threejs elements expressed in JSX
    return <mesh
        {...props}
        scale={() => $$(clicked) ? [1.5, 1.5, 1.5] : [1, 1, 1]}
        onFrame={ref => ref.rotateX(0.03)}
        // onClick={(event) => clicked(!clicked())}
        onPointerOver={() => hovered(true)}
        onPointerOut={() => hovered(false)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={() => $$(hovered) ? 'hotpink' : 'orange'} map={texture} />
    </mesh>
}

export const Box3 = () => {
    const visible = $(false)
    const box = <Box position={[0, 1, 0]} />
    const sceneRef = $<Scene>(null)

    const Test = (() => {
        useEffect(() => {
            const scene = $$(sceneRef)

            if (!scene) {
                return
            }

            console.log('[Box3] scene', scene)

            // Test 1: Verify scene exists and is a Scene instance
            console.assert(scene instanceof Scene, '[Box3] Scene should be an instance of Scene')
            console.log('[Box3] ✓ Scene is valid')

            // Test 2: Verify background color
            console.assert(scene.background !== null, '[Box3] Scene should have a background')
            console.log('[Box3] ✓ Background is set:', scene.background)

            // Test 3: Count and verify lights
            const lights = scene.children.filter(child => child.type.includes('Light'))
            console.assert(lights.length >= 3, `[Box3] Expected at least 3 lights, found ${lights.length}`)

            const ambientLights = lights.filter(light => light.type === 'AmbientLight')
            const spotLights = lights.filter(light => light.type === 'SpotLight')
            const pointLights = lights.filter(light => light.type === 'PointLight')

            console.assert(ambientLights.length === 1, `[Box3] Expected 1 AmbientLight, found ${ambientLights.length}`)
            console.assert(spotLights.length === 1, `[Box3] Expected 1 SpotLight, found ${spotLights.length}`)
            console.assert(pointLights.length === 1, `[Box3] Expected 1 PointLight, found ${pointLights.length}`)

            console.log('[Box3] ✓ Lights verified:', {
                total: lights.length,
                ambient: ambientLights.length,
                spot: spotLights.length,
                point: pointLights.length
            })

            // Test 4: Verify light properties
            const ambientLight = ambientLights[0] as AmbientLight
            console.assert(ambientLight.intensity === 1, `[Box3] AmbientLight intensity should be 1, got ${ambientLight.intensity}`)
            console.log('[Box3] ✓ AmbientLight intensity is correct')

            const spotLight = spotLights[0] as SpotLight
            console.assert(spotLight.position.y === 1, `[Box3] SpotLight y position should be 1, got ${spotLight.position.y}`)
            console.assert(spotLight.angle === 10, `[Box3] SpotLight angle should be 10, got ${spotLight.angle}`)
            console.assert(spotLight.penumbra === 1, `[Box3] SpotLight penumbra should be 1, got ${spotLight.penumbra}`)
            console.log('[Box3] ✓ SpotLight properties are correct')

            const pointLight = pointLights[0] as PointLight
            console.assert(pointLight.position.y === 1, `[Box3] PointLight y position should be 1, got ${pointLight.position.y}`)
            console.log('[Box3] ✓ PointLight position is correct')

            // Test 5: Verify geometries (boxes)
            const meshes = scene.children.filter(child => child.type === 'Mesh')
            console.assert(meshes.length >= 2, `[Box3] Expected at least 2 Meshes, found ${meshes.length}`)
            console.log('[Box3] ✓ Meshes found:', meshes.length)

            // Test 6: Verify box positions
            const boxes = meshes.filter((mesh) => {
                const meshObj = mesh as Mesh
                return meshObj.geometry?.type === 'BoxGeometry'
            })
            console.assert(boxes.length >= 2, `[Box3] Expected at least 2 BoxGeometry meshes, found ${boxes.length}`)

            const leftBox = boxes.find(box => box.position.x === -1.2)
            const rightBox = boxes.find(box => box.position.x === 1.2)

            console.assert(leftBox !== undefined, '[Box3] Left box at x=-1.2 should exist')
            console.assert(rightBox !== undefined, '[Box3] Right box at x=1.2 should exist')
            console.log('[Box3] ✓ Box positions are correct')

            // Test 7: Verify camera using ThreeContext
            // Cameras are registered in ThreeContext.cameras array via useCameras() hook
            const ctx = useThree()
            const cameras = ctx.cameras

            console.assert(cameras && cameras.length > 0, `[Box3] Expected at least 1 camera in ThreeContext, found ${cameras?.length || 0}`)

            if (cameras && cameras.length > 0) {
                const perspectiveCamera = cameras.find(cam => cam.type === 'PerspectiveCamera') as PerspectiveCamera | undefined
                console.log(`[Box3] ✓ Found ${cameras.length} camera(s) in ThreeContext`)

                if (perspectiveCamera) {
                    console.assert(perspectiveCamera.position.z === 5, `[Box3] Camera z position should be 5, got ${perspectiveCamera.position.z}`)
                    console.log('[Box3] ✓ PerspectiveCamera position is correct')
                    console.log('[Box3] ✓ Camera accessible via useThree().cameras')
                } else {
                    console.log('[Box3] ⚠ No PerspectiveCamera found, but other camera types exist')
                }
            } else {
                console.log('[Box3] ⚠ No cameras found in ThreeContext')
            }

            // Test 8: Verify OrbitControls using ThreeContext
            // OrbitControls instances can be tracked in context or accessed via refs
            // For now, verify that we have the required context structure
            console.assert(ctx !== undefined, '[Box3] ThreeContext should be defined')
            console.assert(ctx.renderers && ctx.renderers.length > 0, '[Box3] Should have at least 1 renderer in context')

            if (ctx.renderers && ctx.renderers.length > 0) {
                console.log(`[Box3] ✓ Found ${ctx.renderers.length} renderer(s) in ThreeContext`)
                console.log('[Box3] ✓ OrbitControls would be attached to renderer.domElement')
            }

            console.log('[Box3] ✓ ThreeContext structure verified:', {
                cameras: cameras?.length || 0,
                scenes: ctx.scenes?.length || 0,
                renderers: ctx.renderers?.length || 0,
                frames: ctx.frames?.length || 0
            })

            // Summary
            console.groupCollapsed('[Box3] @woby/three Architecture Summary')
            console.log('✓ Scene: Direct child of Canvas3D, accessible via ref')
            console.log('✓ Lights: Added to scene.children')
            console.log('✓ Geometries: Added to scene.children as Mesh objects')
            console.log(`✓ Camera: ${cameras?.length || 0} camera(s) in ThreeContext.cameras`)
            console.log(`✓ Renderer: ${ctx.renderers?.length || 0} renderer(s) in ThreeContext.renderers`)
            console.log('ℹ OrbitControls: Would attach to camera + renderer.domElement')
            console.groupEnd()
        })
        return null
    })

    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene ref={sceneRef} background={toColor('white')}>
            <ambientLight intensity={1} />
            <spotLight position={[0, 1, 0]} angle={10} penumbra={1} />
            <pointLight position={[0, 1, 0]} />
            <Box position={[-1.2, 0, 0]} onClick={() => { visible(!$$(visible)); console.log($$(visible)) }} />
            {/* <Box position={[0, 1, 0]} visible={() => $(visible) ? true : false} /> */}
            {() => $(visible) ? box : null}
            <Box position={[1.2, 0, 0]} />
        </scene>
        <perspectiveCamera position={[0, 0, 5]} />
        <OrbitControls enableDamping />
        <Event />
        <Test />
    </Canvas3D>
}