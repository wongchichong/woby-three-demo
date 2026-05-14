/** @jsxImportSource @woby/three */

import { $, $$, useEffect } from "woby"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { FlyControls } from '@woby/three/examples/jsm/controls/FlyControls'
import { Color } from '@woby/three/src/math/Color'
import '@woby/three/src/geometries/BoxGeometry'
import '@woby/three/src/geometries/SphereGeometry'
import '@woby/three/src/materials/MeshStandardMaterial'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/renderers/WebGLRenderer'
import "@woby/three/src/cameras/PerspectiveCamera"
import '@woby/three/src/lights/AmbientLight'
import '@woby/three/src/lights/PointLight'

/**
 * FlyControls Demo
 *
 * Demonstrates FlyControls - first-person flight-style camera controls.
 *
 * Controls:
 * - W/S: Move forward/backward
 * - A/D: Move left/right
 * - R/F: Move up/down
 * - Mouse: Look around (click to activate)
 * - Left/Right Arrow: Turn left/right
 * - Up/Down Arrow: Move forward/backward
 *
 * Features:
 * - First-person perspective
 * - Free movement in 3D space
 * - Useful for exploring large scenes
 */
export const MiscControlsFly = () => {
    const movementSpeed = $(1.0)
    const rollSpeed = $(0.005)
    const dragToLook = $(true)

    return (
        <Canvas3D>
            <webglRenderer
                antialias
                setPixelRatio={[window.devicePixelRatio]}
                setSize={[window.innerWidth, window.innerHeight]}
            />
            <scene background={new Color(0x000011)}>
                {/* Stars/spheres scattered in space */}
                {[...Array(100)].map((_, i) => {
                    const x = (Math.random() - 0.5) * 100
                    const y = (Math.random() - 0.5) * 100
                    const z = (Math.random() - 0.5) * 100
                    const color = Math.random() * 0xffffff
                    const size = Math.random() * 2 + 0.5

                    return (
                        <mesh position={[x, y, z]}>
                            <sphereGeometry args={[size, 8, 8]} />
                            <meshStandardMaterial
                                color={color}
                                emissive={color}
                                emissiveIntensity={0.5}
                            />
                        </mesh>
                    )
                })}

                {/* Larger landmark objects */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[5, 32, 32]} />
                    <meshStandardMaterial color={0xff0000} emissive={0xff0000} emissiveIntensity={0.3} />
                </mesh>

                <mesh position={[20, 10, -30]}>
                    <boxGeometry args={[10, 10, 10]} />
                    <meshStandardMaterial color={0x00ff00} emissive={0x00ff00} emissiveIntensity={0.3} />
                </mesh>

                <mesh position={[-15, -5, 25]}>
                    <boxGeometry args={[8, 8, 8]} />
                    <meshStandardMaterial color={0x0000ff} emissive={0x0000ff} emissiveIntensity={0.3} />
                </mesh>

                {/* Ambient lighting for visibility */}
                <ambientLight intensity={0.2} />
            </scene>

            <perspectiveCamera
                fov={75}
                aspect={window.innerWidth / window.innerHeight}
                near={0.1}
                far={1000}
                position={[0, 0, 50]}
            />

            <FlyControls
                movementSpeed={movementSpeed}
                rollSpeed={rollSpeed}
                dragToLook={dragToLook}
            />
        </Canvas3D>
    )
}

export default MiscControlsFly