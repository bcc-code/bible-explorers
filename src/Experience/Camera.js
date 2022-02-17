import * as THREE from 'three'
import Experience from "./Experience.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

export default class Camera {

    constructor() {

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        this.loaded = false

        // Setup
        this.setInstance()

        this.resources.on('ready', () => {
            this.loaded = true
            this.resources = this.resources.items.controlRoom

            // this.setOrbitControls()
            this.cameraMovement()

            console.log(this.instance.position);

        })
    }

    setInstance() {


        this.instance = new THREE.PerspectiveCamera(
            60,
            this.sizes.width / this.sizes.height,
            0.1,
            100
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

        this.controls.screenSpacePanning = true
        this.controls.maxAzimuthAngle = - Math.PI * 0.05
        this.controls.minAzimuthAngle = - Math.PI * 0.4
        this.controls.minPolarAngle = Math.PI * 0.3
        this.controls.maxPolarAngle = Math.PI * 0.5
        this.controls.maxDistance = 6
        this.controls.minDistance = 3

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Controls')

            this.debugFolder
                .add(this.controls.target, 'x')
                .name('target x')

            this.debugFolder
                .add(this.controls.target, 'y')
                .name('target y')

            this.debugFolder
                .add(this.controls.target, 'z')
                .name('target z')

        }

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

        const points = this.bezier.getPoints(50)
        const bezGeo = new THREE.BufferGeometry().setFromPoints(points)
        const bezMat = new THREE.LineBasicMaterial({ color: 0xff0000 })
        const bezier = new THREE.Line(bezGeo, bezMat)
        // this.scene.add(bezier)

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

        if (this.loaded) {
            const playhead = this.settings.playhead

            // Update target
            this.target.position.x = Math.sqrt(playhead) * 2

            // // Update camera
            this.instance.lookAt(this.target.position)
            const pos = this.bezier.getPoint(playhead)

            this.instance.position.set(pos.x, pos.y, pos.z)
        }



        // Update controls
        // this.controls.update()
    }
}