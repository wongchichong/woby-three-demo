/** @jsxImportSource @woby/three */

import { $, $$, useEffect, useMemo } from "woby"

import { MeshProps, } from '@woby/three/src/objects/Mesh'
import { TextureLoader } from "three/src/loaders/TextureLoader"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { useRenderers } from '@woby/three/lib/hooks/useRenderer'
import { CSS2DRenderer } from '@woby/three/examples/jsm/renderers/CSS2DRenderer'
import { WebGLRenderer } from '@woby/three/src/renderers/WebGLRenderer'
import { Color } from '@woby/three/src/math/Color'
import { DoubleSide } from '@woby/three/src/constants'
// import * as THREE from "three"
import '@woby/three/examples/jsm/controls/OrbitControls'
import '@woby/three/examples/jsm/renderers/CSS2DRenderer'
import { Event } from '@woby/three/lib/components/Event'

import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Scene } from 'three/src/scenes/Scene'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'

function Box(props: MeshProps) {
    const texture = new TextureLoader().load('../textures/usedSteel.png')
    const hovered = $(false)
    const clicked = $(false)

    const renderers = useRenderers()
    const renderer = renderers[0]

    document.body.addEventListener("pointerdown", (e: PointerEvent) => {
        if (e.target == $$(textRenderer).domElement) {
            const myEvent = new PointerEvent('pointerdown', e)
            $$(renderer).domElement.dispatchEvent(myEvent)
        }
        else {
            (e.target as HTMLElement).click()
        }
    })

    document.body.addEventListener('pointermove', (e) => {
        if (e.target == $$(textRenderer).domElement) {
            const myEvent = new PointerEvent('pointermove', e)
            $$(renderer).domElement.dispatchEvent(myEvent)
        }
        else
            (e.target as HTMLElement).click()
    })

    // Return the view, these are regular Threejs elements expressed in JSX
    return (
        <mesh
            {...props}

            onFrame={ref => ref.rotateX(0.01)}
            scale={() => $$(clicked) ? [1.5, 1.5, 1.5] : [1, 1, 1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={() => $$(hovered) ? 'hotpink' : 'orange'} map={texture} side={DoubleSide} />
        </mesh >
    )
}

const textRenderer = $<CSS2DRenderer>()
const renderer = $<WebGLRenderer>()
const camera = $<PerspectiveCamera>()
export function BoxHtmlText() {
    const scene = $<Scene>()

    return <Canvas3D>
        <webglRenderer ref={renderer} antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} shadowMap-enabled={true} />
        <scene ref={scene} background={new Color('gray')}>
            <ambientLight intensity={0.5} />
            <spotLight position={[0, 0, 0]} angle={0.15} penumbra={1} />
            <pointLight position={[0, 5, 0]} intensity={10} castShadow shadow-camera-far={333} shadow-camera-near={0.1} />
            <Box position={[0, 1, 0]} onClick={(event) => console.log("box clicked")} />
            {/* {useMemo(() => visible() ? box : null)} */}
            {/* <Box position={[-2, 0.8, 0]} castShadow /> */}
            {/* <mesh geometry={cubeGeo} material={cubeMat} position={[0, cubeSize / 2 - 0.1, 0]} receiveShadow /> */}
            <css2dObject element={<div class='label' style={{ backgroundColor: 'transparent' }} onPointerDown={e => console.log('div clicked')}>Earth</div>} position={[0, 1.5, 0]} center={[0, 0]} />
        </scene>
        <perspectiveCamera ref={camera} position={[0, 0, 5]} />
        {() => $$(camera) && $$(renderer) ? <orbitControls camera={camera} domElement={() => $$(renderer)?.domElement} enableDamping /> : null}
        {/* <Event renderer={renderer} camera={camera} scene={scene} />
        <Event renderer={textRenderer} camera={camera} scene={scene} /> */}
        <css2dRenderer ref={textRenderer} setSize={[window.innerWidth, window.innerHeight]}
            domElement-style-position='absolute'
            domElement-style-top='0px'
        />
    </Canvas3D>
}


// const textRenderer = new CSS2DRenderer()
// textRenderer.setSize(window.innerWidth, window.innerHeight)
// textRenderer.domElement.style.position = 'absolute'
// textRenderer.domElement.style.top = '0px'

// document.body.appendChild(textRenderer.domElement)
