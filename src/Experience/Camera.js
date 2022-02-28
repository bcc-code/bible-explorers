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


        console.log(TWEEN);
        // Options

        this.cameraSettings = {
            fov: 45,
            aspect: this.sizes.width / this.sizes.height,
            near: 0.1,
            far: 100,

            position: new THREE.Vector3(0, 1.7, 10),
            lookAt: new THREE.Vector3(0, 1.7, 0),
            isCameraFocused: false,
        }

        this.newCameraSettings = {
            position: new THREE.Vector3(0, 1.7, 0),
            lookAt: new THREE.Vector3(10, 1.7, 0),
            isCameraFocused: false,
        }

        this.lastCameraSettings = {
            position: new THREE.Vector3(0, 0, 0)
        }

        this.cameraTween = null

        // Setup
        this.setInstance()
        this.setOrbitControls()

        if (this.debug.active) {
            this.addGUIControls()
        }

    }

    addGUIControls() {

        const camera = this.debug.ui.addFolder('Camera')

        camera
            .add(this.cameraSettings, 'isCameraFocused')
            .onFinishChange((isFocused) => {
                if (isFocused) {
                    this.focusCamera()
                } else {
                    this.defocusCamera()
                }
            })
            .name('Action Camera')

        // Position
        const cameraPosition = camera.addFolder('Camera position')

        cameraPosition
            .add(this.cameraSettings.position, 'x', -20, 20)
            .name('X')
            .onChange(
                (value) => { this.instance.position.x = value, this.cameraSettings.position.x = value })

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

    animateCamera({ position, lookAt, duration = 1200 }) {

        // const _controls = this.controls

        if (this.cameraTween)
            this.cameraTween.stop()

        const from = {
            cameraPosition: new THREE.Vector3(
                this.instance.position.x,
                this.instance.position.y,
                this.instance.position.z,
            ),

            cameraLookAt: new THREE.Vector3(
                this.controls.target.x,
                this.controls.target.y,
                this.controls.target.z,
            )
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

        this.cameraTween.start()
    }

    focusCamera() {
        this.lastCameraSettings.position = new THREE.Vector3().copy(this.instance.position)
        this.animateCamera({
            position: this.newCameraSettings.position,
            lookAt: this.newCameraSettings.lookAt
        })
    }

    defocusCamera() {
        this.animateCamera({
            position: new THREE.Vector3(
                this.lastCameraSettings.position.x,
                this.lastCameraSettings.position.y,
                this.lastCameraSettings.position.z,
            ),
            lookAt: this.cameraSettings.lookAt
        })
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        TWEEN.update()
    }
}