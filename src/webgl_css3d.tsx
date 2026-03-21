/** @jsxImportSource @woby/three */

//https://codepen.io/trusktr/pen/RjzKJx?editors=1111

// import { OrbitControls } from '@woby/three/lib/examples/jsm/controls/OrbitControls'
import { OrbitControls } from '@woby/three/examples/jsm/controls/OrbitControls'

import { Canvas3D } from '@woby/three/lib/components/Canvas3D'
import '@woby/three/lib/components/Frame'
import { toColor } from '@woby/three/lib/utils'

// import { Vector3 } from '@woby/three/src/math/Vector3'
// import { LineBasicMaterial } from '@woby/three/src/materials/LineBasicMaterial'
// import '@woby/three/src/math/Line3'
// import '@woby/three/src/geometries/EdgesGeometry'
// import '@woby/three/src/materials/LineBasicMaterial'
// import '@woby/three/src/objects/LineSegments'
// import '@woby/three/src/geometries/CircleGeometry'

import '@woby/three/examples/jsm/renderers/CSS3DRenderer'
import '@woby/three/examples/jsm/controls/TrackballControls'
import { CSS3DObject, CSS3DRenderer } from '@woby/three/examples/jsm/renderers/CSS3DRenderer'
import { $, $$, useEffect, type JSX, createElement, setRef } from 'woby'
import { Vector3 } from '@woby/three/src/math/Vector3'
import { Object3D, Object3DProps } from '@woby/three/src/core/Object3D'
import { PerspectiveCamera } from '@woby/three/src/cameras/PerspectiveCamera'
import { Scene } from '@woby/three/src/scenes/Scene'
import TWEEN from 'three/examples/jsm/libs/tween.module'
import { useAspect, useWindowSize } from '@woby/use'
import { useFrame } from '@woby/three/lib/hooks/useFrame'
import { useThree } from '@woby/three/lib/hooks/useThree'
import { TrackballControls } from '@woby/three/examples/jsm/controls/TrackballControls'
import { MeshPhongMaterial } from '@woby/three/src/materials/MeshPhongMaterial'
import { DoubleSide, NoBlending, PCFSoftShadowMap } from '@woby/three/src/constants'
import { SphereGeometry } from '@woby/three/src/geometries/SphereGeometry'
import { Float32BufferAttribute } from '@woby/three/src/core/Float32BufferAttribute'
import { Color } from '@woby/three/src/math/Color'
import { Mesh } from '@woby/three/src/objects/Mesh'
import { AmbientLight } from '@woby/three/src/lights/AmbientLight'
import { PointLight } from '@woby/three/src/lights/PointLight'
import { PointLightHelper } from '@woby/three/src/helpers/PointLightHelper'
import '@woby/three/src/materials/MeshPhongMaterial'
import { WebGLRenderer } from '@woby/three/src/renderers/WebGLRenderer'
import '@woby/three/src/helpers/PointLightHelper'
import '@woby/three/lib/components/Frame'
import { BoxGeometry } from '@woby/three/src/geometries/BoxGeometry'

// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry"

