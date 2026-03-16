/** @jsxImportSource @woby/three */

// import { Canvas3D, useFrame, useRenderer, useCamera, useThree, Line, LineProps } from '@woby/three'
import { $, $$, useEffect, } from "woby"

import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils'

import { Line2 } from '@woby/three/examples/jsm/lines/Line2'
import { GUI } from '@woby/three/examples/jsm/libs/lil-gui.module.min'
import { LineMaterial } from '@woby/three/examples/jsm/lines/LineMaterial'
import Stats from '@woby/three/examples/jsm//libs/stats.module'
// import { GPUStatsPanel } from '@woby/three/examples/jsm/utils/GPUStatsPanel';
import { OrbitControls } from '@woby/three/lib/examples/jsm/controls/OrbitControls'
import { Line } from '@woby/three/src/objects/Line'
import { useCameras } from '@woby/three/lib/hooks/useCamera'
import { useThree } from '@woby/three/lib/hooks/useThree'
import { useRenderers } from '@woby/three/lib/hooks/useRenderer'
import { useFrame } from '@woby/three/lib/hooks/useFrame'
import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import { PerspectiveCamera } from '@woby/three/src/cameras/PerspectiveCamera'
import { WebGLRenderer } from '@woby/three/src/renderers/WebGLRenderer'
import { Vector3 } from '@woby/three/src/math/Vector3'
import { Float32BufferAttribute } from '@woby/three/src/core/Float32BufferAttribute'
import { CatmullRomCurve3 } from '@woby/three/src/extras/curves/CatmullRomCurve3'
import { Color } from '@woby/three/src/math/Color'
import { SRGBColorSpace } from '@woby/three/src/constants'
import { useScenes } from '@woby/three/lib/hooks/useScene'

import '@woby/three/examples/jsm/lines/LineGeometry'
import '@woby/three/examples/jsm/libs/lil-gui.module.min'
import "@woby/three/src/renderers/WebGLRenderer"
import '@woby/three/examples/jsm/lines/Line2'
import '@woby/three/src/objects/Line'
import '@woby/three/examples/jsm/lines/LineMaterial'
import '@woby/three/src/materials/LineBasicMaterial'

//https://threejs.org/examples/?q=line#webgl_lines_fat

const Panel = () => {
    const { scenes } = useThree()
    const cameras = useCameras()
    const renderers = useRenderers()

    // $(renderer).setPixelRatio(window.devicePixelRatio)
    // $(renderer).setSize(window.innerWidth, window.innerHeight)
    // $(renderer).setClearColor(0x000000, 0.0)

    const camera2 = new PerspectiveCamera(40, 1, 1, 1000)

    const stats = new Stats()
    document.body.appendChild(stats.dom)

    let gpuPanel
    let insetWidth
    let insetHeight

    //@ts-ignore
    useEffect(() => console.log(window.scene = $(useScenes())?.[0]))


    useEffect(() => {
        const r = $(renderers)[0] as any as WebGLRenderer
        const camera = $(cameras)[0] as PerspectiveCamera
        if (!r) return null

        if (!camera) return null

        camera2.position.copy(camera.position)

        // gpuPanel = new GPUStatsPanel(r.getContext())
        // stats.addPanel(gpuPanel)
        // stats.showPanel(0)

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()

            r.setSize(window.innerWidth, window.innerHeight)

            insetWidth = window.innerHeight / 4 // square
            insetHeight = window.innerHeight / 4

            camera2.aspect = insetWidth / insetHeight
            camera2.updateProjectionMatrix()

        }

        window.addEventListener('resize', onWindowResize)
        onWindowResize()

        return () => window.removeEventListener('resize', onWindowResize)
    })


    useFrame(() => {
        const r = $$(renderers)[0] as any as WebGLRenderer
        const camera = $$(cameras)[0]
        const scene = $$(scenes)[0]

        if (!r) return
        if (!$(scenes)) return
        if (!camera) return

        r.setClearColor(0x000000, 0)
        r.setViewport(0, 0, window.innerWidth, window.innerHeight)

        gpuPanel?.startQuery()
        r.render(scene, camera)
        gpuPanel?.endQuery()

        r.setClearColor(0x222222, 1)

        r.clearDepth() // important!

        r.setScissorTest(true)

        r.setScissor(20, 20, insetWidth, insetHeight)

        r.setViewport(20, 20, insetWidth, insetHeight)

        camera2.position.copy(camera.position)
        camera2.quaternion.copy(camera.quaternion)

        r.render(scene as any, camera2)

        r.setScissorTest(false)

        // stats.update()
    })

    return null

}


