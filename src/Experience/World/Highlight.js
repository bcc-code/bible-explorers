import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import Experience from '../Experience.js'

export default class Highlight {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.world = this.experience.world

        // Setup
        this.currentHighlight = null
        this.clickableObjects = this.world.controlRoom.clickableObjects
        this.tv_16x9_frame = this.world.controlRoom.tv_16x9_frame
        this.tv_16x10_frame = this.world.controlRoom.tv_16x10_frame
    }

    add(name) {
        if (this.currentHighlight)
            this.remove()

        if (name == 'tv_16x9_screen') {
            this.set(this.tv_16x9_frame)
            // this.pulse()
        } else if (name == 'tv_16x10_screen') {
            this.set(this.tv_16x10_frame)
            // this.pulse()
        } else {
            this.clickableObjects.filter(child => {
                if (child.name === name) {
                    this.set(child)
                    // this.pulse()
                }
            })
        }
    }

    set(object) {
        this.currentHighlight = object

        const outlineGeometry = object.geometry
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.1,
        })
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
        this.outline.name = object.name + "_outline"
        object.add(this.outline)
    }

    remove() {
        this.currentHighlight.remove(this.outline)
        this.currentHighlight = null
    }

    pulse() {
        this.instance = new TWEEN.Tween(this.outline.material)
            .to({ opacity: 0.5 }, 1500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .repeat(Infinity)
            .yoyo(true)
            .start()
    }
}