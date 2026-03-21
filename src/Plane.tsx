/** @jsxImportSource @woby/three */

import { $, $$, } from "woby"

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
import '@woby/three/src/geometries/PlaneGeometry'
import '@woby/three/src/materials/MeshStandardMaterial'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/scenes/Scene'
import '@woby/three/src/renderers/WebGLRenderer'
import "@woby/three/src/cameras/PerspectiveCamera"
import { DoubleSide } from "three/src/constants"
import { useLoader } from '@woby/three/lib/hooks/useLoader'
import type { Scene } from "@woby/three/src/scenes/Scene"

const Plane = (props: MeshProps) => {
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
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={() => $$(hovered) ? 'hotpink' : 'orange'} map={texture}
            side={DoubleSide} />
    </mesh>
}

export const Plane3 = () => {
    const visible = $(false)
    const box = <Plane position={[0, 1, 0]} />

    const scene = $<Scene>()

        ; (window as any).scene = scene


    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene ref={scene} background={toColor('white')}>
            <ambientLight intensity={1} />
            <spotLight position={[0, 1, 0]} angle={10} penumbra={1} />
            <pointLight position={[0, 1, 0]} />
            <Plane position={[-1.2, 0, 0]} onClick={() => { visible(!$$(visible)); console.log($$(visible)) }} />
            {/* <Box position={[0, 1, 0]} visible={() => $$(visible) ? true : false} /> */}
            {() => $$(visible) ? box : null}
            <Plane position={[1.2, 0, 0]} />
        </scene>
        <perspectiveCamera position={[0, 0, 5]} />
        <OrbitControls enableDamping />
        <Event />
    </Canvas3D>
}