

import { $, $$, useEffect, useMemo } from "woby"
import { useFrame, useThree, render, MeshProps } from "woby-three"
import { BackSide, BoxGeometry, CameraHelper, Color, DoubleSide, Mesh, MeshPhongMaterial, MeshStandardMaterial, PointLight, PointLightHelper, Raycaster, TextureLoader, Vector2 } from "three"
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import * as THREE from 'three'
import * as GeometryUtils from 'three/addons/utils/'

function Box(props: MeshProps) {
    // This reference gives us direct access to the THREE.Mesh object
    const texture = new TextureLoader().load('../textures/usedSteel.png')
    const ref = $<Mesh>()
    // Hold state for hovered and clicked events
    const hovered = $(false)
    const clicked = $(false)
    // Subscribe this component to the render-loop, rotate the mesh every frame
    useFrame(() => $$(ref)?.rotateX(0.01))

    const scene = useThree("scene")
    const renderer = useThree("renderer")
    const camera = useThree("camera")

    renderer(new THREE.WebGLRenderer({ antialias: true }))
    $$(renderer).setPixelRatio(window.devicePixelRatio)
    $$(renderer).setClearColor(0x000000, 0.0)
    $$(renderer).setSize(window.innerWidth, window.innerHeight)

    camera(new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000))

    // <perspectiveCamera fov={40} aspect={window.innerWidth / window.innerHeight} near={1} far={1000} position={[- 40, 0, 60]} />

    // $$(renderer).shadowMap.enabled = true
    // $$(scene).background = new Color("grey")

    useEffect(() => {
        if (!$$(ref))
            return

        $$(ref).add(label)
    })

    const div = document.createElement('div')
    div.className = 'label'
    div.textContent = 'Earth'
    div.style.backgroundColor = 'transparent'

    div.addEventListener("pointerdown", (e) => {
        console.log("div clicked")
    })

    const label = new CSS2DObject(div)
    label.position.set(0, 2, 0)
    label.center.set(0, 0)
    $$(scene).add(label)


    const textRenderer = new CSS2DRenderer()
    textRenderer.setSize(window.innerWidth, window.innerHeight)
    textRenderer.domElement.style.position = 'absolute'
    textRenderer.domElement.style.top = '0px'

    document.body.appendChild(textRenderer.domElement)

    document.body.addEventListener("pointerdown", (e: PointerEvent) => {
        if (e.target == textRenderer.domElement) {
            const myEvent = new PointerEvent('pointerdown', e)
            $$(renderer).domElement.dispatchEvent(myEvent)
        }
        else
            (e.target as HTMLElement).click()
    })

    document.body.addEventListener('pointermove', (e) => {
        if (e.target == textRenderer.domElement) {
            const myEvent = new PointerEvent('pointermove', e)
            $$(renderer).domElement.dispatchEvent(myEvent)
        }
        else
            (e.target as HTMLElement).click()
    })

    useFrame(() => { textRenderer.render($$(scene), $$(camera)) })

    const points = []
    points.push(new THREE.Vector3(- 10, 0, 0))
    points.push(new THREE.Vector3(0, 10, 0))
    points.push(new THREE.Vector3(10, 0, 0))

    // Return the view, these are regular Threejs elements expressed in JSX
    return <line>
        <bufferGeometry points={points} />
        <lineBasicMaterial color={0x0000ff} />
    </line>
}

export function FatLines() {
    const box = <Box selfDispose position={[0, 1, 0]} />

    const cubeSize = 30
    const cubeGeo = new BoxGeometry(cubeSize, cubeSize, cubeSize)
    const cubeMat = new MeshPhongMaterial({
        color: '#CCC',
        side: BackSide,
    })

    return <canvas3D>
        <ambientLight intensity={0.5} />
        <spotLight position={[0, 0, 0]} angle={0.15} penumbra={1} />
        <pointLight position={[0, 5, 0]} intensity={10} castShadow shadow-camera-far={333} shadow-camera-near={0.1} />
        <Box /* position={[0, 1, 0]} onClick={(event) => console.log("box clicked")} */ />

        {/* {useMemo(() => visible() ? box : null)} */}
        {/* <Box position={[-2, 0.8, 0]} castShadow /> */}
        {/* <mesh geometry={cubeGeo} material={cubeMat} position={[0, cubeSize / 2 - 0.1, 0]} receiveShadow /> */}

        <orbitControls enableDamping minDistance={10} maxDistance={500} />
    </canvas3D>
}