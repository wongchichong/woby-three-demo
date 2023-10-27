import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, TextureLoader } from "three"
import { render, useFrame, useLoader } from "voby-three"
import { $, $$, useEffect } from "voby"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry"

const Box = (props) => {
    // This reference gives us direct access to the THREE.Mesh object
    const ref = $()

    // const texture = new TextureLoader().load('../textures/usedSteel.png');
    // Hold state for hovered and clicked events
    const hovered = $(false)
    const clicked = $(false)

    // Subscribe this component to the render-loop, rotate the mesh every frame

    useFrame(() => ref() && (ref().rotation.x += 0.03))

    useEffect(() => {
        console.log(ref())
    })
    // Return the view, these are regular Threejs elements expressed in JSX
    return (
        <mesh
            {...props}
            ref={ref}
            scale={() => $$(clicked) ? [1.5, 1.5, 1.5] : [1, 1, 1]}
            onClick={(event) => clicked(!clicked())}
            onPointerOver={(event) => hovered(true)}
            onPointerOut={(event) => hovered(false)}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={"orange"} />
        </mesh>
    )
}

const Test = () => {
    const material = new MeshBasicMaterial({ color: "black" })
    const parameters = {
        font: useLoader(FontLoader, { path: "fonts/helvetiker_regular.typeface.json" }),
        size: 1,
        height: 0.1,
    }

    return (
        <mesh material={material} >
            <textGeometry str={"abc"} parameters={parameters} />
        </mesh>
    )
}
const App = () => {
    const clicked = $(false)
    const material = new MeshBasicMaterial({ color: "black" })
    const parameters = {
        font: useLoader(FontLoader, { path: "fonts/helvetiker_regular.typeface.json" }),
        size: 1,
        height: 0.1,
    }
    // const geometry = new TextGeometry("abc", parameters)



    return (

        <canvas3D>
            <ambientLight intensity={0.5} />
            <Box />
            {/* <Text str={() => clicked() ? "ABCD" : "cde"} pathToFont="fonts/helvetiker_regular.typeface.json" /> */}
            <orbitControls />
            {/* <Test/> */}

            <mesh material={material} >
                <textGeometry str={"abc"} parameters={parameters} />
            </mesh>
        </canvas3D >


    )
}

render(App, document.body)