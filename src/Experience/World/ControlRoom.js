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
        this.world = this.experience.world

        this.clickableObjects = []
        this.screenObjects = []
        this.roomTexture = []

        this.currentIntersect = null
        this.texture = null

        // Setup
        this.sources = this.resources
        this.resources = this.resources.items.controlRoom

        this.setModel()
        this.getObjects()
        this.getTextures()
        this.setMaterials()
        this.setAnimation()

        // Events
        window.addEventListener('click', () => {
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
        this.controlRoom = this.resources.scene.children.find(child => child.name === 'Controlroom')

        this.tv_4x4 = this.resources.scene.children.find(child => child.name === 'tv_4x4_screen')
        this.tv_4x5 = this.resources.scene.children.find(child => child.name === 'tv_4x5_screen')
        this.tv_16x10 = this.resources.scene.children.find(child => child.name === 'tv_16x10_screen')
        this.tv_16x9 = this.resources.scene.children.find(child => child.name === 'tv_16x9_screen')
        this.tv_portal = this.resources.scene.children.find(child => child.name === 'tv_portal_screen')

        this.tablet = this.resources.scene.children.find(child => child.name === 'Screen')
        this.lever = this.resources.scene.children.find(child => child.name === 'Switch')

        this.arrow_h = this.resources.scene.children.find(child => child.name === 'arrow_H')
        this.arrow_m = this.resources.scene.children.find(child => child.name === 'arrow_M')

        this.roomTexture.push(this.controlRoom, this.arrow_h, this.arrow_m)
        this.clickableObjects.push(this.tv_16x9, this.lever)
        this.screenObjects.push(this.tv_4x4, this.tv_4x5, this.tv_16x10, this.tv_16x9, this.tablet, this.tv_portal)
    }

    getTextures() {
        this.bakedTexture = this.sources.items.baked
    }

    setMaterials() {
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
                child.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems['iris'].item })
            }

            if (child.name === 'tv_portal_screen') {
                child.scale.set(0, 0, 0)
            }

            if (child.name === "Screen") {
                child.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems['hud'].item })
                child.material.map.image.pause()
            }

            if (child.material.map) {
                child.material.map.flipY = false
                child.material.map.encoding = THREE.sRGBEncoding
            }
        })

        this.clickableObjects.forEach(child => {
            child.layers.enable(1)
        })

        this.tv_portal.material = new THREE.MeshBasicMaterial({ color: 0x131A43 })
    }

    // Set textures
    setTexture(meshName, texture) {
        if (!texture) return

        this.texture = texture
        this.changeMeshTexture(meshName, this.texture)
        this.playIfVideoTexture()
    }

    changeMeshTexture(name, texture) {
        let mesh = this.screenObjects.filter((obj) => { return obj.name == name })
        if (mesh) {
            mesh[0].material.map = texture
        }
    }

    updateTextureScreen4x4() {
        this.tv_4x4.material = new THREE.MeshBasicMaterial({ map: this.sources.textureItems[this.world.program.currentVideo()] })
        this.tv_4x4.material.map.flipY = false
        this.tv_4x4.material.map.encoding = THREE.sRGBEncoding
    }

    playIfVideoTexture() {
        if (this.texture instanceof VideoTexture) {
            this.texture.image.play()
        }
    }

    // On click

    checkObjectIntersection() {
        this.raycaster.setFromCamera(this.pointer.position, this.camera.instance)
        this.raycaster.layers.set(1)
        const intersects = this.raycaster.intersectObjects(this.clickableObjects)

        if (intersects.length > 0) {
            this.setCurrentIntersect(intersects[0].object)
            document.body.style.cursor = 'pointer'
        } else {
            this.setCurrentIntersect(null)
            document.body.style.cursor = 'default'
        }
    }

    setCurrentIntersect(newIntersect) {
        if (this.currentIntersect != newIntersect) {
            // Hover over a new object
            this.currentIntersect = newIntersect
        }
    }

    clickedObject() {
        if (this.currentIntersect != null) {
            this.world.program.control(this.currentIntersect)
            this.currentIntersect = null
        }
    }

    // Set animations
    setAnimation() {
        this.animation = {}
        this.animation.mixer = new THREE.AnimationMixer(this.model)
    }

    leverAnimation() {
        const leverAnimation = THREE.AnimationClip.findByName(this.resources.animations, 'SwitchAction')
        const leverAction = this.animation.mixer.clipAction(leverAnimation)
        leverAction.loop = THREE.LoopOnce
        leverAction.play()
    }

    update() {
        if (this.clickableObjects)
            this.checkObjectIntersection()

        if (this.lever)
            this.animation.mixer.update(this.time.delta * 0.001)
    }
}