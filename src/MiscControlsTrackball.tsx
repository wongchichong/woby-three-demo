/** @jsxImportSource @woby/three */

import { $, $$, useEffect } from "woby"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { TrackballControls } from '@woby/three/examples/jsm/controls/TrackballControls'
import { Color } from '@woby/three/src/math/Color'
import '@woby/three/src/geometries/TorusKnotGeometry'
import '@woby/three/src/materials/MeshNormalMaterial'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/renderers/WebGLRenderer'
import "@woby/three/src/cameras/PerspectiveCamera"
import '@woby/three/src/lights/AmbientLight'
import '@woby/three/src/lights/DirectionalLight'

/**
 * TrackballControls Demo
 *
 * Demonstrates TrackballControls - similar to OrbitControls but allows free rotation
 * without constraining to a specific up direction.
 *
 * Controls:
 * - Left mouse: Rotate freely
 * - Middle mouse: Zoom
 * - Right mouse: Pan
 *
 * Features:
 * - No "up" constraint - can rotate freely in any direction
 * - Good for inspecting 3D models from any angle
 * - Similar to trackball rotation in CAD software
 */
export const MiscControlsTrackball = () => {
    const rotateSpeed = $(1.0)
    const zoomSpeed = $(1.2)
    const panSpeed = $(0.3)
    const noRotate = $(false)
    const noZoom = $(false)
    const noPan = $(false)
    const staticMoving = $(true)
    const dynamicDampingFactor = $(0.2)

    return (
        <Canvas3D>
            <webglRenderer
                antialias
                setPixelRatio={[window.devicePixelRatio]}
                setSize={[window.innerWidth, window.innerHeight]}
            />
            <scene background={new Color(0x222222)}>
                {/* Torus knot - interesting geometry to rotate around */}
                <mesh castShadow>
                    <torusKnotGeometry args={[3, 0.8, 128, 32]} />
                    <meshNormalMaterial />
                </mesh>

                {/* Ambient light for visibility */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 7]} intensity={0.8} />
            </scene>

            <perspectiveCamera
                fov={60}
                aspect={window.innerWidth / window.innerHeight}
                near={0.1}
                far={1000}
                position={[0, 0, 15]}
            />

            <TrackballControls
                rotateSpeed={rotateSpeed}
                zoomSpeed={zoomSpeed}
                panSpeed={panSpeed}
                noRotate={noRotate}
                noZoom={noZoom}
                noPan={noPan}
                staticMoving={staticMoving}
                dynamicDampingFactor={dynamicDampingFactor}
            />
        </Canvas3D>
    )
}

export default MiscControlsTrackball