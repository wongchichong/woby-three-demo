/** @jsxImportSource woby */
// WebGL Morph Targets Webcam (MediaPipe Face Tracking)
// Source: https://threejs.org/examples/#webgl_morphtargets_webcam
// Uses MediaPipe face-mesh to extract blendshape coefficients and facial transformation
// matrix from webcam stream, driving morphtarget weights and face pose on facecap.glb.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let _cleanupFn: (() => void) | null = null

// Blendshape name mapping from MediaPipe to facecap.glb morph targets
const blendshapesMap: Record<string, string> = {
	// '_neutral': '',
	'browDownLeft': 'browDown_L',
	'browDownRight': 'browDown_R',
	'browInnerUp': 'browInnerUp',
	'browOuterUpLeft': 'browOuterUp_L',
	'browOuterUpRight': 'browOuterUp_R',
	'cheekPuff': 'cheekPuff',
	'cheekSquintLeft': 'cheekSquint_L',
	'cheekSquintRight': 'cheekSquint_R',
	'eyeBlinkLeft': 'eyeBlink_L',
	'eyeBlinkRight': 'eyeBlink_R',
	'eyeLookDownLeft': 'eyeLookDown_L',
	'eyeLookDownRight': 'eyeLookDown_R',
	'eyeLookInLeft': 'eyeLookIn_L',
	'eyeLookInRight': 'eyeLookIn_R',
	'eyeLookOutLeft': 'eyeLookOut_L',
	'eyeLookOutRight': 'eyeLookOut_R',
	'eyeLookUpLeft': 'eyeLookUp_L',
	'eyeLookUpRight': 'eyeLookUp_R',
	'eyeSquintLeft': 'eyeSquint_L',
	'eyeSquintRight': 'eyeSquint_R',
	'eyeWideLeft': 'eyeWide_L',
	'eyeWideRight': 'eyeWide_R',
	'jawForward': 'jawForward',
	'jawLeft': 'jawLeft',
	'jawOpen': 'jawOpen',
	'jawRight': 'jawRight',
	'mouthClose': 'mouthClose',
	'mouthDimpleLeft': 'mouthDimple_L',
	'mouthDimpleRight': 'mouthDimple_R',
	'mouthFrownLeft': 'mouthFrown_L',
	'mouthFrownRight': 'mouthFrown_R',
	'mouthFunnel': 'mouthFunnel',
	'mouthLeft': 'mouthLeft',
	'mouthLowerDownLeft': 'mouthLowerDown_L',
	'mouthLowerDownRight': 'mouthLowerDown_R',
	'mouthPressLeft': 'mouthPress_L',
	'mouthPressRight': 'mouthPress_R',
	'mouthPucker': 'mouthPucker',
	'mouthRight': 'mouthRight',
	'mouthRollLower': 'mouthRollLower',
	'mouthRollUpper': 'mouthRollUpper',
	'mouthShrugLower': 'mouthShrugLower',
	'mouthShrugUpper': 'mouthShrugUpper',
	'mouthSmileLeft': 'mouthSmile_L',
	'mouthSmileRight': 'mouthSmile_R',
	'mouthStretchLeft': 'mouthStretch_L',
	'mouthStretchRight': 'mouthStretch_R',
	'mouthUpperUpLeft': 'mouthUpperUp_L',
	'mouthUpperUpRight': 'mouthUpperUp_R',
	'noseSneerLeft': 'noseSneer_L',
	'noseSneerRight': 'noseSneer_R',
	// '': 'tongueOut'
}

// MediaPipe returns the head pose in a metric 3D space that assumes a
// fixed virtual camera: right-handed, at the origin, looking down -Z, with
// units in centimeters and a vertical field of view of 63 degrees. The
// camera, the video plane and the model all have to share that frame for
// the rendered face to register with the webcam image.

const MP_FOV = 63 // vertical field of view, in degrees
const MP_NEAR = 1 // 1 cm
const MP_FAR = 10000 // 100 m

const VIDEO_DISTANCE = 100 // depth of the video plane, in cm

