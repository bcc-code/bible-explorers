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
        this.world = this.experience.world

        this.clickableObjects = []
        this.textureObjects = []
        this.lights = []
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
                    case 'Panel_Cabels':
                        this.clickableObjects.push(child)
                        break

                    case 'tv_4x4_screen':
                        this.textureObjects.push(child)
                        this.setTexture(this.sources.textureItems['EternityBibleStories_Ep1_test'].item, 90)
                        child.material.map = this.texture
                        break
                    
                    case 'tv_4x5_screen':
                        this.setTexture(this.sources.items.UVChecker)
                        child.material.map = this.texture
                        break

                    case 'tv_16x9_5_screen':
                        this.textureObjects.push(child)
                        this.setTexture(this.sources.textureItems['BIEX_S01_E01_IRIS_SLEEP'].item, 90)
                        child.material.map = this.texture
                        break

                    case 'tv_16x10_screen':
                        this.setTexture(this.sources.items.screen_16x10)
                        child.material.map = this.texture
                        break

                    default:
                        child.receiveShadow = true
                        break
                }
            }
        })
    }

    checkObjectIntersection() {
        this.raycaster.setFromCamera(this.pointer.position, this.camera.instance)
        const intersects = this.raycaster.intersectObjects(this.clickableObjects)

        if (intersects.length > 0) {
            this.setCurrentIntersect(intersects[0].object)
        } else {
            this.setCurrentIntersect(null)
        }
    }

    setCurrentIntersect(newIntersect) {
        if (this.currentIntersect != newIntersect) {
            // Hover over a new object
            this.world.highlight.hover(this.currentIntersect, newIntersect)
            this.currentIntersect = newIntersect
        }
    }

    // Click events
    clickedObject() {
        if (this.currentIntersect != null) {
            this.world.program.control(this.currentIntersect)
        }
    }

    update() {
        this.checkObjectIntersection()
    }
}