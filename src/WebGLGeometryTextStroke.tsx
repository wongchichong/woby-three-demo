/** @jsxImportSource @woby/three */
import * as THREE from "three"
// Text stroke geometry demo - declarative @woby/three JSX
// Scene graph is JSX; FontLoader and SVGLoader remain imperative.

import { $, $$, useEffect } from "woby"
import { Color, Group, ShapeGeometry, MeshBasicMaterial, DoubleSide, type Group as TGroup } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { Event } from '@woby/three/lib/components/Event'

// Register intrinsics
import '@woby/three/src/scenes/Scene'
import '@woby/three/src/cameras/PerspectiveCamera'
import '@woby/three/src/renderers/WebGLRenderer'
import '@woby/three/src/objects/Group'
import '@woby/three/src/objects/Mesh'
import '@woby/three/src/materials/MeshBasicMaterial'
import '@woby/three/examples/jsm/controls/OrbitControls'

export const WebGLGeometryTextStroke = () => {
    const groupRef = $<TGroup>(null)

    useEffect(() => {
        const group = $$(groupRef)
        if (!group) return

        const loader = new FontLoader()
        loader.load('fonts/helvetiker_regular.typeface.json', (font: any) => {
            const color = new Color(0x006699)

            const matDark = new MeshBasicMaterial({ color, side: DoubleSide })
            const matLite = new MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: DoubleSide })

            const material = { dark: matDark, lite: matLite, color }

            function generateStrokeText(font: any, material: any, message: string, size: number, direction = 'ltr') {
                const shapes = font.generateShapes(message, size, direction)
                const geometry = new ShapeGeometry(shapes)
                const strokeText = new Group()

                geometry.computeBoundingBox()
                const xMid = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x)
                geometry.translate(xMid, 0, 0)

                const text = new THREE.Mesh(geometry, material.lite)
                text.position.z = -150
                strokeText.add(text)

                const holeShapes: any[] = []
                for (let i = 0; i < shapes.length; i++) {
                    const shape = shapes[i]
                    if (shape.holes && shape.holes.length > 0) {
                        for (let j = 0; j < shape.holes.length; j++) {
                            holeShapes.push(shape.holes[j])
                        }
                    }
                }
                shapes.push(...holeShapes)

                const style = SVGLoader.getStrokeStyle(5, material.color.getStyle())

                for (let i = 0; i < shapes.length; i++) {
                    const shape = shapes[i]
                    const points = shape.getPoints()
                    const strokeGeometry = SVGLoader.pointsToStroke(points, style)
                    strokeGeometry.translate(xMid, 0, 0)
                    const strokeMesh = new THREE.Mesh(strokeGeometry, material.dark)
                    strokeText.add(strokeMesh)
                }

                return strokeText
            }

            const english = '   Three.js\nStroke text.'
            const hebrew = 'טקסט קו'
            const chinese = '文字描邊'

            const message1 = generateStrokeText(font, material, english, 80, 'ltr')
            const message2 = generateStrokeText(font, material, hebrew, 80, 'rtl')
            const message3 = generateStrokeText(font, material, chinese, 80, 'tb')

            message1.position.x = -100
            message2.position.x = -100
            message2.position.y = -300
            message3.position.x = 300
            message3.position.y = -300

            group.add(message1, message2, message3)
        })
    })

    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene background={new Color(0xf0f0f0)}>
            <group ref={groupRef} />
        </scene>
        <perspectiveCamera args={[45, window.innerWidth / window.innerHeight, 1, 10000]} position={[0, -400, 1000]} />
        <orbitControls target={[0, 0, 0]} />
        <Event />
    </Canvas3D>
}

export default WebGLGeometryTextStroke