import { Tween } from '@tweenjs/tween.js'
import * as THREE from 'three'
import { VideoTexture } from 'three'
import Experience from "../Experience.js"
import TWEEN from '@tweenjs/tween.js'

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
        this.screenObjects = []
        this.roomTexture = []
        this.videoObject = null
        this.currentIntersect = null

        // Highlight
        this.currentHighlight = null
        this.pulse = null

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
        this.setDefaultMaterials()
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

        this.controlRoom = this.resources.scene.children.find(child => child.name === 'control_room')
        this.tv_4x4_frame = this.resources.scene.children.find(child => child.name === 'tv_4x4')
        this.tv_4x5_frame = this.resources.scene.children.find(child => child.name === 'tv_4x5')
        this.tv_16x10_frame = this.resources.scene.children.find(child => child.name === 'tv_16x10')
        this.tv_16x9_frame = this.resources.scene.children.find(child => child.name === 'tv_16x9')

        this.tv_4x4 = this.resources.scene.children.find(child => child.name === 'tv_4x4_screen')
        this.tv_4x5 = this.resources.scene.children.find(child => child.name === 'tv_4x5_screen')
        this.tv_16x10 = this.resources.scene.children.find(child => child.name === 'tv_16x10_screen')
        this.tv_16x9 = this.resources.scene.children.find(child => child.name === 'tv_16x9_screen')
        this.tv_portal = this.resources.scene.children.find(child => child.name === 'tv_portal_screen')

        this.tablet = this.resources.scene.children.find(child => child.name === 'panel_screen')
        this.switcher = this.resources.scene.children.find(child => child.name === 'panel_time_switchers_holder')

        this.arrow_h = this.resources.scene.children.find(child => child.name === 'arrow_H')
        this.arrow_m = this.resources.scene.children.find(child => child.name === 'arrow_M')

        this.roomTexture.push(this.controlRoom, this.tablet, this.switcher, this.arrow_h, this.arrow_m, this.tv_4x4_frame, this.tv_4x5_frame, this.tv_16x10_frame, this.tv_16x9_frame)
        this.clickableObjects.push(this.tv_16x10, this.tv_16x9, this.tablet, this.switcher)
        this.screenObjects.push(this.tv_4x4, this.tv_4x5, this.tv_16x10, this.tv_16x9)
        this.videoObject = this.tv_portal

    }

    setDefaultMaterials() {

        this.roomTexture.forEach(child => {
            child.material = new THREE.MeshBasicMaterial({ map: this.bakedTexture })
            child.material.map.flipY = false
            child.material.map.encoding = THREE.sRGBEncoding
        })

        this.screenObjects.forEach(child => {

            if (child.name === 'tv_4x4_screen') {
                child.material = new THREE.MeshBasicMaterial({ map: this.sources.items.screen_default })
            }

            if (child.name === 'tv_4x5_screen') {
                child.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems['codes'].item })
            }

            if (child.name === 'tv_16x10_screen') {
                child.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems['map'].item })
            }

            if (child.name === 'tv_16x9_screen') {
                child.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems['BIEX_S01_E01_IRIS_SLEEP'].item })
            }


            if (child.material.map) {
                child.material.map.flipY = false
                child.material.map.encoding = THREE.sRGBEncoding
            }

        })

    }

    addHighlight(name) {
        if (this.currentHighlight)
            this.removeHighlight()

        if (name == 'tv_16x9_screen') {
            this.setHighlight(this.tv_16x9_frame)
            this.pulseHightlight()
        } else if (name == 'tv_16x10_screen') {
            this.setHighlight(this.tv_16x10_frame)
            this.pulseHightlight()
        } else {
            this.clickableObjects.filter(child => {
                if (child.name === name) {
                    this.setHighlight(child)
                    this.pulseHightlight()
                }
            })
        }
    }

    setHighlight(object) {
        this.currentHighlight = object

        const outlineGeometry = object.geometry
        const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
        this.outline.name = object.name + "_outline"
        object.add(this.outline)
    }

    removeHighlight() {
        this.currentHighlight.remove(this.outline)
        this.currentHighlight = null
    }

    pulseHightlight() {
        this.pulse = new TWEEN.Tween(this.outline.material)
            .to({ opacity: 1 }, 1500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .repeat(Infinity)
            .yoyo(true)
            .start()
    }

    // Set textures
    setTexture(meshName, texture) {
        if (!texture) return

        this.texture = texture
        texture.flipY = false
        this.changeMeshTexture(meshName, this.texture)
        this.playIfVideoTexture()
    }

    updateTextureScreen4x4() {
        this.tv_4x4.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems[this.world.program.currentVideo()] })
        this.tv_4x4.material.map.flipY = false
        this.tv_4x4.material.map.encoding = THREE.sRGBEncoding
    }

    changeMeshTexture(name, texture) {
        let mesh = this.screenObjects.filter((obj) => { return obj.name == name })
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