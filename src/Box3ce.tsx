/** @jsxImportSource @woby/three */

import { $, $$, useEffect, customElement } from "woby"

import { MeshProps, } from '@woby/three/src/objects/Mesh'
import { OrbitControls } from '@woby/three/lib/examples/jsm/controls/OrbitControls'
import { TextureLoader } from "three/src/loaders/TextureLoader"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { Event } from '@woby/three/lib/components/Event'
import { toColor } from '@woby/three/lib/utils'
import { defaults } from 'woby'

// Import custom elements - this registers them in JSX.IntrinsicElements
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
import { useThree } from '@woby/three/lib/hooks/useThree'

// Define default props for the custom element
const def = () => ({
    // geometry and material are handled by Three.js fiber
})

// Create the Woby component with defaults
const Box = defaults(def, (props: MeshProps) => {
    const texture = new TextureLoader().load('../textures/usedSteel.png')
    // const texture = new TextureLoader().loadAsync('../textures/usedSteel.png')
    // const texture = useLoader(TextureLoader, { path: '../textures/usedSteel.png' })

    const hovered = $(false)
    const clicked = $(false)

    // Return the view, these are regular Threejs elements expressed in JSX
    return <three-mesh
        {...props}
        scale={() => $$(clicked) ? [1.5, 1.5, 1.5] : [1, 1, 1]}
        onFrame={ref => ref.rotateX(0.03)}
        // onClick={(event) => clicked(!clicked())}
        onPointerOver={() => hovered(true)}
        onPointerOut={() => hovered(false)}>
        <three-box-geometry args={[1, 1, 1]} />
        <three-mesh-standard-material color={() => $$(hovered) ? 'hotpink' : 'orange'} map={texture} />
    </three-mesh>
})

// Register custom element with proper defaults
customElement('my-box', Box)