export const WebGLCss3d2 = () => {
    const aspect = useAspect()
    const { width, height } = useWindowSize()
    const renderer = $<WebGLRenderer>()
    const renderer2 = $<CSS3DRenderer>()
    const scene = $<Scene>()
    const camera = $<PerspectiveCamera>()
    const btn = $<CSS3DObject>()

    useEffect(() => {
        if (!$$(scene) || !$$(renderer) || !$$(renderer2)) return

        const root = new Object3D()
        root.position.y = 20
        // root.rotation.y = Math.PI / 3
        // $$(scene).add(root)

        const background = makeElementObject('div', 200, 200)
        background.css3dObject.element.textContent = "I am a <div> element intersecting a WebGL sphere.\n\nThis text is editable!"
        background.css3dObject.element.setAttribute('contenteditable', '')
        background.position.z = 20
        background.css3dObject.element.style.opacity = "1"
        background.css3dObject.element.style.padding = '10px'
        const color1 = '#7bb38d'
        const color2 = '#71a381'
        background.css3dObject.element.style.background = `repeating-linear-gradient(
        45deg,
        ${color1},
        ${color1} 10px,
        ${color2} 10px,
        ${color2} 20px
    )`
        root.add(background)

        const button = makeElementObject('button', 75, 20)
        button.css3dObject.element.style.border = '2px solid #fa5a85'
        button.css3dObject.element.textContent = "Click me!"
        button.css3dObject.element.addEventListener('pointerdown', () => alert('You clicked a <button> element in the DOM!'))
        button.position.y = 10
        button.position.z = 10
        button.css3dObject.element.style.background = '#e64e77'
        background.add(button)

        // make a geometry that we will clip with the DOM elememt.
        var material = new MeshPhongMaterial({
            color: 0x991d65,
            emissive: 0x000000,
            specular: 0x111111,
            side: DoubleSide,
            flatShading: false,
            shininess: 30,
            vertexColors: true,
        })

        let geometry = new SphereGeometry(70, 32, 32)

        // give the geometry custom colors for each vertex {{
        geometry = geometry.toNonIndexed() as any // ensure each face has unique vertices

        const position = geometry.attributes.position
        var colors = []

        const color = new Color
        for (var i = 0, l = position.count; i < l; i++) {
            color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.15 + 0.85)
            colors.push(color.r, color.g, color.b)
        }

        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        // }}

        const sphere = new Mesh(geometry, material)
        sphere.position.z = 20
        sphere.position.y = -100
        sphere.castShadow = true
        sphere.receiveShadow = false
        root.add(sphere)

        // light
        var ambientLight = new AmbientLight(0x999999, 1.5)
        root.add(ambientLight)

        const light = new PointLight(0xffffff, 1, 0)
        light.castShadow = true
        light.position.z = 150
        light.shadow.mapSize.width = 1024  // default
        light.shadow.mapSize.height = 1024 // default
        light.shadow.camera.near = 1       // default
        light.shadow.camera.far = 2000      // default

        $$(scene).add(new PointLightHelper(light, 10))

        root.add(light)

        const windowHalfX = window.innerWidth / 2
        const windowHalfY = window.innerHeight / 2

        // const camera = new PerspectiveCamera();
        // camera.position.set(0, 0, 500);

        // renderer2 = new CSS3DRenderer();
        $$(renderer2).domElement.style.position = 'absolute'
        $$(renderer2).domElement.style.top = '0px'
        // document.querySelector('#css').appendChild(renderer2.domElement);

        // renderer = new WebGLRenderer({ alpha: true, antialias: true });
        $$(renderer).setClearColor(0x000000, 0)
        // $$(renderer).domElement.style.top = '100px';
        $$(renderer).setPixelRatio(window.devicePixelRatio)
        $$(renderer).shadowMap.enabled = true
        $$(renderer).shadowMap.type = PCFSoftShadowMap // default PCFShadowMap
        // document.querySelector('#webgl').appendChild(renderer.domElement);

        const oc = new OrbitControls($$(camera), $$(renderer2).domElement)

        window.addEventListener('resize', resize)
        animate(performance.now())
        resize()

        function resize() {
            $$(camera).fov = 45
            $$(camera).aspect = window.innerWidth / window.innerHeight
            $$(camera).near = 1
            $$(camera).far = 2000
            $$(camera).updateProjectionMatrix()
            $$(renderer2).setSize(window.innerWidth, window.innerHeight)
            $$(renderer).setSize(window.innerWidth, window.innerHeight)
        }

        function animate(time) {

            light.position.x = 30 * Math.sin(time * 0.003) + 30
            light.position.y = 40 * Math.cos(time * 0.001) - 20
            // background.rotation.y = Math.PI / 8 * Math.cos(time * 0.001) - Math.PI / 6;
            // background.rotation.x = Math.PI / 10 * Math.sin(time * 0.001) - Math.PI / 10;
            sphere.rotation.x += 0.005
            sphere.rotation.y += 0.005

            $$(scene).updateMatrixWorld()

            $$(renderer).render($$(scene), $$(camera))
            $$(renderer2).render($$(scene), $$(camera))

            requestAnimationFrame(animate)
        }

        function makeElementObject(type, width, height) {
            const obj: Object3D & { css3dObject: CSS3DObject; lightShadowMesh: Mesh } = new Object3D as any

            const element = document.createElement(type)
            element.style.width = width + 'px'
            element.style.height = height + 'px'
            element.style.opacity = 0.999
            element.style.boxSizing = 'border-box'

            var css3dObject = new CSS3DObject(element)
            obj.css3dObject = css3dObject
            obj.add(css3dObject)

            // make an invisible plane for the DOM element to chop
            // clip a WebGL geometry with it.
            var material = new MeshPhongMaterial({
                opacity: 0.15,
                color: new Color(0x111111),
                blending: NoBlending,
                // side	: DoubleSide,
            })
            var geometry = new BoxGeometry(width, height, 1)
            var mesh = new Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true
            obj.lightShadowMesh = mesh
            obj.add(mesh)

            return obj
        }

        // setTimeout(() => console.log(background.css3dObject.element), 1000)

        console.log($$(scene))
    })

    useEffect(() => $$(btn)?.element.addEventListener('pointerdown', () => alert('btn pointer down')))

    const element = document.createElement('div')
    element.style.width = width + 'px'
    element.style.height = height + 'px'
    element.style.opacity = '1'
    element.style.boxSizing = 'border-box'
    element.textContent = "I am a <div> element intersecting a WebGL sphere. This text is editable!"
    element.setAttribute('contenteditable', '')
    element.style.opacity = "1"
    element.style.padding = '10px'
    const color1 = '#7bb38d'
    const color2 = '#71a381'
    element.style.background = `repeating-linear-gradient(
        45deg,
        ${color1},
        ${color1} 10px,
        ${color2} 10px,
        ${color2} 20px
    )`

    return <Canvas3D>

        <css3dRenderer ref={renderer2} setSize={() => [$$(width), $$(height)]} >

        </css3dRenderer>

        <webglRenderer ref={renderer} alpha antialias setPixelRatio={[window.devicePixelRatio]} setSize={() => [$$(width), $$(height)]} setClearColor={[0x000000, 0]}
            shadowMap-enabled={true}
            shadowMap-type={PCFSoftShadowMap} >

        </webglRenderer>

        <scene ref={scene}>
            <object3d position={[0, 0, 20]}>
                <css3dObject element={//element
                    <div contentEditable={'plaintext-only'} class='box-border opacity-[0.999] p-2.5 w-[200px] h-[50px]'
                        style={{
                            background: `repeating-linear-gradient(
                        45deg,
                        ${color1},
                        ${color1} 10px,
                        ${color2} 10px,
                        ${color2} 20px
                    )`}} onClick={e => alert('Div clicked')}>I am a &lt;div&gt; intersecting a WebGL sphere.<br /><br />This text is editable!
                        {/* <button class='[border:2px_solid_#fa5a85] bg:[#e64e77]' onClick={() => alert('You clicked a <button> element in the DOM!')}>Click me!</button> */}
                    </div>

                } />

                <mesh castShadow receiveShadow>
                    <meshPhongMaterial {...{
                        opacity: 0.15,
                        color: new Color(0x111111),
                        blending: NoBlending,
                        // side	: DoubleSide,
                    }} />
                    <boxGeometry args={[200, 200, 1]} />
                </mesh>
            </object3d>


            {/* <object3d onPointerDown={e => console.log('hello object3d clicked')}> */}
            {/* <css3dObject ref={btn} position={[0, 0, 50]} element={<button >HELLO</button>} element-onPointerDown={e => console.log('hello clicked')} /> */}
            {/* <mesh castShadow receiveShadow>
                <boxGeometry args={() => [$$(width), $$(height), 1]} />
                <meshPhongMaterial args={{
                    opacity: 0.15,
                    color: new Color(0x111111),
                    blending: NoBlending,
                    // side	: DoubleSide,
                }} />
            </mesh> */}
            {/* </object3d> */}

        </scene>


        <perspectiveCamera ref={camera} position={[0, 0, 1000]} fov={45} near={1} far={2000} />

        {/* <trackballControls ref={control} object={camera} domElement={() => $(css3d)?.domElement} minDistance={500} maxDistance={6000} /> */}

        {/* <orbitControls ref={control}  camera={camera} domElement={() => $$(renderer2)?.domElement} /> */}
    </Canvas3D>
}

