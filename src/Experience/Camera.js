import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import TWEEN from '@tweenjs/tween.js'

let camera = null

export default class Camera {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.resources = this.experience.resources
        this.canvasDebug = this.experience.canvasDebug
        this.debug = this.experience.debug
        camera = this

        // Options
        this.updateCameraTween = null
        this.zoomInTween = null
        this.data = {
            moveDuration: 2500,
            zoom: 1.15,
            location: 0,
            debug: false,
            fov: 60
        }

        this.cameraLocations = {
            'default': {
                position: new THREE.Vector3(-2.423, 2.435, 7.019),
                lookAt: new THREE.Vector3(-2.238, 1.469, -0.265),
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
                position: new THREE.Vector3(-0.5229542045858941, 1.9564578241710562, 0),
                lookAt: new THREE.Vector3(0.07325508477360648, 1.9210837988913445, 0),
                controls: {
                    minPolarAngle: 1.17,
                    maxPolarAngle: 1.58,
                    minAzimuthAngle: -1.65,
                    maxAzimuthAngle: 0.25
                }
            },
        }

        this.lastCameraSettings = {
            position: new THREE.Vector3(0, 0, 0)
        }

        // Setup

        this.setInstance()
        this.setOrbitControls()
        this.autoRotateControls()

        if (this.debug.active) {
            this.resources.on('ready', () => {
                this.resources = this.resources.items
                this.model = this.resources.controlRoom.scene

                this.model.traverse(child => {
                    if (child instanceof THREE.Mesh) {

                    }
                })
            })

            this.setDebugCamera()
            this.setDebugOrbitControls()
            this.addGUIControls()
        }
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(this.data.fov, this.sizes.width / this.sizes.height, 0.01, 1000)
        this.instance.position.copy(this.cameraLocations.default.position)
        this.scene.add(this.instance)
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.target.copy(this.cameraLocations.default.lookAt)
    }

    autoRotateControls() {
        this.counter = 0
        this.controls.enableDamping = true
        this.controls.enablePan = this.debug.active
        this.controls.enableZoom = this.debug.active
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 0.1
    }

    changeRotateDirection() {
        if (this.counter > 1000) {
            this.controls.autoRotateSpeed *= -1
            this.counter = 0
        } else {
            this.counter++
        }
    }

    updateCameraTo(location = 'default') {
        if (location == null) return
        this.lastCameraSettings.position = new THREE.Vector3().copy(this.instance.position)
        this.updateCamera(this.cameraLocations[location])
    }

    updateCamera({ position, lookAt, controls, duration = this.data.moveDuration }) {
        if (this.updateCameraTween)
            this.updateCameraTween.stop()

        if (this.zoomInTween)
            this.revertZoom()

        const from = {
            cameraPosition: new THREE.Vector3().copy(this.instance.position),
            cameraLookAt: new THREE.Vector3().copy(this.controls.target)
        }

        const to = {
            cameraPosition: position,
            cameraLookAt: lookAt
        }

        this.setDefaultAngleControls()

        this.updateCameraTween = new TWEEN.Tween(from)
            .to(to, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((obj) => {
                this.controls.target.set(
                    obj.cameraLookAt.x,
                    obj.cameraLookAt.y,
                    obj.cameraLookAt.z
                )
                this.instance.position.set(
                    obj.cameraPosition.x,
                    obj.cameraPosition.y,
                    obj.cameraPosition.z
                )
            })
            .onComplete(function () {
                if (controls) {
                    camera.controls.minPolarAngle = controls.minPolarAngle
                    camera.controls.maxPolarAngle = controls.maxPolarAngle
                    camera.controls.minAzimuthAngle = controls.minAzimuthAngle
                    camera.controls.maxAzimuthAngle = controls.maxAzimuthAngle
                }
            })
            .start()

        this.controls.autoRotate = false
    }

    zoomIn() {
        this.zoomInTween = new TWEEN.Tween(this.controls.object)
            .to({ zoom: 1.3 }, 5000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                this.instance.updateProjectionMatrix()
            })
            .start()
    }

    revertZoom() {
        this.zoomInTween.stop()
        this.controls.object.zoom = 1
        this.instance.updateProjectionMatrix()
    }

    setDebugCamera() {
        this.instanceDebug = new THREE.PerspectiveCamera(this.data.fov, this.sizes.width / this.sizes.height, 0.01, 1000)
        this.instanceDebug.position.set(5, 3, 15)
        this.scene.add(this.instanceDebug)

    }

    setDebugOrbitControls() {
        this.controls2 = new OrbitControls(this.instanceDebug, this.canvasDebug)
        this.controls2.target.copy(this.cameraLocations.default.lookAt)
    }

    setDefaultAngleControls() {
        camera.controls.minPolarAngle = -Math.PI
        camera.controls.maxPolarAngle = Math.PI
        camera.controls.minAzimuthAngle = -Math.PI
        camera.controls.maxAzimuthAngle = Math.PI
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        TWEEN.update()
        this.controls.update()

        if (this.controls.autoRotate) {
            this.changeRotateDirection()
        }

        if (this.debug.active) {
            this.controls2.update()
        }
    }

    addGUIControls() {
        const camera = this.debug.ui.addFolder('Camera')
        camera.close()

        camera.
            // Location
            add(this.data, 'location', {
                Default: 'default',
                Screens: 'screens',
                ControlBoard: 'controlBoard',
                Portal: 'portal'
            })
            .onFinishChange((location) => {
                this.updateCameraTo(location)
            })
            .name('Location')
            .listen()


        const cameraPosition = camera.addFolder('Position')
        cameraPosition.add(this.instance.position, 'x').min(-20).max(20).step(0.01).name('position.x').listen()
        cameraPosition.add(this.instance.position, 'y').min(-20).max(20).step(0.01).name('position.y').listen()
        cameraPosition.add(this.instance.position, 'z').min(-20).max(20).step(0.01).name('position.z').listen()

        const cameraLookAt = camera.addFolder('LookAt')
        cameraLookAt.add(this.controls.target, 'x').min(-20).max(20).step(0.01).name('lookAt.x').listen()
        cameraLookAt.add(this.controls.target, 'y').min(-20).max(20).step(0.01).name('lookAt.y').listen()
        cameraLookAt.add(this.controls.target, 'z').min(-20).max(20).step(0.01).name('lookAt.z').listen()

        const cameraAngles = camera.addFolder('Angles')
        cameraAngles.add(this.controls, 'minPolarAngle').min(-Math.PI).max(Math.PI).step(0.01).name('minPolarAngle').listen()
        cameraAngles.add(this.controls, 'maxPolarAngle').min(-Math.PI).max(Math.PI).step(0.01).name('maxPolarAngle').listen()
        cameraAngles.add(this.controls, 'minAzimuthAngle').min(-Math.PI).max(Math.PI).step(0.01).name('minAzimuthAngle').listen()
        cameraAngles.add(this.controls, 'maxAzimuthAngle').min(-Math.PI).max(Math.PI).step(0.01).name('maxAzimuthAngle').listen()
    }
}