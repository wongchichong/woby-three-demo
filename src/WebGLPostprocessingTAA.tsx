/** @jsxImportSource @woby/three */

import { useEffect } from "woby"
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { EffectComposer } from '@woby/three/examples/jsm/postprocessing/EffectComposer'
import { TAARenderPass } from '@woby/three/examples/jsm/postprocessing/TAARenderPass'
import { OutputPass } from '@woby/three/examples/jsm/postprocessing/OutputPass'
import { Color } from "@woby/three/src/math/Color"
import { WebGLRenderer as TWebGLRenderer } from 'three'
import { useThree } from '@woby/three/lib/hooks/useThree'
import { useRenderers } from '@woby/three/lib/hooks/useRenderer'
import { useScenes } from '@woby/three/lib/hooks/useScene'
import { useCameras } from '@woby/three/lib/hooks/useCamera'
import { EffectComposer as EC, TAARenderPass as TAA, OutputPass as OP } from '@woby/three/examples/jsm/postprocessing'

// Register Three.js classes
import '@woby/three/src/renderers/WebGLRenderer'
import '@woby/three/src/scenes/Scene'
import '@woby/three/src/cameras/PerspectiveCamera'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/materials/MeshBasicMaterial'
import '@woby/three/src/materials/MeshStandardMaterial'
import '@woby/three/src/geometries/BoxGeometry'
import '@woby/three/src/lights/AmbientLight'
import '@woby/three/src/lights/DirectionalLight'
import '@woby/three/src/objects/Group'
import '@woby/three/examples/jsm/controls/OrbitControls'

const TAASetup = () => {
    const { update } = useThree()
    const renderers = useRenderers()
    const scenes = useScenes()
    const cameras = useCameras()

    useEffect(() => {
        const renderer = renderers[0] as TWebGLRenderer | undefined
        const scene = scenes[0]
        const camera = cameras[0]

        if (!renderer || !scene || !camera) {
            setTimeout(() => update(Math.random()), 50)
            return
        }

        const composer = new EC(renderer)

        // TAARenderPass replaces RenderPass - it handles scene rendering with jitter
        const taaPass = new TAA(scene, camera)
        taaPass.sampleLevel = 2
        taaPass.accumulate = true
        composer.addPass(taaPass)

        // Add OutputPass for final rendering
        const outputPass = new OP()
        composer.addPass(outputPass)

        renderer.setAnimationLoop(() => {
            composer.render()
        })

        update(Math.random())

        return () => {
            renderer.setAnimationLoop(null)
            composer.dispose()
        }
    })

    return null
}

export const WebGLPostprocessingTAA = () => {
    return (
        <Canvas3D>
            <webglRenderer setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
            <scene background={new Color(0x111111)}>
                <ambientLight intensity={1.0} />
                <directionalLight position={[5, 5, 5]} intensity={2} />

                {/* Rotating box (wireframe) */}
                <group position={[-2, 0, 0]} onFrame={(self) => {
                    self.rotation.x += 0.005
                    self.rotation.y += 0.01
                }}>
                    <mesh>
                        <boxGeometry args={[1.5, 1.5, 1.5]} />
                        <meshBasicMaterial color={0xffffff} wireframe />
                    </mesh>
                </group>

                {/* Solid box */}
                <group position={[2, 0, 0]} onFrame={(self) => {
                    self.rotation.x += 0.005
                    self.rotation.y += 0.01
                }}>
                    <mesh>
                        <boxGeometry args={[1.5, 1.5, 1.5]} />
                        <meshStandardMaterial color={0x4488ff} roughness={0.3} metalness={0.7} />
                    </mesh>
                </group>

                {/* Background objects */}
                {[...Array(15)].map((_, i) => {
                    const angle = (i / 15) * Math.PI * 2
                    const r = 5
                    return (
                        <mesh
                            key={i}
                            position={[Math.cos(angle) * r, Math.sin(i) * 2, Math.sin(angle) * r - 5]}
                            onFrame={(self) => {
                                self.rotation.x += 0.003 * (i % 3 + 1)
                                self.rotation.y += 0.004 * (i % 3 + 1)
                            }}
                        >
                            <boxGeometry args={[0.5, 0.5, 0.5]} />
                            <meshStandardMaterial
                                color={new Color().setHSL(i / 15, 0.6, 0.5)}
                                roughness={0.3}
                                metalness={0.5}
                            />
                        </mesh>
                    )
                })}
            </scene>
            <perspectiveCamera fov={60} aspect={window.innerWidth / window.innerHeight} near={0.1} far={100} position={[0, 3, 8]} />
            <orbitControls enableDamping />
            <TAASetup />
        </Canvas3D>
    )
}

export default WebGLPostprocessingTAA
