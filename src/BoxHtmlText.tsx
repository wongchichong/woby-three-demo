/** @jsxImportSource woby-three */


import { $, $$, useEffect, useMemo } from "woby"
import { useFrame, useThree, render, MeshProps, useRenderer } from "woby-three"
import { BackSide, BoxGeometry, CameraHelper, Color, DoubleSide, Mesh, MeshPhongMaterial, MeshStandardMaterial, PointLight, PointLightHelper, Raycaster, TextureLoader, Vector2, WebGLRenderer } from "three"
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'

function Box(props: MeshProps) {
    const texture = new TextureLoader().load('../textures/usedSteel.png')
    const ref = $<Mesh>()
    const hovered = $(false)
    const clicked = $(false)

    const { scene, camera, } = useThree()
    const renderer = useRenderer<WebGLRenderer>()

    $$(renderer).shadowMap.enabled = true
    $$(scene).background = new Color("grey")

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
        else {
            (e.target as HTMLElement).click()

        }
    })

    document.body.addEventListener('pointermove', (e) => {
        if (e.target == textRenderer.domElement) {
            const myEvent = new PointerEvent('pointermove', e)
            $$(renderer).domElement.dispatchEvent(myEvent)
        }
        else
            (e.target as HTMLElement).click()
    })

    // useFrame(() => $$(ref)?.rotateX(0.01))

    useFrame(() => {
        $$(ref)?.rotateX(0.01)
        textRenderer.render($$(scene), $$(camera))
    })

    // Return the view, these are regular Threejs elements expressed in JSX
    return (
        <mesh
            {...props}
            ref={ref}

            scale={() => $$(clicked) ? [1.5, 1.5, 1.5] : [1, 1, 1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={() => $$(hovered) ? 'hotpink' : 'orange'} map={texture} side={DoubleSide} />
        </mesh >
    )
}

export function BoxHtmlText() {
    return <canvas3D>
        <ambientLight intensity={0.5} />
        <spotLight position={[0, 0, 0]} angle={0.15} penumbra={1} />
        <pointLight position={[0, 5, 0]} intensity={10} castShadow shadow-camera-far={333} shadow-camera-near={0.1} />
        <Box position={[0, 1, 0]} onClick={(event) => console.log("box clicked")} />
        {/* {useMemo(() => visible() ? box : null)} */}
        {/* <Box position={[-2, 0.8, 0]} castShadow /> */}
        {/* <mesh geometry={cubeGeo} material={cubeMat} position={[0, cubeSize / 2 - 0.1, 0]} receiveShadow /> */}

        <orbitControls enableDamping />
    </canvas3D>
}