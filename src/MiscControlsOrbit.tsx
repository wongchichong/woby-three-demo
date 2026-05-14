/** @jsxImportSource @woby/three */

import { $, $$, useEffect } from "woby"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { OrbitControls } from '@woby/three/examples/jsm/controls/OrbitControls'
import { Color } from '@woby/three/src/math/Color'
import '@woby/three/src/geometries/BoxGeometry'
import '@woby/three/src/geometries/SphereGeometry'
import '@woby/three/src/geometries/TorusGeometry'
import '@woby/three/src/geometries/TorusKnotGeometry'
import '@woby/three/src/materials/MeshStandardMaterial'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/renderers/WebGLRenderer'
import "@woby/three/src/cameras/PerspectiveCamera"
import '@woby/three/src/lights/AmbientLight'
import '@woby/three/src/lights/DirectionalLight'
import '@woby/three/src/lights/PointLight'
import '@woby/three/src/helpers/GridHelper'
import '@woby/three/src/helpers/AxesHelper'

/**
 * OrbitControls Demo
 *
 * Demonstrates OrbitControls - the most commonly used camera control system in Three.js.
 *
 * Features:
 * - Left mouse: Rotate around target
 * - Right mouse: Pan the camera
 * - Scroll wheel: Zoom in/out
 * - Middle mouse: Pan (alternative)
 *
 * Keyboard shortcuts:
 * - O: Toggle orthographic/perspective camera
 * - D: Toggle damping (smooth camera movement)
 * - R: Reset camera position
 */
export const MiscControlsOrbit = () => {
    const enableDamping = $(true)
    const autoRotate = $(false)
    const autoRotateSpeed = $(2.0)
    const enablePan = $(true)
    const enableZoom = $(true)
    const minDistance = $(2)
    const maxDistance = $(50)
    const maxPolarAngle = $(Math.PI)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'd':
                    enableDamping(!$$(enableDamping))
                    break
                case 'a':
                    autoRotate(!$$(autoRotate))
                    break
                case 'r':
                    // Reset handled by OrbitControls internally
                    break
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    })

    return (
        <Canvas3D>
            <webglRenderer
                antialias
                setPixelRatio={[window.devicePixelRatio]}
                setSize={[window.innerWidth, window.innerHeight]}
            />
            <scene background={new Color(0x333333)}>
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 10, 7.5]} intensity={1} castShadow />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color={0xff6600} />
                <pointLight position={[10, 5, 10]} intensity={0.5} color={0x0066ff} />

                {/* Grid and axes helpers */}
                <gridHelper args={[20, 20, 0x888888, 0x444444]} />
                <axesHelper args={[5]} />

                {/* Central sphere - orbit target */}
                <mesh position={[0, 1, 0]} castShadow>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color={0xff4444} metalness={0.3} roughness={0.4} />
                </mesh>

                {/* Surrounding objects */}
                <mesh position={[3, 0.5, 0]} castShadow>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color={0x44ff44} metalness={0.5} roughness={0.3} />
                </mesh>

                <mesh position={[-3, 0.5, 0]} castShadow>
                    <torusGeometry args={[0.5, 0.2, 16, 32]} />
                    <meshStandardMaterial color={0x4444ff} metalness={0.6} roughness={0.2} />
                </mesh>

                <mesh position={[0, 0.5, 3]} castShadow>
                    <torusKnotGeometry args={[0.4, 0.15, 64, 8]} />
                    <meshStandardMaterial color={0xffff44} metalness={0.4} roughness={0.3} />
                </mesh>

                <mesh position={[0, 0.5, -3]} castShadow>
                    <sphereGeometry args={[0.6, 24, 24]} />
                    <meshStandardMaterial color={0xff44ff} metalness={0.7} roughness={0.1} />
                </mesh>

                {/* Ground plane */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                    <boxGeometry args={[20, 0.1, 20]} />
                    <meshStandardMaterial color={0x666666} />
                </mesh>
            </scene>

            <perspectiveCamera
                fov={60}
                aspect={window.innerWidth / window.innerHeight}
                near={0.1}
                far={1000}
                position={[5, 5, 5]}
            />

            <OrbitControls
                enableDamping={enableDamping}
                dampingFactor={0.05}
                autoRotate={autoRotate}
                autoRotateSpeed={autoRotateSpeed}
                enablePan={enablePan}
                enableZoom={enableZoom}
                minDistance={minDistance}
                maxDistance={maxDistance}
                maxPolarAngle={maxPolarAngle}
            />
        </Canvas3D>
    )
}

export default MiscControlsOrbit
