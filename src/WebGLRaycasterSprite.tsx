/** @jsxImportSource woby */
// https://threejs.org/examples/#webgl_raycaster_sprite

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let _cleanupFn: (() => void) | null = null

const init3D = (container: HTMLElement) => {
  if (_cleanupFn) {
    _cleanupFn()
    _cleanupFn = null
  }

  // init renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setAnimationLoop(animate)
  container.appendChild(renderer.domElement)

  // init scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  const group = new THREE.Group()
  scene.add(group)

  // init camera
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000)
  camera.position.set(15, 15, 15)
  camera.lookAt(scene.position)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.minDistance = 15
  controls.maxDistance = 250

  // add sprites

  const sprite1 = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#69f' }))
  sprite1.position.set(6, 5, 5)
  sprite1.scale.set(2, 5, 1)
  group.add(sprite1)

  const sprite2 = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#69f', sizeAttenuation: false }))
  sprite2.material.rotation = Math.PI / 3 * 4
  sprite2.position.set(8, -2, 2)
  sprite2.center.set(0.5, 0)
  sprite2.scale.set(0.1, 0.5, 0.1)
  group.add(sprite2)

  const group2 = new THREE.Object3D()
  group2.scale.set(1, 2, 1)
  group2.position.set(-5, 0, 0)
  group2.rotation.set(Math.PI / 2, 0, 0)
  group.add(group2)

  const sprite3 = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#69f' }))
  sprite3.position.set(0, 2, 5)
  sprite3.scale.set(10, 2, 3)
  sprite3.center.set(-0.1, 0)
  sprite3.material.rotation = Math.PI / 3
  group2.add(sprite3)

  // animate
  function animate() {
    renderer.render(scene, camera)
  }

  // resize
  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', onWindowResize)

  // raycaster
  let selectedObject: THREE.Sprite | null = null
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function onPointerMove(event: PointerEvent) {
    if (selectedObject) {
      selectedObject.material.color.set('#69f')
      selectedObject = null
    }

    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)

    const intersects = raycaster.intersectObject(group, true)

    if (intersects.length > 0) {
      const res = intersects.filter(function (res) {
        return res && res.object
      })[0]

      if (res && res.object) {
        selectedObject = res.object
        selectedObject.material.color.set('#f00')
      }
    }
  }
  document.addEventListener('pointermove', onPointerMove)

  // cleanup
  _cleanupFn = () => {
    renderer.setAnimationLoop(null)
    window.removeEventListener('resize', onWindowResize)
    document.removeEventListener('pointermove', onPointerMove)
    controls.dispose()
    renderer.dispose()
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement)
    }
  }
}

export const WebGLRaycasterSprite = () => (
  <div ref={(el: HTMLElement | null) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%' }} />
)

export default WebGLRaycasterSprite
