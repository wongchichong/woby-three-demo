/** @jsxImportSource @woby/three */

import { $, type JSX, render } from 'woby'
import './input.css'

import { Plane3 } from './Plane'
import { Box3 } from './Box3'
import { Box3ce } from './Box3ce'
import { BoxStaticText } from './BoxStaticText'
import { GLTF } from './GLTF'
import { GltfAnisotropy } from './GltfAnisotropy'
import { Box2Click } from './Box2Click'
import { BoxHtmlText } from './BoxHtmlText'
import { FatLines } from './FatLines'
import { SimpleLine } from './SimpleLine'
import { DLines } from './DLine'
import { Obj3D } from './Object3dAdd'
import { Grp } from './group'
import { Line3 } from './Line3'
// import { Sector } from './Sector'
import { Css3dPeriodictable } from './css3d_periodictable'
import { WebGLCss3d } from './webgl_css3d'

export const App = () => {
    const page = $()
    return <div class='z-10'>
        <button onClick={() => page(Plane3)}>Plane</button>
        <button onClick={() => page(Box3)}>3 Boxes + Click</button>
        <button onClick={() => page(Box3ce)}>3 Boxes + Click (Custom Element)</button>
        <button onClick={() => page(BoxStaticText)}>Box + static text</button>
        <button onClick={() => page(GLTF)}>GLTF</button>
        <button onClick={() => page(GltfAnisotropy)}>Gltf Anisotropy</button>
        <button onClick={() => page(Box2Click)}>Boxes + Click</button>
        <button onClick={() => page(BoxHtmlText)}>Box html text</button>
        <button onClick={() => page(FatLines)}>Fat Line</button>
        <button onClick={() => page(SimpleLine)}>Simple Line</button>
        <button onClick={() => page(DLines)}>DLines</button>
        <button onClick={() => page(Obj3D)}>Object3D Add</button>
        <button onClick={() => page(Grp)}>Group</button>
        {/* <button onClick={() => page(Line3)}>Line</button> */}
        <button onClick={() => page(Css3dPeriodictable)}>Css3d Periodictable</button>
        <button onClick={() => page(WebGLCss3d)}>WebGL Css3d</button>
        {page as any}
    </div>
}

render(App, document.body)
