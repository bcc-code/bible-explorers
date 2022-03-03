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
        this.program = this.experience.world.program

        this.clickableObjects = []
        this.currentIntersect = null

        this.rotation = {
            max: Math.PI * 0.5,
            min: - (Math.PI * 0.5),
            speed: 0.005
        }

        // Setup
        this.sources = this.resources
        this.texture = null
        this.resources = this.resources.items.controlRoom

        this.setModel()
        this.storeMeshes()

        // Events
        window.addEventListener('mousedown', () => {
            if (this.experience.world.program)
                this.clickedObject()
        })
    }

    // Set scene
    setModel() {
        this.model = this.resources.scene
        this.scene.add(this.model)
    }

    // Set textures
    setTexture(texture, rotation = 0) {
        this.texture = texture
        this.texture.rotation = THREE.Math.degToRad(rotation)
        this.texture.flipY = false
        this.texture.wrapS = THREE.RepeatWrapping
        this.texture.wrapT = THREE.RepeatWrapping
        this.texture.encoding = THREE.sRGBEncoding
    }

    storeMeshes() {
        this.resources.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                switch (child.name) {
                    // Store clickable objects
                    case 'tv_4x4':
                    case 'tv_4x5':
                    case 'tv_16x10':
                    case 'tv_16x9_5':
                    case 'Panel_Screen':
                    case 'Panel_Red_button':
                    case 'Panel_Green_button':
                        this.clickableObjects.push(child)
                        break

                    // Set new textures
                    case 'tv_16x9_5_screen':
                        this.setTexture(this.sources.items.screen_16x9_5, 90)
                        child.material.map = this.texture
                        break

                    case 'tv_16x10_screen':
                        this.setTexture(this.sources.items.screen_16x10, 0)
                        child.material.map = this.texture
                        break

                    default:
                        child.receiveShadow = true
                        break
                }
            }
        })
    }

    checkObjectIntersetion() {
        this.raycaster.setFromCamera(this.pointer.position, this.camera.instance)
        const intersects = this.raycaster.intersectObjects(this.clickableObjects)

        if (intersects.length > 0) {
            this.currentIntersect = intersects[0].object
        } else {
            this.currentIntersect = null
        }
    }

    // Click events
    clickedObject() {
        if (this.currentIntersect != null) {
            this.experience.world.program.control(this.currentIntersect)
        }
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
    }
}