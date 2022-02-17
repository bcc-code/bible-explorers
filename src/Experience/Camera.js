import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {

    constructor() {

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.debug = this.experience.debug

        // Setup
        this.setInstance()
        this.setOrbitControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            60, //fov
            this.sizes.width / this.sizes.height, //aspect ratio
            0.1, //near plane
            1000 //far plane
        )
        this.instance.position.set(-2.5, 2.5, 5)
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

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.25

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
        this.controls.update()
    }
}