const init3D = async (container: HTMLElement) => {
	if (_cleanupFn) { _cleanupFn(); _cleanupFn = null }

	// Renderer setup
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.setSize(container.clientWidth, container.clientHeight)
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	container.appendChild(renderer.domElement)

	// The render camera matches MediaPipe's virtual camera: at the origin,
	// looking down -Z. It must not be moved, otherwise the overlay drifts. Its
	// aspect switches to the video's once the webcam is running.
	const camera = new THREE.PerspectiveCamera(MP_FOV, container.clientWidth / container.clientHeight, MP_NEAR, MP_FAR)

	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0x666666)
	scene.scale.x = -1 // mirror the whole scene for a selfie view (flips video and pose together)

	scene.add(new THREE.AmbientLight(0xffffff, 5))

	// Face

	let face: THREE.Mesh | null = null
	let eyeL: THREE.Object3D | null = null
	let eyeR: THREE.Object3D | null = null
	const eyeRotationLimit = THREE.MathUtils.degToRad(30)

	// MediaPipe's facial transformation matrix is copied here verbatim. Until
	// the webcam delivers one, the face rests at a default frontal pose (in
	// front of the camera, in centimeters) so it is framed before tracking.
	const faceContainer = new THREE.Object3D()
	faceContainer.matrixAutoUpdate = false
	faceContainer.matrix.makeTranslation(0, 0, -50)
	faceContainer.matrixWorldNeedsUpdate = true
	scene.add(faceContainer)

	// The Face Cap model is not MediaPipe's canonical face mesh, so this fixed
	// transform registers it into the canonical frame (centimeters, +Y up,
	// +Z out of the face) before the pose matrix is applied. The values are
	// derived from the model's eye positions.
	const registration = new THREE.Object3D()
	registration.scale.setScalar(0.958)
	registration.rotation.x = Math.PI / 2
	registration.position.set(0, 0.12, 1.18)
	faceContainer.add(registration)

	// KTX2 Loader
	const ktx2Loader = new KTX2Loader()
	ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/basis/')
	ktx2Loader.detectSupport(renderer)

	// Video Texture
	const video = document.createElement('video')
	video.autoplay = true
	video.muted = true
	video.playsInline = true

	const texture = new THREE.VideoTexture(video)
	texture.colorSpace = THREE.SRGBColorSpace

	const geometry = new THREE.PlaneGeometry(1, 1)
	const material = new THREE.MeshBasicMaterial({ map: texture, depthTest: false, depthWrite: false })
	const videomesh = new THREE.Mesh(geometry, material)
	videomesh.position.z = -VIDEO_DISTANCE
	videomesh.renderOrder = -1
	scene.add(videomesh)

	// GUI
	let gui: GUI | null = null

	// Load MediaPipe
	const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35')

	const filesetResolver = await FilesetResolver.forVisionTasks(
		'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
	)

	const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
		baseOptions: {
			modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
			delegate: 'GPU'
		},
		outputFaceBlendshapes: true,
		outputFacialTransformationMatrixes: true,
		runningMode: 'VIDEO',
		numFaces: 1
	})

	// Load face GLB
	const loader = new GLTFLoader()
	loader.setKTX2Loader(ktx2Loader)
	loader.setMeshoptDecoder(MeshoptDecoder)
	loader.load('https://threejs.org/examples/models/gltf/facecap.glb', (gltf) => {
		// Reparent the head/eyes/teeth and drop the model's own scale rig.
		const group = gltf.scene.getObjectByName('grp_transform')
		if (group) registration.add(group)

		const head = group?.getObjectByName('mesh_2') as THREE.Mesh | null
		if (head) {
			head.material = new THREE.MeshNormalMaterial()
			face = head
		}

		const teeth = group?.getObjectByName('mesh_3') as THREE.Mesh | null
		if (teeth) {
			teeth.material = new THREE.MeshNormalMaterial()
		}

		if (group) {
			eyeL = group.getObjectByName('eyeLeft') || null
			eyeR = group.getObjectByName('eyeRight') || null
		}

		// GUI
		if (face && face.morphTargetInfluences && face.morphTargetDictionary) {
			gui = new GUI({ container })
			gui.close()

			const influences = face.morphTargetInfluences

			for (const [key, value] of Object.entries(face.morphTargetDictionary)) {
				gui.add(influences, value, 0, 1, 0.01)
					.name(key.replace('blendShape1.', ''))
					.listen(influences)
			}
		}

		renderer.setAnimationLoop(animate)
	})

	// Webcam fallback overlay (5-second timeout per Phase 21 locked pattern)
	const fallbackEl = document.createElement('div')
	fallbackEl.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);color:#fff;font-family:monospace;font-size:14px;z-index:100;gap:12px;text-align:center'

	const fallbackIcon = document.createElement('div')
	fallbackIcon.style.fontSize = '2em'
	fallbackIcon.textContent = '📷'

	const fallbackMsg = document.createElement('div')
	fallbackMsg.textContent = 'Awaiting webcam permission…'

	fallbackEl.appendChild(fallbackIcon)
	fallbackEl.appendChild(fallbackMsg)
	container.style.position = 'relative'
	container.appendChild(fallbackEl)

	const showFallback = (icon: string, main: string, sub?: string) => {
		fallbackIcon.textContent = icon
		fallbackMsg.textContent = main
		if (sub) {
			const small = document.createElement('small')
			small.style.color = '#aaa'
			small.textContent = sub
			fallbackMsg.appendChild(document.createElement('br'))
			fallbackMsg.appendChild(small)
		}
	}

	const fallbackTimer = setTimeout(() => {
		showFallback('🚫', 'Permission prompt unanswered', 'Webcam not available in this context')
	}, 5000)

	// Request webcam
	let stream: MediaStream | null = null

	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
			.then(function (s) {
				stream = s
				video.srcObject = s
				video.play()
				clearTimeout(fallbackTimer)
				if (container.contains(fallbackEl)) container.removeChild(fallbackEl)
			})
			.catch(function (error) {
				console.warn('Unable to access the camera/webcam.', error)
				clearTimeout(fallbackTimer)
				showFallback('🚫', 'Camera access denied', error instanceof Error ? error.message : String(error))
			})
	}

	// The camera matches the video aspect; the canvas is sized to that aspect
	// and centered, so the grey body shows through as letterbox/pillarbox bars.
	video.addEventListener('loadedmetadata', function () {
		const aspect = video.videoWidth / video.videoHeight

		camera.aspect = aspect
		camera.updateProjectionMatrix()

		// Size the plane so it exactly fills the frustum at its depth.
		const height = 2 * VIDEO_DISTANCE * Math.tan(THREE.MathUtils.degToRad(MP_FOV / 2))
		videomesh.scale.set(height * aspect, height, 1)

		resize()
	})

	function animate() {
		if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
			const results = faceLandmarker.detectForVideo(video, Date.now())

			if (results.facialTransformationMatrixes.length > 0) {
				// Apply MediaPipe's metric pose matrix directly.
				faceContainer.matrix.fromArray(results.facialTransformationMatrixes[0].data)
				faceContainer.matrixWorldNeedsUpdate = true
			}

			if (results.faceBlendshapes.length > 0) {
				const faceBlendshapes = results.faceBlendshapes[0].categories

				// Morph values does not exist on the eye meshes, so we map the eyes blendshape score into rotation values
				const eyeScore = {
					leftHorizontal: 0,
					rightHorizontal: 0,
					leftVertical: 0,
					rightVertical: 0
				}

				for (const blendshape of faceBlendshapes) {
					const categoryName = blendshape.categoryName
					const score = blendshape.score

					if (face && face.morphTargetDictionary && face.morphTargetInfluences) {
						const index = face.morphTargetDictionary[blendshapesMap[categoryName]]

						if (index !== undefined) {
							face.morphTargetInfluences[index] = score
						}
					}

					// There are two blendshape for movement on each axis (up/down, in/out)
					// Add one and subtract the other to get the final score in -1 to 1 range
					switch (categoryName) {
						case 'eyeLookInLeft':
							eyeScore.leftHorizontal += score
							break
						case 'eyeLookOutLeft':
							eyeScore.leftHorizontal -= score
							break
						case 'eyeLookInRight':
							eyeScore.rightHorizontal -= score
							break
						case 'eyeLookOutRight':
							eyeScore.rightHorizontal += score
							break
						case 'eyeLookUpLeft':
							eyeScore.leftVertical -= score
							break
						case 'eyeLookDownLeft':
							eyeScore.leftVertical += score
							break
						case 'eyeLookUpRight':
							eyeScore.rightVertical -= score
							break
						case 'eyeLookDownRight':
							eyeScore.rightVertical += score
							break
					}
				}

				if (eyeL) {
					eyeL.rotation.z = eyeScore.leftHorizontal * eyeRotationLimit
					eyeL.rotation.x = eyeScore.leftVertical * eyeRotationLimit
				}
				if (eyeR) {
					eyeR.rotation.z = eyeScore.rightHorizontal * eyeRotationLimit
					eyeR.rotation.x = eyeScore.rightVertical * eyeRotationLimit
				}
			}
		}

		renderer.render(scene, camera)
	}

	function resize() {
		// Largest video-aspect rectangle that fits inside the container.
		let width = container.clientWidth
		let height = container.clientHeight

		if (width / height > camera.aspect) {
			width = height * camera.aspect
		} else {
			height = width / camera.aspect
		}

		renderer.setSize(width, height)
	}

	window.addEventListener('resize', resize)

	_cleanupFn = () => {
		renderer.setAnimationLoop(null)
		window.removeEventListener('resize', resize)

		// Release webcam hardware
		if (stream) {
			stream.getTracks().forEach((t) => t.stop())
			stream = null
		}

		video.pause()
		video.srcObject = null

		if (gui) {
			gui.destroy()
			gui = null
		}

		clearTimeout(fallbackTimer)
		if (container.contains(fallbackEl)) container.removeChild(fallbackEl)

		texture.dispose()
		geometry.dispose()
		material.dispose()
		ktx2Loader.dispose()

		scene.clear()
		renderer.dispose()
		if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
	}
}

export default function WebGLMorphTargetsWebcam() {
	return <div ref={(el) => { if (el) init3D(el) }} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