export const WebGLCss3d = () => {
    const aspect = useAspect()
    const { width, height } = useWindowSize()

    const color1 = '#7bb38d'
    const color2 = '#71a381'
    const background = $<Object3D>()

    // give the geometry custom colors for each vertex {{

    const geometry = new SphereGeometry(70, 32, 32).toNonIndexed() // ensure each face has unique vertices

    const position = geometry.attributes.position
    var colors = []

    const color = new Color
    for (var i = 0, l = position.count; i < l; i++) {
        color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.15 + 0.85)
        colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))

    const light = $<PointLight>()


    //    scene.add(root)


    const windowHalfX = window.innerWidth / 2
    const windowHalfY = window.innerHeight / 2

    const camera = $<PerspectiveCamera>()
    const renderer2 = $<CSS3DRenderer>()
    const renderer = $<WebGLRenderer>()
    const scene = $<Scene>()

    window.addEventListener('resize', resize)
    resize()

    function resize() {
        if (!$$(camera)) return
        $$(camera).fov = 45
        $$(camera).aspect = window.innerWidth / window.innerHeight
        $$(camera).near = 1
        $$(camera).far = 2000
        $$(camera).updateProjectionMatrix()
        $$(renderer2).setSize(window.innerWidth, window.innerHeight)
        $$(renderer).setSize(window.innerWidth, window.innerHeight)
    }

    useEffect(() => {
        if (!$$(camera)) return
        if (!$$(renderer)) return
        if (!$$(renderer2)) return

        resize()
    })

    useEffect(() => {
        if (!$$(light)) return

        $$(light).shadow.mapSize.width = 1024
        $$(light).shadow.mapSize.height = 1024
        $$(light).shadow.camera.near = 1
        $$(light).shadow.camera.far = 2000
    })

    function animate(time = 1) {

        $$(light).position.x = 30 * Math.sin(time * 0.003) + 30
        $$(light).position.y = 40 * Math.cos(time * 0.001) - 20
        $$(background).rotation.y = Math.PI / 8 * Math.cos(time * 0.001) - Math.PI / 6
        $$(background).rotation.x = Math.PI / 10 * Math.sin(time * 0.001) - Math.PI / 10


        $$(scene).updateMatrixWorld()

        $$(renderer).render($$(scene), $$(camera))
        $$(renderer2).render($$(scene), $$(camera))

        requestAnimationFrame(animate)
    }

    function ElementObject({ ref, element, width = 200, height = 200, children, ...props }: Object3DProps & { element: JSX.Child, width?: number, height?: number, }) {
        const css3dObject = $<CSS3DObject>()

        // const obj = $<Object3D>()
        const lightShadowMesh = $<Mesh>()

        const myRef = $<Object3D>()
        useEffect(() => { setRef($$(myRef), ref) })

        console.log($$(width), $$(height))
        return <object3d ref={myRef} {...props}>
            <css3dObject ref={css3dObject} element={element} />
            <mesh ref={lightShadowMesh} castShadow receiveShadow>
                <boxGeometry args={[() => $$(width), () => $$(height), 1]} />
                <meshPhongMaterial args={{
                    opacity: 0.15,
                    color: new Color(0x111111),
                    blending: NoBlending,
                    // side	: DoubleSide,
                }} />
            </mesh>
            {children as JSX.Child}
        </object3d>


        // const element = createElement(type, props);
        // element.style.width = width + 'px';
        // element.style.height = height + 'px';
        // element.style.opacity = 0.999;
        // element.style.boxSizing = 'border-box'

        // make an invisible plane for the DOM element to chop
        // clip a WebGL geometry with it.
    }

    useEffect(() => {
        if (!$$(renderer2)) return
        $$(renderer2).domElement.style.position = 'absolute'
        $$(renderer2).domElement.style.top = '0'
    })

    useEffect(() => console.log('scene', $$(scene)))

    // useEffect(() => {
    //     if (!$$(renderer2)) return

    //     $$(renderer2).domElement.style.border = '1px solid black'
    //     $$(renderer2).domElement.style.position = 'absolute'
    //     $$(renderer2).domElement.style.top = '0'
    // })

    const div = $<HTMLDivElement>()

    return <Canvas3D>

        <css3dRenderer ref={renderer2} setSize={() => [$$(width), $$(height)]} >

        </css3dRenderer>

        <webglRenderer ref={renderer} alpha antialias setPixelRatio={[window.devicePixelRatio]} setSize={[1000, 1000]} setClearColor={[0x000000, 0]}
            shadowMap-enabled={true}
            shadowMap-type={PCFSoftShadowMap} >
            <scene ref={scene}>
                <pointLightHelper sphereSize={10} light={light} />

                <object3d position={[0, 20, 0]} rotation={[0, Math.PI / 3, 0]} >
                    <ElementObject ref={background} receiveShadow element={
                        <div contentEditable={'plaintext-only'} class='box-border opacity-[0.999] p-2.5 w-[200px] h-[50px]'
                            style={{
                                background: `repeating-linear-gradient(
        45deg,
        ${color1},
        ${color1} 10px,
        ${color2} 10px,
        ${color2} 20px
    )`}} onClick={e => alert('Div clicked')}>I am a &lt;div&gt; intersecting a WebGL sphere.<br /><br />This text is editable!
                            {/* <button class='[border:2px_solid_#fa5a85] bg:[#e64e77]' onClick={() => alert('You clicked a <button> element in the DOM!')}>Click me!</button> */}
                        </div>}
                        position={[0, 0, 20]} width={200} height={200} >
                        <ElementObject element={<button class='box-border opacity-[0.999] [border:2px_solid_#fa5a85] bg:[#e64e77] w-[75px] h-[20px]' onPointerDown={() => alert('You clicked a <button> element in the DOM!')}>Click me!</button>}
                            width={75} height={20} position={[0, 0, 40]} castShadow>

                        </ElementObject>
                    </ElementObject>

                    <mesh geometry={geometry} position={[0, -10, 20]} receiveShadow
                        onFrame={sphere => {
                            sphere.rotation.x += 0.005
                            sphere.rotation.y += 0.005
                        }}>
                        <meshPhongMaterial {...{
                            color: 0x991d65,
                            emissive: 0x000000,
                            specular: 0x111111,
                            side: DoubleSide,
                            flatShading: false,
                            shininess: 30,
                            vertexColors: true,
                        }} />
                    </mesh>
                    <ambientLight args={[new Color(.6, .6, .6), 1.5]} />
                    {/* <pointLight position={[0, 5, 0]} intensity={10} castShadow shadow-camera-far={333} shadow-camera-near={0.1} /> */}

                    <pointLight ref={light} args={[0xffffff, 10, 0]} castShadow position={[0, 0, 150]}
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-near={1}
                        shadow-camera-far={2000} />
                </object3d>

                <frame onFrame={() => {
                    animate()
                    // requestAnimationFrame(animate);

                    // TWEEN.update();
                    // $(control)?.update();

                    // $$(renderer).render($$(scene), $$(camera))

                }} />
            </scene>

        </webglRenderer>

        <perspectiveCamera ref={camera} position={[0, 0, 1000]} fov={45} near={1} far={2000} />

        {/* <trackballControls ref={control} object={camera} domElement={() => $(css3d)?.domElement} minDistance={500} maxDistance={6000} /> */}

        {/* <orbitControls camera={camera} domElement={() => $$(renderer2)?.domElement} /> */}
    </Canvas3D>
}
