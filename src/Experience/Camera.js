import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import TWEEN from '@tweenjs/tween.js'

import Experience from "./Experience.js";
import Audio from './Extras/Audio.js'

let camera = null

export default class Camera {
    constructor() {
        camera = this
        camera.experience = new Experience()
        camera.audio = new Audio()
        camera.sizes = camera.experience.sizes
        camera.scene = camera.experience.scene
        camera.canvas = camera.experience.canvas
        camera.resources = camera.experience.resources
        camera.debug = camera.experience.debug

        // Options
        camera.cameraUpdated = false
        camera.updateCameraTween = null
        camera.zoomInTween = null
        camera.data = {
            moveDuration: 2000,
            zoom: 1.15,
            location: 0,
            debug: false,
            fov: 60
        }

        camera.cameraLocations = {
            'default': {
                position: new THREE.Vector3(-0.423, 2.435, 5.019),
                lookAt: new THREE.Vector3(-0.238, 1.469, -0.265),
                controls: {
                    minPolarAngle: -Math.PI,
                    maxPolarAngle: Math.PI,
                    minAzimuthAngle: -Math.PI,
                    maxAzimuthAngle: Math.PI
                }
            },
            'screens': {
                position: new THREE.Vector3(-1.27, 1.92, 2.99),
                lookAt: new THREE.Vector3(0.31, 1.65, -0.58),
                controls: {
                    minPolarAngle: 1.25,
                    maxPolarAngle: 1.75,
                    minAzimuthAngle: -1.25,
                    maxAzimuthAngle: 0
                }
            },
            'screensCloseLook': {
                position: new THREE.Vector3(0.10311109275205538, 2.019544378730217, 0.8109164952023816),
                lookAt: new THREE.Vector3(-0.3666665812472672, 1.807908067952745, -0.6556377861261685),
                controls: {
                    minPolarAngle: 1.41,
                    maxPolarAngle: 1.63,
                    minAzimuthAngle: -0.09,
                    maxAzimuthAngle: 0.31
                }
            },
            'irisCloseLook': {
                position: new THREE.Vector3(-0.4308005000435932, 1.4008353135684253, -0.40447115309818304),
                lookAt: new THREE.Vector3(-0.47577618033905067, 1.3818037800219334, -0.5351459117438647),
                controls: {
                    minPolarAngle: 0,
                    maxPolarAngle: 3.141592653589793,
                    minAzimuthAngle: 0,
                    maxAzimuthAngle: 0.53
                }
            },
            'irisWithOptions': {
                position: new THREE.Vector3(-0.2761545370256113, 1.4507675284532975, 0.07952206846763665),
                lookAt: new THREE.Vector3(-0.47577618033905067, 1.3818037800219334, -0.5351459117438647),
                controls: {
                    minPolarAngle: 0,
                    maxPolarAngle: 3.141592653589793,
                    minAzimuthAngle: 0,
                    maxAzimuthAngle: 0.53
                }
            },
            'controlBoard': {
                position: new THREE.Vector3(-0.109, 2.224, 0.022),
                lookAt: new THREE.Vector3(0.312, 1.975, 0.019),
                controls: {
                    minPolarAngle: 1,
                    maxPolarAngle: 1.25,
                    minAzimuthAngle: -1.94,
                    maxAzimuthAngle: -1.35
                }
            },
            'portal': {
                position: new THREE.Vector3(-0.5121269769118129, 2.0395940526198424, 0),
                lookAt: new THREE.Vector3(0.07325508477360643, 1.9210837988913445, 0),
                controls: {
                    minPolarAngle: 1.17,
                    maxPolarAngle: 1.58,
                    minAzimuthAngle: -1.65,
                    maxAzimuthAngle: 0.25
                }
            },
        }

        camera.lastCameraSettings = {
            position: new THREE.Vector3(0, 0, 0)
        }

        // Setup
        camera.setInstance()
        camera.setOrbitControls()
        camera.autoRotateControls()

        if (camera.debug.developer) {
            camera.resources.on('ready', () => {
                camera.resources = camera.resources.items
                camera.model = camera.resources.controlRoom.scene
            })

            camera.addGUIControls()
        }
    }

    setInstance() {
        camera.instance = new THREE.PerspectiveCamera(camera.data.fov, camera.sizes.width / camera.sizes.height, 0.01, 1000)
        camera.instance.position.copy(camera.cameraLocations.default.position)

        camera.instance.layers.enable(0)
        camera.instance.layers.enable(1)

        camera.scene.add(camera.instance)
    }

    setOrbitControls() {
        camera.controls = new OrbitControls(camera.instance, camera.canvas)
        camera.controls.target.copy(camera.cameraLocations.default.lookAt)
    }

    autoRotateControls() {
        camera.counter = 0
        camera.controls.enableDamping = true
        camera.controls.enablePan = camera.debug.developer
        camera.controls.enableZoom = camera.debug.developer
        camera.controls.autoRotate = true
        camera.controls.autoRotateSpeed = 0.1
    }

    changeRotateDirection() {
        if (camera.counter > 1000) {
            camera.controls.autoRotateSpeed *= -1
            camera.counter = 0
        } else {
            camera.counter++
        }
    }

