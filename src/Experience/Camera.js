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
        this.debug = this.experience.debug
        camera = this

        this.views = [
            {
                name: 'default',
                left: 0,
                bottom: 0,
                width: 0.5,
                height: 1.0,
                background: new THREE.Color(0xff0000),
                eye: [0, 5, 20],
                up: [0, 1, 0],
                fov: 60,
                updateCamera: (camera, scene) => {
                    camera.lookAt(scene.position)
                }
            },
            {
                name: 'debug',
                left: 0.5,
                bottom: 0,
                width: 0.5,
                height: 1.0,
                background: new THREE.Color(0x00ff00),
                eye: [0, 5, 20],
                up: [0, 1, 0],
                fov: 75,
                updateCamera: (camera, scene) => {
                    camera.lookAt(scene.position)
                }
            }
        ]

        // Options
        this.data = {
            fov: 60,
            aspect: this.sizes.width / this.sizes.height,
            near: 0.1,
            far: 1000,
            moveDuration: 1200,

            position: new THREE.Vector3(0, 1.7, 10),
            lookAt: new THREE.Vector3(0, 1.7, 0),
            location: 0,
            debug: false,
        }

        this.cameraLocations = [
            {
                name: 'default',
                position: new THREE.Vector3(0, 1.7, 10),
                lookAt: new THREE.Vector3(0, 1.7, 0)
            },
            {
                name: 'screens',
                position: new THREE.Vector3(-4.2, 1.7, 3.6),
                lookAt: new THREE.Vector3(-0.28, 1.3, -0.8),
                controls: {
                    minPolarAngle: 1.25,
                    maxPolarAngle: 1.5,
                    minAzimuthAngle: -1.25,
                    maxAzimuthAngle: 0
                }
            },
            {
                name: 'portal',
                position: new THREE.Vector3(-0.7, 1.7, 0),
                lookAt: new THREE.Vector3(0.1, 1.7, 0),
                controls: {
                    minPolarAngle: 1.5,
                    maxPolarAngle: 2.25,
                    minAzimuthAngle: -1.65,
                    maxAzimuthAngle: 2.25
                }
            }
        ]

        this.lastCameraSettings = {
            position: new THREE.Vector3(0, 0, 0)
        }

        this.cameraTween = null

        // Setup

        this.setInstance()
        this.setOrbitControls()
        this.autoRotateControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            this.data.fov,
            this.data.aspect,
            this.data.near,
            this.data.far
        )
        this.instance.position.copy(this.data.position)
        this.scene.add(this.instance)
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.target.copy(this.data.lookAt)
        this.updateOrbitControls()
    }

    updateOrbitControls() {
        this.controls.update()
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

    updateCamera({ position, lookAt, controls, duration = this.data.moveDuration }) {
        if (this.cameraTween)
            this.cameraTween.stop()

        const from = {
            cameraPosition: new THREE.Vector3().copy(this.instance.position),
            cameraLookAt: new THREE.Vector3().copy(this.controls.target)
        }

        const to = {
            cameraPosition: position,
            cameraLookAt: lookAt
        }

        this.cameraTween = new TWEEN.Tween(from)
            .to(to, duration)
            .easing(TWEEN.Easing.Linear.None)
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
            .start()
        
        if (controls) {
            setTimeout(function() {
                camera.controls.minPolarAngle = controls.minPolarAngle
                camera.controls.maxPolarAngle = controls.maxPolarAngle
                camera.controls.minAzimuthAngle = controls.minAzimuthAngle
                camera.controls.maxAzimuthAngle = controls.maxAzimuthAngle
            }, this.data.moveDuration, controls)
        }
        
        this.controls.autoRotate = false
    }

    updateCameraTo(location) {
        if (location == null) return
        this.lastCameraSettings.position = new THREE.Vector3().copy(this.instance.position)
        this.updateCamera(this.cameraLocations[location])
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
    }

    addGUIControls() {
        const camera = this.debug.ui.addFolder('Camera')

        this.debugCamera = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.01, 5)
        this.debugCamera.position.set(0, 1.7, 3)
        this.scene.add(this.debugCamera)

        const cameraHelper = new THREE.CameraHelper(this.debugCamera)
        this.scene.add(cameraHelper)


        this.instance.position.copy(this.debugCamera.position)

        // Location
        camera.close()
        camera
            .add(this.data, 'location')
            .min(0)
            .max(this.cameraLocations.length - 1)
            .step(1)
            .onFinishChange((location) => {
                this.updateCameraTo(location)
            })
            .name('Location')


        camera.add(this.data, 'debug').name('debug')
            .onFinishChange((debug) => {
                if (debug) {
                    this.moveCameraTo(3)
                } else {
                    this.moveCameraTo(0)
                }
            })


        // Position
        const cameraPosition = camera.addFolder('Camera position')

        cameraPosition
            .add(this.data.position, 'x', -20, 20)
            .name('X')
            .onChange(
                (value) => { this.instance.position.x = value, this.data.position.x = value })
            .onFinishChange(
                (value) => { console.log(value) }
            )

        cameraPosition
            .add(this.data.position, 'y', -20, 20)
            .name('Y')
            .onChange((value) => { this.instance.position.y = value, this.data.position.y = value })

        cameraPosition
            .add(this.data.position, 'z', -20, 20)
            .name('Z')
            .onChange((value) => { this.instance.position.z = value, this.data.position.z = value })

        // Lookat
        const lookAtPosition = camera.addFolder('Look at point position')

        lookAtPosition
            .add(this.data.lookAt, 'x', -20, 20)
            .name('X')
            .onChange((value) => { this.instance.lookAt(new THREE.Vector3(value, 0, 0)), this.data.lookAt = new THREE.Vector3(value, 0, 0) })

        lookAtPosition
            .add(this.data.lookAt, 'y', -20, 20)
            .name('Y')
            .onChange((value) => { this.instance.lookAt(new THREE.Vector3(0, value, 0)), this.data.lookAt = new THREE.Vector3(0, value, 0) })

        lookAtPosition
            .add(this.data.lookAt, 'z', -20, 20)
            .name('Z')
            .onChange((value) => { this.instance.lookAt(new THREE.Vector3(0, 0, value)), this.data.lookAt = new THREE.Vector3(0, 0, value) })
    }
}