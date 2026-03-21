/** @jsxImportSource @woby/three */

import { $, $$, useMemo } from "woby"

import { Mesh, MeshProps, } from '@woby/three/src/objects/Mesh'
import { OrbitControls } from '@woby/three/lib/examples/jsm/controls/OrbitControls'
import { TextureLoader } from "three/src/loaders/TextureLoader"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { MeshPhongMaterial } from '@woby/three/src/materials/MeshPhongMaterial'
import { BoxGeometry } from '@woby/three/src/geometries/BoxGeometry'
import { BackSide } from '@woby/three/src/constants'
import { Color } from '@woby/three/src/math/Color'
import { Event } from '@woby/three/lib/components/Event'
import type { Scene } from "@woby/three/src/scenes/Scene"

function Box(props: MeshProps) {
    // This reference gives us direct access to the THREE.Mesh object
    const texture = new TextureLoader().load('../textures/usedSteel.png')

    // Hold state for hovered and useRenderer()$(false)
    const hovered = $(false)
    const clicked = $(false)

    return <mesh
        {...props}
        onFrame={ref => ref.rotation.x += 0.01}
        scale={() => $$(clicked) ? [1.5, 1.5, 1.5] : [1, 1, 1]}
        onClick={(event) => clicked(!$$(clicked))}
        onPointerOver={(event) => hovered(true)}
        onPointerOut={(event) => hovered(false)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={() => $$(hovered) ? 'hotpink' : 'orange'} map={texture} />
    </mesh>
}

export function Box2Click() {
    const visible = $(true)

    const cubeSize = 30
    const cubeGeo = useMemo(() => new BoxGeometry(cubeSize, cubeSize, cubeSize))
    const cubeMat = new MeshPhongMaterial({
        color: '#CCC',
        side: BackSide,
    })

    const scene = $<Scene>()
        ; (window as any).scene = scene

    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} shadowMap-enabled={true} />
        <scene ref={scene} background={new Color('gray')}>
            <ambientLight intensity={0.5} />
            <spotLight position={[0, 0, 0]} angle={0.15} penumbra={1} />
            <pointLight position={[0, 5, 0]} intensity={10} castShadow shadow-camera-far={333} shadow-camera-near={0.1} />
            <Box position={[0, 1, 0]} castShadow onClick={() => console.log("visible", visible())} />
            {/* {useMemo(() => visible() ? box : null)} */}
            <Box position={[-2, 0.8, 0]} castShadow />
            <mesh geometry={cubeGeo} material={cubeMat} position={[0, cubeSize / 2 - 0.1, 0]} receiveShadow />
            {/* <mesh geometry={cubeGeo} position={[0, cubeSize / 2 - 0.1, 0]} receiveShadow >
                <meshPhongMaterial color={'$ccc'} side={BackSide} />
            </mesh> */}
        </scene>
        <perspectiveCamera position={[0, 0, 5]} />
        <OrbitControls enableDamping />
        <Event />
    </Canvas3D>
}
