import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import TWEEN from '@tweenjs/tween.js'
import LabeledSphere3D from './Components/LabeledSphere3D.js'

let camera = null

export default class Camera {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.debug = this.experience.debug
        camera = this

        // Options
        this.data = {
            position: new THREE.Vector3(0, 1.7, 10),
            lookAt: new THREE.Vector3(0, 1.7, 0),
            moveDuration: 1200,
            zoom: 1.15,
            location: 0,
            debug: false,
        }

        this.lookAtLabel3D = new LabeledSphere3D({
            labelText: '(Look at)',
            size: 0.05,
            color: new THREE.Color().setRGB(0.65, 0.792, 0.219)
        })

        this.scene.add(this.lookAtLabel3D)

        console.log(this.lookAtLabel3D);

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

        if (this.debug.active)
            this.addGUIControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(60, this.sizes.width / this.sizes.height, 0.01, 1000)
        this.instance.position.copy(this.data.position)
        this.scene.add(this.instance)
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.target.copy(this.data.lookAt)
        this.controls.update()
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

        if (controls && !this.debug.active) {
            setTimeout(function () {
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

        this.lookAtLabel3D.setPosition(new THREE.Vector3(this.data.lookAt.x, this.data.lookAt.y, this.data.lookAt.z))

        if (this.controls.autoRotate) {
            this.changeRotateDirection()
        }
    }

    addGUIControls() {
        const camera = this.debug.ui.addFolder('Camera')
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


        // Position
        const cameraPosition = camera.addFolder('Camera position')

    }
}