export const FatLines = () => {
    const positions = []
    const colors = []

    const points = GeometryUtils.hilbert3D(new Vector3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7)

    const spline = new CatmullRomCurve3(points)
    const divisions = Math.round(12 * points.length)
    const point = new Vector3()
    const color = new Color()

    const isLineGeometry = $(true)

    for (let i = 0, l = divisions; i < l; i++) {

        const t = i / l

        spline.getPoint(t, point)
        positions.push(point.x, point.y, point.z)

        color.setHSL(t, 1.0, 0.5, SRGBColorSpace)
        colors.push(color.r, color.g, color.b)

    }

    const l2 = $<Line2>()
    const matLine = $<LineMaterial>()
    const g = $<GUI>()
    const l1 = $<Line>()


    useEffect(() => {
        if (!$$(g)) return

        const param = {
            'line type': 0,
            'world units': false,
            'width': 5,
            'alphaToCoverage': false,
            'dashed': false,
            // 'dash scale': 1,
            // 'dash / gap': 1
        }
        const gui = $$($$(g))

        gui.add(param, 'line type', { 'LineGeometry': 0, 'gl.LINE': 1 }).onChange(val => {

            switch (val) {

                case 0:
                    isLineGeometry(true)
                    break

                case 1:
                    isLineGeometry(false)
                    break

            }

        })

        gui.add(param, 'world units').onChange(val => {
            $$(matLine).worldUnits = val
            $$(matLine).needsUpdate = true
        })

        gui.add(param, 'width', 1, 10).onChange(val => $$(matLine).linewidth = val)

        gui.add(param, 'alphaToCoverage').onChange(val => $$(matLine).alphaToCoverage = val)

        // gui.add(param, 'dashed').onChange(val => {
        //     $(matLine).dashed = val
        //     $(l1).material = val ? matLineDashed : matLineBasic
        // })

        // gui.add(param, 'dash scale', 0.5, 2, 0.1).onChange(function (val) {

        //     $(matLine).dashScale = val;
        //     matLineDashed.scale = val;

        // })

        // gui.add(param, 'dash / gap', { '2 : 1': 0, '1 : 1': 1, '1 : 2': 2 }).onChange(function (val) {

        //     switch (val) {

        //         case 0:
        //             $(matLine).dashSize = 2;
        //             $(matLine).gapSize = 1;

        //             matLineDashed.dashSize = 2;
        //             matLineDashed.gapSize = 1;

        //             break;

        //         case 1:
        //             $(matLine).dashSize = 1;
        //             $(matLine).gapSize = 1;

        //             matLineDashed.dashSize = 1;
        //             matLineDashed.gapSize = 1;

        //             break;

        //         case 2:
        //             $(matLine).dashSize = 1;
        //             $(matLine).gapSize = 2;

        //             matLineDashed.dashSize = 1;
        //             matLineDashed.gapSize = 2;

        //             break;

        //     }

        // })
    })


    // useEffect(()=>{
    //     if(!$(l2))return
    //     $(l2).computeLineDistances()
    // })

    return <Canvas3D  /* camera={new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000)} */
    // renderer={new three.WebGLRenderer({ antialias: true })}
    >
        <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} />
        <scene background={new Color(0x222222)}>
            <gui ref={g} />
            <webglRenderer antialias setPixelRatio={[window.devicePixelRatio]} setSize={[window.innerWidth, window.innerHeight]} setClearColor={[0x000000, 0.0]} />
            <perspectiveCamera fov={40} aspect={window.innerWidth / window.innerHeight} near={1} far={1000} position={[-40, 0, 60]} />
            <Panel />
            <ambientLight intensity={0.5} />
            <OrbitControls minDistance={10} maxDistance={500} enableDamping />

            {/* LineGeometry */}
            <line2 ref={l2} scale={[1, 1, 1]}
                visible={() => $$(isLineGeometry)}
            // onClick={() => console.log('canvas clicked')}
            >
                <lineGeometry setPositions={[positions]} setColors={[colors]} />
                <lineMaterial ref={matLine} color={0xffffff}
                    linewidth={10} // in world units with size attenuation, pixels otherwise
                    vertexColors={true}
                    dashed={false}
                    alphaToCoverage={false} />
            </line2>

            {/* matLineDashed = new THREE.LineDashedMaterial( {vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 } ) */}

            {/* gl.Line */}
            <line ref={l1} visible={() => !$$(isLineGeometry) as any}>
                <bufferGeometry setAttribute={[['position', new Float32BufferAttribute(positions, 3)], ['color', new Float32BufferAttribute(colors, 3)]]} /* points={new three.Float32BufferAttribute(positions, 3) as any} */ />
                {/* <bufferGeometry ref={bf} points={positions} /> */}
                <lineBasicMaterial vertexColors={true} />
            </line>
        </scene>
    </Canvas3D >
}


