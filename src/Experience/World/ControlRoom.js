import * as THREE from 'three'
import { VideoTexture } from 'three'
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
        this.videoObject = null
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
        this.setDefaultTextureToScreens()

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
    setTexture(meshName, texture, rotation = 0) {
        if (!texture) return

        this.texture = texture
        this.texture.rotation = THREE.Math.degToRad(rotation)
        this.texture.flipY = false
        this.texture.wrapS = THREE.RepeatWrapping
        this.texture.wrapT = THREE.RepeatWrapping
        this.texture.encoding = THREE.sRGBEncoding

        this.changeMeshTexture(meshName, this.texture)
        this.playIfVideoTexture()
    }

    changeMeshTexture(name, texture) {
        let mesh = this.textureObjects.filter((obj) => { return obj.name == name })
        if (mesh) {
            mesh[0].material.map = texture
        }
    }

    playIfVideoTexture() {
        if (this.texture instanceof VideoTexture)
            this.texture.image.play()
    }

    setDefaultTextureToScreens() {
        this.textureObjects.forEach((obj) => {
            obj.material.color.set(new THREE.Color().setRGB(0, 0, 0))
        })
    }

    storeMeshes() {
        this.resources.scene.traverse((child) => {

            console.log(child);
            
            if (child instanceof THREE.Mesh) {
                switch (child.name) {
                    // Store clickable objects
                    case 'tv_4x4':
                    case 'tv_4x5':
                    case 'tv_16x10':
                    case 'tv_16x9_5':
                    case 'Panel_Screen':
                    case 'Panel_time_switch_2_1':
                    case 'Panel_time_switch_1_1':
                    case 'Panel_Cabels':
                        this.clickableObjects.push(child)
                        break

                    case 'Portal':
                        this.videoObject = child
                        break

                    case 'tv_4x4_screen':
                    case 'tv_4x5_screen':
                    case 'tv_16x9_5_screen':
                    case 'tv_16x10_screen':
                        this.textureObjects.push(child)
                        break

                    default:
                        child.receiveShadow = true
                        break
                }
            }
        })
    }

    setUpTextures() {
        this.textureObjects.forEach((obj) => {
            switch (obj.name) {
                case 'tv_4x4_screen':
                    this.setTexture(obj.name, this.sources.textureItems[this.world.program.currentVideo()])
                    break

                case 'tv_4x5_screen':
                    this.setTexture(obj.name, this.sources.textureItems['codes'].item)
                    break

                case 'tv_16x9_5_screen':
                    this.setTexture(obj.name, this.sources.textureItems['BIEX_S01_E01_IRIS_SLEEP'].item)
                    break

                case 'tv_16x10_screen':
                    this.setTexture(obj.name, this.sources.textureItems['map'].item)
                    break
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