import * as THREE from 'three'
import Experience from "../Experience.js"

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
        this.program = this.experience.program


        this.clickableObjects = []
        this.currentIntersect = null
        this.originalMaterials = {}
        this.highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            visible: false
        })
        this.highlightedObjects = []

        // Setup
        this.resources = this.resources.items.controlRoom
        this.setModel()
        this.storeClickableObjects()
        this.setHightlight()

        // Events
        this.clickedObject()
    }

    // Set scene
    setModel() {
        this.model = this.resources.scene
        this.scene.add(this.model)
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
                    case 'Portal':
                        this.clickableObjects.push(child)
                        this.originalMaterials[child.name] = child.material
                        break

                    default:
                        break
                }
            }
        })
    }

    // Click events
    clickedObject() {
        window.addEventListener('mousedown', (event) => {
            this.raycaster.setFromCamera(this.pointer, this.camera.instance)
            const intersects = this.raycaster.intersectObjects(this.resources.scene.children)

            if (intersects.length) {
                this.currentIntersect = intersects[0].object
            }

            if (this.currentIntersect != null) {
                this.program.control(this.currentIntersect)
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

    update() {
        // Check intersection
        this.checkObjectIntersetion()

        // Hightlight hovered object
        this.highlightObject()

    }
}