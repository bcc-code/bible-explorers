import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import TWEEN from '@tweenjs/tween.js'

export default class Camera {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.debug = this.experience.debug

        // Options

        this.cameraSettings = {
            fov: 60,
            aspect: this.sizes.width / this.sizes.height,
            near: 0.1,
            far: 1000,

            position: new THREE.Vector3(0, 1.7, 10),
            lookAt: new THREE.Vector3(0, 1.7, 0),
            location: 0
        }

        this.cameraLocations = [
            {
                position: new THREE.Vector3(0, 1.7, 10),
                lookAt: new THREE.Vector3(0, 1.7, 0)
            },
            {
                position: new THREE.Vector3(-4.2, 1.7, 3.6),
                lookAt: new THREE.Vector3(-0.28, 1.3, -0.8)
            },
            {
                position: new THREE.Vector3(-0.7, 1.7, 0),
                lookAt: new THREE.Vector3(0.1, 1.7, 0)
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

        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            this.cameraSettings.fov,
            this.cameraSettings.aspect,
            this.cameraSettings.near,
            this.cameraSettings.far
        )
        this.instance.position.copy(this.cameraSettings.position)
        this.scene.add(this.instance)
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.target.copy(this.cameraSettings.lookAt)
        this.updateOrbitControls()
    }

    updateOrbitControls() {
        this.controls.update()
    }

    autoRotateControls() {
        this.counter = 0
        this.controls.enableDamping = true
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

    animateCamera({ position, lookAt, duration = 1200 }) {
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

                this.controls.update()
            })
            .start()

        this.controls.autoRotate = false
    }

    moveCameraTo(location) {
        if (location == null) return
        this.lastCameraSettings.position = new THREE.Vector3().copy(this.instance.position)
        this.animateCamera(this.cameraLocations[location])
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        TWEEN.update()

        if (this.controls.autoRotate) {
            this.controls.update()
            this.changeRotateDirection()
        }
    }

    addGUIControls() {
        const camera = this.debug.ui.addFolder('Camera')

        // Location
        // camera.close()
        camera
            .add(this.cameraSettings, 'location')
            .min(0)
            .max(this.cameraLocations.length - 1)
            .step(1)
            .onFinishChange((location) => {
                this.moveCameraTo(location)
            })
            .name('Location')

        // Position
        const cameraPosition = camera.addFolder('Camera position')

        cameraPosition
            .add(this.cameraSettings.position, 'x', -20, 20)
            .name('X')
            .onChange(
                (value) => { this.instance.position.x = value, this.cameraSettings.position.x = value })
            .onFinishChange(
                (value) => { console.log(value) }
            )

        cameraPosition
            .add(this.cameraSettings.position, 'y', -20, 20)
            .name('Y')
            .onChange((value) => { this.instance.position.y = value, this.cameraSettings.position.y = value })

        cameraPosition
            .add(this.cameraSettings.position, 'z', -20, 20)
            .name('Z')
            .onChange((value) => { this.instance.position.z = value, this.cameraSettings.position.z = value })

        // Lookat
        const lookAtPosition = camera.addFolder('Look at point position')

        lookAtPosition
            .add(this.cameraSettings.lookAt, 'x', -20, 20)
            .name('X')
            .onChange((value) => { this.instance.lookAt(new THREE.Vector3(value, 0, 0)), this.cameraSettings.lookAt = new THREE.Vector3(value, 0, 0) })

        lookAtPosition
            .add(this.cameraSettings.lookAt, 'y', -20, 20)
            .name('Y')
            .onChange((value) => { this.instance.lookAt(new THREE.Vector3(0, value, 0)), this.cameraSettings.lookAt = new THREE.Vector3(0, value, 0) })

        lookAtPosition
            .add(this.cameraSettings.lookAt, 'z', -20, 20)
            .name('Z')
            .onChange((value) => { this.instance.lookAt(new THREE.Vector3(0, 0, value)), this.cameraSettings.lookAt = new THREE.Vector3(0, 0, value) })
    }
}