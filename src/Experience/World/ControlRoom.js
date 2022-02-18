import * as THREE from 'three'
import Experience from "../Experience.js"
import Timer from '../Timer.js'
import CodeUnlock from '../CodeUnlock.js'
import Modal from '../Modal.js'

export default class ControlRoom {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.renderer = this.experience.renderer
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.raycaster = this.experience.raycaster
        this.pointer = this.experience.pointer
        this.time = this.experience.time
        this.debug = this.experience.debug

        console.log(this.time);

        this.pointsOfInterests = []
        this.clickableObjects = []
        this.currentIntersect = null
        this.originalMaterials = {}
        this.highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.BackSide,
            visible: false
        })
        this.highlightedObjects = []

        // General scene paramters
        this.params = {
            rotate: false,
        }

        // Event witness
        this.witness = {
            popupOpen: false,
        }

        // Setup
        this.resources = this.resources.items.controlRoom
        this.setModel()
        this.setPointsOfInterest()
        this.storeClickableObjects()
        this.setHightlight()

        window.addEventListener('mousemove', (event) => {
            this.mousemove(event)
        })

        // Events
        this.clickedObject()
        this.cameraMovement()
    }

    // Set scene
    setModel() {
        this.model = this.resources.scene
        this.scene.add(this.model)
    }

    mousemove(event) {
        this.pointer.x = (event.clientX / this.sizes.width) * 2 - 1;
        this.pointer.y = - (event.clientY / this.sizes.height) * 2 + 1;
    }

    checkObjectIntersetion() {
        this.raycaster.setFromCamera(this.pointer, this.camera.instance)
        const intersects = this.raycaster.intersectObjects(this.clickableObjects, false)

        if (intersects.length > 0) {
            this.currentIntersect = intersects[0].object
        } else {
            this.currentIntersect = null
        }
    }

    // Set points of interest (POI)
    setPointsOfInterest() {

        const panelScreen = {
            name: 'Panel_Screen',
            position: new THREE.Vector3(1.6, 1.2, 0.01),
            element: document.querySelector('.point-0')
        }

        this.pointsOfInterests.push(panelScreen)
    }

    updatePointsOfInterest() {

        for (const point of this.pointsOfInterests) {
            const screenPosition = point.position.clone()
            screenPosition.project(this.camera.instance)

            const translateX = screenPosition.x * this.sizes.width * 0.5
            const translateY = - screenPosition.y * this.sizes.height * 0.5

            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
            point.element.classList.add('visible')
        }
    }

    // Store clickable objects
    storeClickableObjects() {
        this.resources.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                switch (child.name) {
                    case 'tv_4x4':
                    case 'tv_4x5':
                    case 'tv_16x10':
                    case 'tv_16x9_5':
                    case 'Panel_Screen':
                        this.clickableObjects.push(child)
                        this.originalMaterials[child.name] = child.material
                        break

                    default:
                        break

                }
            }
        })
    }

    // Highlight objects
    setHightlight() {
        this.clickableObjects.forEach((object) => {
            let highlight = object.clone()

            highlight.material = this.highlightMaterial.clone()
            highlight.scale.multiplyScalar(1.05)

            this.highlightedObjects.push(highlight)
            this.scene.add(highlight)
        })
    }

    highlightObject() {
        this.highlightedObjects.forEach((object) => {
            if (this.currentIntersect && this.currentIntersect.name === object.name) {
                object.material.visible = true
            } else {
                object.material.visible = false
            }
        })
    }

    // Click events
    clickedObject() {
        window.addEventListener('click', (event) => {
            this.raycaster.setFromCamera(this.pointer, this.camera.instance)
            const intersects = this.raycaster.intersectObjects(this.resources.scene.children)

            if (intersects.length) {
                this.currentIntersect = intersects[0].object
            }

            if (this.currentIntersect != null) {
                if (this.currentIntersect.name === 'tv_4x4_screen') {
                    new Timer()
                }

                if (this.currentIntersect.name === 'tv_4x5_screen') {
                    new CodeUnlock()
                }

                if (this.currentIntersect.name === 'Panel_Screen') {
                    new Modal('.screen-panel')
                }

                if (this.currentIntersect.name === 'Panel_Red_button') {
                    new Modal('.screen-1')
                }

                if (this.currentIntersect.name === 'Panel_Green_button') {
                    new Modal('.screen-2')
                }
            }
        })
    }

     // Camera animation
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

    update() {

        // Check intersection
        this.checkObjectIntersetion()

        // Update points on screen
        this.updatePointsOfInterest()

        // Hightlight hovered object
        this.highlightObject()


        // const playhead = this.settings.playhead

        // Update target
        // this.target.position.x = Math.sqrt(playhead) * 2

        // // Update camera
        // this.instance.lookAt(this.target.position)
        // const pos = this.bezier.getPoint(playhead)

        // this.instance.position.set(pos.x, pos.y, pos.z)
    }
}