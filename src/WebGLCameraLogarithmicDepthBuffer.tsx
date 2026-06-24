/** @jsxImportSource woby */
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

let _cleanupFn: (() => void) | null = null

const NEAR = 1e-6, FAR = 1e27
let SCREEN_WIDTH = window.innerWidth
let SCREEN_HEIGHT = window.innerHeight
let screensplit = .25, screensplit_right = 0
const mouse = [ .5, .5 ]
let zoompos = - 100, minzoomspeed = .015
let zoomspeed = minzoomspeed

const labeldata = [
    { size: .01, scale: 0.0001, label: 'microscopic (1µm)' },
    { size: .01, scale: 0.1, label: 'minuscule (1mm)' },
    { size: .01, scale: 1.0, label: 'tiny (1cm)' },
    { size: 1, scale: 1.0, label: 'child-sized (1m)' },
    { size: 10, scale: 1.0, label: 'tree-sized (10m)' },
    { size: 100, scale: 1.0, label: 'building-sized (100m)' },
    { size: 1000, scale: 1.0, label: 'medium (1km)' },
    { size: 10000, scale: 1.0, label: 'city-sized (10km)' },
    { size: 3400000, scale: 1.0, label: 'moon-sized (3,400 Km)' },
    { size: 12000000, scale: 1.0, label: 'planet-sized (12,000 km)' },
    { size: 1400000000, scale: 1.0, label: 'sun-sized (1,400,000 km)' },
    { size: 7.47e12, scale: 1.0, label: 'solar system-sized (50Au)' },
    { size: 9.4605284e15, scale: 1.0, label: 'gargantuan (1 light year)' },
    { size: 3.08567758e16, scale: 1.0, label: 'ludicrous (1 parsec)' },
    { size: 1e19, scale: 1.0, label: 'mind boggling (1000 light years)' }
]

let _animId: number

