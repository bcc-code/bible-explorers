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
        this.animatedObjects = []
        this.videoObject = null
        this.currentIntersect = null

        this.rotation = {
            max: Math.PI * 0.5,
            min: - (Math.PI * 0.5),
            speed: 0.005
        }

        // Baked material
        this.bakedTexture = this.resources.items.baked

        // Setup
        this.sources = this.resources
        this.texture = null
        this.resources = this.resources.items.controlRoom

        this.setModel()
        this.getObjects()
        this.setAnimation()

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

    getObjects() {

        this.resources.scene.traverse((child) => {

            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {

                child.material = new THREE.MeshBasicMaterial({ color: 0xffffff })

                if (child.name !== 'tv_4x4_screen' && child.name !== 'tv_4x5_screen' && child.name !== 'tv_16x10_screen' && child.name !== 'tv_16x9_screen' && child.name !== 'tv_portal_screen') {
                    child.material.map = this.bakedTexture
                }

                switch (child.name) {
                    case 'panel_screen':
                    case 'panel_time_switchers_holder':
                        this.clickableObjects.push(child)
                        break

                    case 'tv_4x4_screen':
                    case 'tv_4x5_screen':
                    case 'tv_16x10_screen':
                    case 'tv_16x9_screen':
                        this.textureObjects.push(child)
                        this.clickableObjects.push(child)

                        if (child.name === 'tv_4x5_screen') {
                            child.material.map = this.sources.items.code_default
                        }

                        if (child.name === 'tv_16x10_screen') {
                            child.material.map = this.sources.items.map_default
                        }

                        if (child.name === 'tv_16x9_screen') {
                            child.material.map = this.sources.items.iris_default
                        }

                        break


                    case 'arrow_H':
                    case 'arrow_M':
                        this.animatedObjects.push(child)
                        break

                    case 'tv_portal_screen':
                        this.videoObject = child
                        break

                    default:
                        break
                }

                if (child.material.map) {
                    child.material.map.flipY = false
                    child.material.map.encoding = THREE.sRGBEncoding
                }

            }
        })

    }

    // Set textures
    setTexture(meshName, texture) {
        if (!texture) return

        this.texture = texture
        texture.flipY = false
        this.changeMeshTexture(meshName, this.texture)
        this.playIfVideoTexture()
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

                case 'tv_16x9_screen':
                    this.setTexture(obj.name, this.sources.textureItems['BIEX_S01_E01_IRIS_SLEEP'].item)
                    break

                case 'tv_16x10_screen':
                    this.setTexture(obj.name, this.sources.textureItems['map'].item)
                    break

            }
        })
    }

    changeMeshTexture(name, texture) {
        let mesh = this.textureObjects.filter((obj) => { return obj.name == name })
        if (mesh) {
            mesh[0].material.map = texture
        }
    }

    playIfVideoTexture() {
        if (this.texture instanceof VideoTexture) {
            this.texture.image.play()
        }

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
            this.currentIntersect = newIntersect
        }
    }

    // Set animations

    setAnimation() {
        this.animation = {}
        this.animation.mixer = new THREE.AnimationMixer(this.model)

        this.animation.actions = {}

        this.animation.actions.arrow_m = this.animation.mixer.clipAction(this.resources.animations[0])
        this.animation.actions.arrow_m.play()

        this.animation.actions.arrow_h = this.animation.mixer.clipAction(this.resources.animations[1])
        this.animation.actions.arrow_h.play()

    }

    // Click events
    clickedObject() {
        if (this.currentIntersect != null) {
            this.world.program.control(this.currentIntersect)
        }
    }

    update() {
        this.checkObjectIntersection()
        this.animation.mixer.update(this.time.delta * 0.001)
    }
}