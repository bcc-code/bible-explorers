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
        this.setScreensCamera()
        this.setPanelCamera()

        // Options

        this.options = {
            screensCamera: false,
            panelCamera: false
        }

        this.cameraSettings = {
            ro: new THREE.Vector3(0, 1.7, 5),
            lookAt: new THREE.Vector3(0, 1.7, 0),
            zoom: 1.15,
            isCameraFocused: false
        }

        this.cameraTween = null
        this.lastCameraSettings = {
            position: new THREE.Vector3(0, 0, 0)
        }

        this.cameraPivotGroup = new THREE.Group()

        if (this.debug.active) {
            const helper1 = new THREE.CameraHelper(this.screensCamera)
            const helper2 = new THREE.CameraHelper(this.panelCamera)

            this.scene.add(helper1, helper2)

            const camera = this.debug.ui.addFolder('Camera')

            camera
                .add(this.options, 'screensCamera')
                .onFinishChange((isFocused) => {
                    if (isFocused) {
                        this.switchCamera()
                    } else {
                        this.switchCameraBack()
                    }
                })
                .name('Screens Camera')

            camera
                .add(this.options, 'panelCamera')
                .onFinishChange((isFocused) => {
                    if (isFocused) {
                        this.switchCamera()
                    } else {
                        this.switchCameraBack()
                    }
                })
                .name('Panel Camera')


            const cameraPosition = camera.addFolder('Camera position')


        }

    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 1000)
        this.instance.position.set(0, 2.7, 10)
        this.scene.add(this.instance)
    }

    setScreensCamera() {
        this.screensCamera = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 17)
        this.screensCamera.position.set(0, 1.7, 1)
        this.scene.add(this.screensCamera)
    }

    setPanelCamera() {
        this.panelCamera = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 17)
        this.panelCamera.position.set(0, 1.7, 0)
        this.panelCamera.rotation.y -= Math.PI * 0.5
        this.scene.add(this.panelCamera)
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
    }

    updateOrbitControls() {
        this.controls.update()
    }

    switchCamera() {
        console.log('switch');
    }

    switchCameraBack() {
        console.log('switch back');
    }


    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {

    }
}