/** @jsxImportSource @woby/three */
// Dashed lines demo - declarative @woby/three JSX
// Scene graph is JSX; hilbert3D geometry generation remains imperative.

import { $, useEffect } from "woby"
import { Color, Fog, CatmullRomCurve3, BufferGeometry, Line, LineDashedMaterial, LineSegments, Float32BufferAttribute, Vector3 } from 'three'
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js'

import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { Event } from '@woby/three/lib/components/Event'
import { useFrame } from '@woby/three/lib/hooks/useFrame'

// Register intrinsics
import '@woby/three/src/scenes/Scene'
import '@woby/three/src/cameras/PerspectiveCamera'
import '@woby/three/src/renderers/WebGLRenderer'

const subdivisions = 6
const recursion = 1

const points = GeometryUtils.hilbert3D(new Vector3(0, 0, 0), 25.0, recursion, 0, 1, 2, 3, 4, 5, 6, 7)
const spline = new CatmullRomCurve3(points)

const samples = spline.getPoints(points.length * subdivisions)
const geometrySpline = new BufferGeometry().setFromPoints(samples)

const line = new Line(geometrySpline, new LineDashedMaterial({ color: 0xffffff, dashSize: 1, gapSize: 0.5 }))
line.computeLineDistances()

function createBoxGeometry(width: number, height: number, depth: number) {
    width = width * 0.5
    height = height * 0.5
    depth = depth * 0.5

    const geometry = new BufferGeometry()
    const position: number[] = []

    position.push(
        -width, -height, -depth,
        -width, height, -depth,
        -width, height, -depth,
        width, height, -depth,
        width, height, -depth,
        width, -height, -depth,
        width, -height, -depth,
        -width, -height, -depth,
        -width, -height, depth,
        -width, height, depth,
        -width, height, depth,
        width, height, depth,
        width, height, depth,
        width, -height, depth,
        width, -height, depth,
        -width, -height, depth,
        -width, -height, -depth,
        -width, -height, depth,
        -width, height, -depth,
        -width, height, depth,
        width, height, -depth,
        width, height, depth,
        width, -height, -depth,
        width, -height, depth
    )

    geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    return geometry
}

const geometryBox = createBoxGeometry(50, 50, 50)
const lineSegments = new LineSegments(geometryBox, new LineDashedMaterial({ color: 0xffaa00, dashSize: 3, gapSize: 1 }))
lineSegments.computeLineDistances()

export const WebGLLinesDashed = () => {
    useFrame(() => {
        const time = Date.now() * 0.001

        line.rotation.x = 0.25 * time
        line.rotation.y = 0.25 * time

        lineSegments.rotation.x = 0.25 * time
        lineSegments.rotation.y = 0.25 * time
    })

    return <Canvas3D>
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene background={new Color(0x111111)} fog={new Fog(0x111111, 150, 200)}>
            <primitive object={line} />
            <primitive object={lineSegments} />
        </scene>
        <perspectiveCamera args={[60, window.innerWidth / window.innerHeight, 1, 200]} position={[0, 0, 150]} />
        <Event />
    </Canvas3D>
}

export default WebGLLinesDashed