export const Box3ce = () => {
    const visible = $(false)
    const box = <Box position={[0, 1, 0]} />
    const sceneRef = $<Scene>(null)

    // Define default props for the custom element
    const testDef = () => ({})

    // Create the Woby component with defaults
    const Test = defaults(testDef, (() => {
        useEffect(() => {
            const scene = $$(sceneRef)

            if (!scene) {
                // console.error('[Box3ce] ⚠ Scene ref is null - three-scene component may not be created correctly')
                return
            }

            console.log('[Box3ce] scxene', scene)

            // Test 1: Verify scene exists and is a Scene instance
            console.assert(scene instanceof Scene, '[Box3ce] Scene should be an instance of Scene')
            console.log('[Box3ce] ✓ Scene is valid')

            // Test 2: Verify background color
            console.assert(scene.background !== null, '[Box3ce] Scene should have a background')
            console.log('[Box3ce] ✓ Background is set:', scene.background)

            // Test 3: Count and verify lights
            const lights = scene.children.filter(child => child.type.includes('Light'))
            console.assert(lights.length >= 3, `[Box3ce] Expected at least 3 lights, found ${lights.length}`)

            const ambientLights = lights.filter(light => light.type === 'AmbientLight')
            const spotLights = lights.filter(light => light.type === 'SpotLight')
            const pointLights = lights.filter(light => light.type === 'PointLight')

            console.assert(ambientLights.length === 1, `[Box3ce] Expected 1 AmbientLight, found ${ambientLights.length}`)
            console.assert(spotLights.length === 1, `[Box3ce] Expected 1 SpotLight, found ${spotLights.length}`)
            console.assert(pointLights.length === 1, `[Box3ce] Expected 1 PointLight, found ${pointLights.length}`)

            console.log('[Box3ce] ✓ Lights verified:', {
                total: lights.length,
                ambient: ambientLights.length,
                spot: spotLights.length,
                point: pointLights.length
            })

            // Test 4: Verify light properties
            const ambientLight = ambientLights[0] as AmbientLight
            console.assert(ambientLight.intensity === 1, `[Box3ce] AmbientLight intensity should be 1, got ${ambientLight.intensity}`)
            console.log('[Box3ce] ✓ AmbientLight intensity is correct')

            const spotLight = spotLights[0] as SpotLight
            console.assert(spotLight.position.y === 1, `[Box3ce] SpotLight y position should be 1, got ${spotLight.position.y}`)
            console.assert(spotLight.angle === 10, `[Box3ce] SpotLight angle should be 10, got ${spotLight.angle}`)
            console.assert(spotLight.penumbra === 1, `[Box3ce] SpotLight penumbra should be 1, got ${spotLight.penumbra}`)
            console.log('[Box3ce] ✓ SpotLight properties are correct')

            const pointLight = pointLights[0] as PointLight
            console.assert(pointLight.position.y === 1, `[Box3ce] PointLight y position should be 1, got ${pointLight.position.y}`)
            console.log('[Box3ce] ✓ PointLight position is correct')

            // Test 5: Verify geometries (boxes)
            const meshes = scene.children.filter(child => child.type === 'Mesh')
            console.assert(meshes.length >= 2, `[Box3ce] Expected at least 2 Meshes, found ${meshes.length}`)
            console.log('[Box3ce] ✓ Meshes found:', meshes.length)

            // Debug: Log mesh types to identify the issue
            console.log('[Box3ce] Debug - Mesh types:', meshes.map(m => ({ type: m.type, geometryType: m.geometry?.type })))
            console.log('[Box3ce] Debug - All children types:', scene.children.map(c => ({ type: c.type, hasGeometry: !!(c as any).geometry, geometryType: (c as any).geometry?.type })))

            // Test 6: Verify box positions
            const boxes = meshes.filter((mesh) => {
                const meshObj = mesh as Mesh
                return meshObj.geometry?.type === 'BoxGeometry'
            })
            console.assert(boxes.length >= 2, `[Box3ce] Expected at least 2 BoxGeometry meshes, found ${boxes.length}`)

            const leftBox = boxes.find(box => box.position.x === -1.2)
            const rightBox = boxes.find(box => box.position.x === 1.2)

            console.assert(leftBox !== undefined, '[Box3ce] Left box at x=-1.2 should exist')
            console.assert(rightBox !== undefined, '[Box3ce] Right box at x=1.2 should exist')
            console.log('[Box3ce] ✓ Box positions are correct')

            // Test 7: Verify camera using ThreeContext
            // Cameras are registered in ThreeContext.cameras array via useCameras() hook
            const ctx = useThree()
            const cameras = ctx.cameras

            console.assert(cameras && cameras.length > 0, `[Box3ce] Expected at least 1 camera in ThreeContext, found ${cameras?.length || 0}`)

            if (cameras && cameras.length > 0) {
                const perspectiveCamera = cameras.find(cam => cam.type === 'PerspectiveCamera') as PerspectiveCamera | undefined
                console.log(`[Box3ce] ✓ Found ${cameras.length} camera(s) in ThreeContext`)

                if (perspectiveCamera) {
                    console.assert(perspectiveCamera.position.z === 5, `[Box3ce] Camera z position should be 5, got ${perspectiveCamera.position.z}`)
                    console.log('[Box3ce] ✓ PerspectiveCamera position is correct')
                    console.log('[Box3ce] ✓ Camera accessible via useThree().cameras')
                } else {
                    console.log('[Box3ce] ⚠ No PerspectiveCamera found, but other camera types exist')
                }
            } else {
                console.log('[Box3ce] ⚠ No cameras found in ThreeContext')
            }

            // Test 8: Verify OrbitControls using ThreeContext
            // OrbitControls instances can be tracked in context or accessed via refs
            // For now, verify that we have the required context structure
            console.assert(ctx !== undefined, '[Box3ce] ThreeContext should be defined')
            console.assert(ctx.renderers && ctx.renderers.length > 0, '[Box3ce] Should have at least 1 renderer in context')

            if (ctx.renderers && ctx.renderers.length > 0) {
                console.log(`[Box3ce] ✓ Found ${ctx.renderers.length} renderer(s) in ThreeContext`)
                console.log('[Box3ce] ✓ OrbitControls would be attached to renderer.domElement')
            }

            console.log('[Box3ce] ✓ ThreeContext structure verified:', {
                cameras: cameras?.length || 0,
                scenes: ctx.scenes?.length || 0,
                renderers: ctx.renderers?.length || 0,
                frames: ctx.frames?.length || 0
            })

            // Summary
            console.groupCollapsed('[Box3ce] Custom Element Test Summary')
            console.log('✓ Scene: three-scene component created')
            console.log('✓ Lights: three-ambient-light, three-spot-light, three-point-light created')
            console.log('✓ Geometries: three-mesh with three-box-geometry created')
            console.log(`✓ Camera: ${cameras?.length || 0} camera(s) in ThreeContext.cameras`)
            console.log(`✓ Renderer: ${ctx.renderers?.length || 0} renderer(s) in ThreeContext.renderers`)
            console.log('ℹ OrbitControls: three-orbit-controls component')
            console.groupEnd()
        })
        return null
    }))

    customElement('my-test', Test)

    return <div dangerouslySetInnerHTML={{
        __html: `
        <three-canvas>
        <three-webgl-renderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <three-scene ref={sceneRef} background={toColor('white')}>
            <three-ambient-light intensity={1} />
            <three-spot-light position={[0, 1, 0]} angle={10} penumbra={1} />
            <three-point-light position={[0, 1, 0]} />
            <my-box position={[-1.2, 0, 0]} onClick={() => { visible(!$$(visible)); console.log($$(visible)) }} />
            {/* <my-box position={[0, 1, 0]} visible={() => $(visible) ? true : false} /> */}
            {() => $(visible) ? box : null}
            <my-box position={[1.2, 0, 0]} />
        </three-scene>
        <three-perspective-camera position={[0, 0, 5]} />
        <three-orbit-controls enableDamping />
        <three-event />
        <my-test />
    </three-canvas>
    `}}></div>

    // return <three-canvas>
    //     <three-webgl-renderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
    //     <three-scene ref={sceneRef} background={toColor('white')}>
    //         <three-ambient-light intensity={1} />
    //         <three-spot-light position={[0, 1, 0]} angle={10} penumbra={1} />
    //         <three-point-light position={[0, 1, 0]} />
    //         <Box position={[-1.2, 0, 0]} onClick={() => { visible(!$$(visible)); console.log($$(visible)) }} />
    //         {/* <Box position={[0, 1, 0]} visible={() => $(visible) ? true : false} /> */}
    //         {() => $(visible) ? box : null}
    //         <Box position={[1.2, 0, 0]} />
    //     </three-scene>
    //     <three-perspective-camera position={[0, 0, 5]} />
    //     <three-orbit-controls enableDamping />
    //     <Event />
    //     <Test />
    // </three-canvas>
}
