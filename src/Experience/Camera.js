import * as THREE from 'three'
import Experience from "./Experience.js";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js'

export default class Camera {

    constructor() {

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.time = this.experience.time
        this.debug = this.experience.debug


        this.clock = new THREE.Clock()

        this.cameraDirection = new THREE.Vector3()
        this.camPositionSpan = document.querySelector('#position')
        this.camLookAtSpan = document.querySelector('#lookingAt')


        // Setup
        this.setInstance()
        this.setFlyControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            75, //fov
            this.sizes.width / this.sizes.height, //aspect ratio
            0.1, //near plane
            1000 //far plane
        )
        this.instance.position.set(0, 1.7, 0)
        this.scene.add(this.instance)

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Camera')

            this.debugFolder
                .add(this.instance.position, 'x')
                .name('POS X')
                .min(-6)
                .max(6)
                .step(0.001)

            this.debugFolder
                .add(this.instance.position, 'y')
                .name('POS Y')
                .min(-6)
                .max(6)
                .step(0.001)

            this.debugFolder
                .add(this.instance.position, 'z')
                .name('POS Z')
                .min(-6)
                .max(6)
                .step(0.001)
        }
    }

    setFlyControls() {
        this.controls = new FlyControls(this.instance, this.canvas)
        this.controls.movementSpeed = 0.1
        this.controls.rollSpeed = Math.PI / 32
        this.controls.autoForward = false
        this.controls.dragToLook = true

        // this.controls.enableDamping = true
        // this.controls.dampingFactor = 0.25
        // this.controls.autoRotate = true
        // this.controls.autoRotateSpeed = 0.5

        // this.controls.screenSpacePanning = true
        // this.controls.maxAzimuthAngle = - Math.PI * 0.05
        // this.controls.minAzimuthAngle = - Math.PI * 0.4
        // this.controls.minPolarAngle = Math.PI * 0.3
        // this.controls.maxPolarAngle = Math.PI * 0.5
        // this.controls.maxDistance = 6
        // this.controls.minDistance = 3

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Controls')

            this.debugFolder
                .add(this.controls.target, 'x')
                .min(0)
                .max(20)
                .step(0.01)
                .name('target x')

            this.debugFolder
                .add(this.controls.target, 'y')
                .min(0)
                .max(20)
                .step(0.01)
                .name('target y')

            this.debugFolder
                .add(this.controls.target, 'z')
                .min(0)
                .max(20)
                .step(0.01)
                .name('target z')

        }

    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {

        // Update controls
        this.controls.update(0.1)

        this.instance.getWorldDirection(this.cameraDirection)

        this.cameraDirection.set(
            this.cameraDirection.x * 100,
            this.cameraDirection.y * 100,
            this.cameraDirection.z * 100)

        this.camPositionSpan.innerHTML =
            `Position:(${this.instance.position.x.toFixed(1)}, 
            ${this.instance.position.y.toFixed(1)}, 
            ${this.instance.position.z.toFixed(1)})`

        this.camLookAtSpan.innerHTML =
            `LookAt: (${(this.instance.position.x + this.cameraDirection.x).toFixed(1)},
            ${(this.instance.position.y + this.cameraDirection.y).toFixed(1)},
            ${(this.instance.position.z + this.cameraDirection.z).toFixed(1)})`
    }
}