    updateCameraTo(location = 'default', callback = () => { }) {
        if (location == null) return

        if (camera.lastCameraSettings.location != location)
            camera.audio.playSound('whoosh-between-screens')

        camera.lastCameraSettings = {
            'location': location,
            'position': new THREE.Vector3().copy(camera.instance.position)
        }

        camera.updateCamera(camera.cameraLocations[location], callback)
    }

    updateCamera({ position, lookAt, controls, duration = camera.data.moveDuration }, callback) {
        document.body.classList.add('camera-is-moving')

        if (camera.updateCameraTween)
            camera.updateCameraTween.stop()

        if (camera.zoomInTween)
            camera.zoomOut(2000)

        const from = {
            cameraPosition: new THREE.Vector3().copy(camera.instance.position),
            cameraLookAt: new THREE.Vector3().copy(camera.controls.target)
        }

        const to = {
            cameraPosition: position,
            cameraLookAt: lookAt
        }

        if (!camera.debug.developer)
            camera.setDefaultAngleControls()

        camera.updateCameraTween = new TWEEN.Tween(from)
            .to(to, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((obj) => {
                camera.controls.target.set(
                    obj.cameraLookAt.x,
                    obj.cameraLookAt.y,
                    obj.cameraLookAt.z
                )
                camera.instance.position.set(
                    obj.cameraPosition.x,
                    obj.cameraPosition.y,
                    obj.cameraPosition.z
                )
            })
            .onComplete(() => {
                if (controls && !camera.debug.developer) {
                    camera.controls.minPolarAngle = controls.minPolarAngle
                    camera.controls.maxPolarAngle = controls.maxPolarAngle
                    camera.controls.minAzimuthAngle = controls.minAzimuthAngle
                    camera.controls.maxAzimuthAngle = controls.maxAzimuthAngle
                }
                callback()
                document.body.classList.remove('camera-is-moving')
            })
            .start()

        camera.controls.autoRotate = false
    }

    zoomIn(time) {
        camera.zoomInTween = new TWEEN.Tween(camera.controls.object)
            .to({ zoom: 1.3 }, time)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                camera.instance.updateProjectionMatrix()
            })
            .start()
    }

    zoomOut(time) {
        camera.zoomInTween = new TWEEN.Tween(camera.controls.object)
            .to({ zoom: 1 }, time)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                camera.instance.updateProjectionMatrix()
            })
            .start()
    }

    setDefaultAngleControls() {
        camera.controls.minPolarAngle = -Math.PI
        camera.controls.maxPolarAngle = Math.PI
        camera.controls.minAzimuthAngle = -Math.PI
        camera.controls.maxAzimuthAngle = Math.PI
    }

    resize() {
        camera.instance.aspect = camera.sizes.width / camera.sizes.height
        camera.instance.updateProjectionMatrix()
    }

    update() {
        TWEEN.update()
        camera.controls.update()

        if (camera.controls.autoRotate) {
            camera.changeRotateDirection()
        }
    }

    addGUIControls() {
        const camera = camera.debug.ui.addFolder('Camera')
        camera.close()

        camera.
            // Location
            add(camera.data, 'location', {
                Default: 'default',
                Screens: 'screens',
                ControlBoard: 'controlBoard',
                Portal: 'portal',
                IrisCloseLook: 'irisCloseLook',
                IrisWithOptions: 'irisWithOptions'
            })
            .onFinishChange((location) => {
                camera.updateCameraTo(location)
            })
            .name('Location')
            .listen()

        const cameraPosition = camera.addFolder('Position')
        cameraPosition.add(camera.instance.position, 'x').min(-20).max(20).step(0.01).name('position.x').listen()
        cameraPosition.add(camera.instance.position, 'y').min(-20).max(20).step(0.01).name('position.y').listen()
        cameraPosition.add(camera.instance.position, 'z').min(-20).max(20).step(0.01).name('position.z').listen()

        const cameraLookAt = camera.addFolder('LookAt')
        cameraLookAt.add(camera.controls.target, 'x').min(-20).max(20).step(0.01).name('lookAt.x').listen()
        cameraLookAt.add(camera.controls.target, 'y').min(-20).max(20).step(0.01).name('lookAt.y').listen()
        cameraLookAt.add(camera.controls.target, 'z').min(-20).max(20).step(0.01).name('lookAt.z').listen()

        const cameraAngles = camera.addFolder('Angles')
        cameraAngles.add(camera.controls, 'minPolarAngle').min(-Math.PI).max(Math.PI).step(0.01).name('minPolarAngle').listen()
        cameraAngles.add(camera.controls, 'maxPolarAngle').min(-Math.PI).max(Math.PI).step(0.01).name('maxPolarAngle').listen()
        cameraAngles.add(camera.controls, 'minAzimuthAngle').min(-Math.PI).max(Math.PI).step(0.01).name('minAzimuthAngle').listen()
        cameraAngles.add(camera.controls, 'maxAzimuthAngle').min(-Math.PI).max(Math.PI).step(0.01).name('maxAzimuthAngle').listen()
    }
}