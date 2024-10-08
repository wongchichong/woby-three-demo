/** @jsxImportSource woby-three */

import { $, $$, useEffect } from "woby"

import { OrbitControls } from 'woby-three/lib/examples/jsm/controls/OrbitControls'
import { Canvas3D, toColor } from "woby-three/lib/components/Canvas3D"
import { Gltf } from 'woby-three/lib/examples/jsm/loaders/Gltf'
import { PointLight } from "woby-three/src/lights/PointLight"
import { Group } from "woby-three/src/objects/Group"
import "woby-three/src/cameras/OrthographicCamera"
import { Event } from "woby-three/lib/components/Event"
import { ACESFilmicToneMapping, EquirectangularReflectionMapping } from "woby-three/src/constants"
import { Vector3 } from "woby-three/src/math/Vector3"
import 'woby-three/examples/jsm/loaders/RGBELoader'
import { Rgbe } from 'woby-three/lib/examples/jsm/loaders/Rgbe'
import { DataTexture } from "woby-three/src/textures/DataTexture"

export const GltfAnisotropy = () => {
    const texture = $<DataTexture>()
    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]}
            toneMapping={ACESFilmicToneMapping} toneMappingExposure={1.35}
        // camera={new OrthographicCamera()}
        >
            <scene background={<Rgbe ref={texture} path={'models/royal_esplanade_1k.hdr'} mapping={EquirectangularReflectionMapping} />}
                backgroundBlurriness={0.1} environment={texture} >
                <ambientLight intensity={0.5} />
                <spotLight position={[0, 0, 0]} angle={0.15} penumbra={1} castShadow />
                <pointLight position={[0, 0, 0]} /* ref={lightRef} */ castShadow />
                <Gltf path={"models/AnisotropyBarnLamp.glb"} /* ref={ref} */ castShadow receiveShadow /* position={[0, 0, 0]} */ />
            </scene>
            <perspectiveCamera args={[40, window.innerWidth / window.innerHeight, 0.01, 10]} position={[- 0.35, - 0.2, 0.35]} />
            <OrbitControls enableDamping
                target={new Vector3(0, - 0.08, 0.11)}
                minDistance={0.1}
                maxDistance={2}
            // addEventListener( 'change', render );
            />
            <Event />
        </webglRenderer>
    </Canvas3D >
}