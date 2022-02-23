import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {

    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas

        // Setup
        this.setInstance()
        this.setOrbitControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000)
        this.instance.position.set(0, 1.7, 5)
        this.scene.add(this.instance)
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        // this.controls.target.y = 1.7
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.5;

        this.controls.addEventListener('end', () => {
            this.updateCameraOrbit()
        })

        this.updateCameraOrbit()
    }

    updateCameraOrbit() {
        // Update OrbitControls target to a point just in front of the camera
        const forward = new THREE.Vector3();
        this.instance.getWorldDirection(forward);

        this.controls.target.copy(this.instance.position).add(forward);
    }

    cameraMovement() {
        this.settings = {
            playhead: 0.001,
        }

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Camera animation')
            this.debugFolder
                .add(this.settings, 'playhead', 0.001, 1, 0.001)
        }

        // create curve for camera to portal
        this.bezier = new THREE.CubicBezierCurve3(
            new THREE.Vector3(-2.5, 2.5, 5),
            new THREE.Vector3(-1.54, 2.25, 3.09),
            new THREE.Vector3(-0.95, 2, 1.9),
            new THREE.Vector3(0, 1.5, 0)
        )

        // Create target
        const mat = new THREE.MeshStandardMaterial({ color: 'red' })
        const geo = new THREE.BoxGeometry(.1, .1, .1)
        this.target = new THREE.Mesh(geo, mat)
        this.target.position.y = 1.5
        this.scene.add(this.target)
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        this.controls.update()
    }
}