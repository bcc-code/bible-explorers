import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap';

export default class Camera {

    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.debug = this.experience.debug

        // Options

        this.cameraSettings = {
            position: new THREE.Vector3(0, 1.7, 10),
            lookAt: new THREE.Vector3(0, 1.7, 0),
            zoom: 1.15,
            isCameraFocused: false,
        }

        this.newCameraSettings = {
            position: new THREE.Vector3(0, 1.7, 1.5),
            lookAt: new THREE.Vector3(0.1, 1.7, 1.5),
            isCameraFocused: false,
        }

        this.lastCameraSettings = {
            position: new THREE.Vector3(0, 1.7, 10)
        }

        // Setup
        this.setInstance()
        this.setOrbitControls()

        if (this.debug.active) {
            this.addGUIControls()
        }

    }

    addGUIControls() {
        const helper1 = new THREE.CameraHelper(this.instance)

        this.scene.add(helper1)


        const camera = this.debug.ui.addFolder('Camera')
        camera.add(this.cameraSettings, 'zoom', 0.15, 5).name('Focal length')
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

        const cameraPosition = camera.addFolder('Camera position')
        cameraPosition.add(this.cameraSettings.position, 'x', -20, 20).name('X')
        cameraPosition.add(this.cameraSettings.position, 'y', -20, 20).name('Y')
        cameraPosition.add(this.cameraSettings.position, 'z', -20, 20).name('Z')

        const lookAtPosition = camera.addFolder('Look at point position')
        lookAtPosition.add(this.cameraSettings.lookAt, 'x', -20, 20).name('X')
        lookAtPosition.add(this.cameraSettings.lookAt, 'y', -20, 20).name('Y')
        lookAtPosition.add(this.cameraSettings.lookAt, 'z', -20, 20).name('Z')

    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 1000)
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

    animateCamera({ position, lookAt }) {

        const _controls = this.controls

        const _to = {
            cameraPosition: {
                x: position.x,
                y: position.y,
                z: position.z,
                duration: 2.5
            },
            cameraLookAt: {
                x: lookAt.x,
                y: lookAt.y,
                z: lookAt.z,
                duration: 2.5,
                onUpdate() {
                    _controls.update()
                }
            }
        }

        gsap.to(this.instance.position, _to.cameraPosition)
        gsap.to(this.controls.target, _to.cameraLookAt)


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

    }
}