const init3D = (container: HTMLElement) => {
    if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

    const objects: { container: HTMLElement, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera }[] = []

    const containerNormal = document.createElement( 'div' )
    containerNormal.style.cssText = 'position:absolute;left:0;top:0;width:50%;height:100%;overflow:hidden'
    container.appendChild( containerNormal )

    const containerLog = document.createElement( 'div' )
    containerLog.style.cssText = 'position:absolute;right:0;top:0;width:50%;height:100%;overflow:hidden'
    container.appendChild( containerLog )

    const loader = new FontLoader()
    loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {

        const scene = initScene( font )

        objects[ 0 ] = initView( scene, containerNormal, false )
        objects[ 1 ] = initView( scene, containerLog, true )

        _animId = requestAnimationFrame( animate )

    } )

    window.addEventListener( 'mousemove', onMouseMove )
    window.addEventListener( 'resize', onWindowResize )
    window.addEventListener( 'wheel', onMouseWheel )

    function initView( scene: THREE.Scene, framecontainer: HTMLElement, logDepthBuf: boolean ) {

        const camera = new THREE.PerspectiveCamera( 50, framecontainer.clientWidth / framecontainer.clientHeight, NEAR, FAR )
        scene.add( camera )

        const renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: logDepthBuf } )
        renderer.setPixelRatio( window.devicePixelRatio )
        renderer.setSize( framecontainer.clientWidth, framecontainer.clientHeight )
        renderer.domElement.style.position = 'relative'
        framecontainer.appendChild( renderer.domElement )

        return { container: framecontainer, renderer: renderer, scene: scene, camera: camera }

    }

    function initScene( font: any ) {

        const scene = new THREE.Scene()

        scene.add( new THREE.AmbientLight( 0x777777 ) )

        const light = new THREE.DirectionalLight( 0xffffff, 3 )
        light.position.set( 100, 100, 100 )
        scene.add( light )

        const materialargs = {
            color: 0xffffff,
            specular: 0x050505,
            shininess: 50,
            emissive: 0x000000
        }

        const geometry = new THREE.SphereGeometry( 0.5, 24, 12 )

        for ( let i = 0; i < labeldata.length; i ++ ) {

            const scale = labeldata[ i ].scale || 1

            const labelgeo = new TextGeometry( labeldata[ i ].label, {
                font: font,
                size: labeldata[ i ].size,
                depth: labeldata[ i ].size / 2
            } )

            labelgeo.computeBoundingSphere()
            labelgeo.translate( - labelgeo.boundingSphere!.radius, 0, 0 )

            const mat = new THREE.MeshPhongMaterial( { ...materialargs, color: new THREE.Color().setHSL( Math.random(), 0.5, 0.5 ) } )

            const group = new THREE.Group()
            group.position.z = - labeldata[ i ].size * scale
            scene.add( group )

            const textmesh = new THREE.Mesh( labelgeo, mat )
            textmesh.scale.set( scale, scale, scale )
            textmesh.position.z = - labeldata[ i ].size * scale
            textmesh.position.y = labeldata[ i ].size / 4 * scale
            group.add( textmesh )

            const dotmesh = new THREE.Mesh( geometry, mat )
            dotmesh.position.y = - labeldata[ i ].size / 4 * scale
            dotmesh.scale.multiplyScalar( labeldata[ i ].size * scale )
            group.add( dotmesh )

        }

        return scene

    }

    function updateRendererSizes() {

        SCREEN_WIDTH = container.clientWidth
        SCREEN_HEIGHT = container.clientHeight

        screensplit_right = 1 - screensplit

        if ( objects[ 0 ] ) {
            objects[ 0 ].renderer.setSize( screensplit * SCREEN_WIDTH, SCREEN_HEIGHT )
            objects[ 0 ].camera.aspect = screensplit * SCREEN_WIDTH / SCREEN_HEIGHT
            objects[ 0 ].camera.updateProjectionMatrix()
            objects[ 0 ].camera.setViewOffset( SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0, SCREEN_WIDTH * screensplit, SCREEN_HEIGHT )
            objects[ 0 ].container.style.width = ( screensplit * 100 ) + '%'
        }

        if ( objects[ 1 ] ) {
            objects[ 1 ].renderer.setSize( screensplit_right * SCREEN_WIDTH, SCREEN_HEIGHT )
            objects[ 1 ].camera.aspect = screensplit_right * SCREEN_WIDTH / SCREEN_HEIGHT
            objects[ 1 ].camera.updateProjectionMatrix()
            objects[ 1 ].camera.setViewOffset( SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH * screensplit, 0, SCREEN_WIDTH * screensplit_right, SCREEN_HEIGHT )
            objects[ 1 ].container.style.width = ( screensplit_right * 100 ) + '%'
        }

    }

    function animate() {

        _animId = requestAnimationFrame( animate )
        render()

    }

    function render() {

        const minzoom = labeldata[ 0 ].size * labeldata[ 0 ].scale * 1
        const maxzoom = labeldata[ labeldata.length - 1 ].size * labeldata[ labeldata.length - 1 ].scale * 100
        let damping = ( Math.abs( zoomspeed ) > minzoomspeed ? .95 : 1.0 )

        const zoom = THREE.MathUtils.clamp( Math.pow( Math.E, zoompos ), minzoom, maxzoom )
        zoompos = Math.log( zoom )

        if ( ( zoom == minzoom && zoomspeed < 0 ) || ( zoom == maxzoom && zoomspeed > 0 ) ) {

            damping = .85

        }

        zoompos += zoomspeed
        zoomspeed *= damping

        if ( objects.length < 2 ) return

        objects[ 0 ].camera.position.x = Math.sin( .5 * Math.PI * ( mouse[ 0 ] - .5 ) ) * zoom
        objects[ 0 ].camera.position.y = Math.sin( .25 * Math.PI * ( mouse[ 1 ] - .5 ) ) * zoom
        objects[ 0 ].camera.position.z = Math.cos( .5 * Math.PI * ( mouse[ 0 ] - .5 ) ) * zoom
        objects[ 0 ].camera.lookAt( objects[ 0 ].scene.position )

        objects[ 1 ].camera.position.copy( objects[ 0 ].camera.position )
        objects[ 1 ].camera.quaternion.copy( objects[ 0 ].camera.quaternion )

        if ( screensplit_right != 1 - screensplit ) {

            updateRendererSizes()

        }

        objects[ 0 ].renderer.render( objects[ 0 ].scene, objects[ 0 ].camera )
        objects[ 1 ].renderer.render( objects[ 1 ].scene, objects[ 1 ].camera )

    }

    function onWindowResize() {

        updateRendererSizes()

    }

    function onMouseMove( ev: MouseEvent ) {

        mouse[ 0 ] = ev.clientX / window.innerWidth
        mouse[ 1 ] = ev.clientY / window.innerHeight

    }

    function onMouseWheel( ev: WheelEvent ) {

        const amount = ev.deltaY
        if ( amount === 0 ) return
        const dir = amount / Math.abs( amount )
        zoomspeed = dir / 10
        minzoomspeed = 0.001

    }

    _cleanupFn = () => {
        cancelAnimationFrame( _animId )
        window.removeEventListener( 'mousemove', onMouseMove )
        window.removeEventListener( 'resize', onWindowResize )
        window.removeEventListener( 'wheel', onMouseWheel )
        for ( const obj of objects ) {
            if ( obj.container.contains( obj.renderer.domElement ) ) obj.container.removeChild( obj.renderer.domElement )
            obj.renderer.dispose()
        }
        if ( container.contains( containerNormal ) ) container.removeChild( containerNormal )
        if ( container.contains( containerLog ) ) container.removeChild( containerLog )
    }
}

export const WebGLCameraLogarithmicDepthBuffer = () => (
    <div style="width:100%;height:100%;position:relative">
        <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style="width:100%;height:100%" />
    </div>
)
export default WebGLCameraLogarithmicDepthBuffer
