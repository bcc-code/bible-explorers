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
        this.tv_16x9 = this.world.controlRoom.tv_16x9
        this.tv_16x10 = this.world.controlRoom.tv_16x10
    }

    add(name) {
        this.remove()

        if (name == 'tv_16x9_screen') {
            this.set(this.tv_16x9)
            this.pulse()
        } else if (name == 'tv_16x10_screen') {
            this.set(this.tv_16x10)
            this.pulse()
        } else {
            this.clickableObjects.filter(child => {
                if (child.name === name) {
                    this.set(child)
                    this.pulse()
                }
            })
        }
    }

    set(object) {
        this.currentHighlight = object

        const outlineGeometry = object.geometry
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        })
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
        this.outline.name = object.name + "_outline"
        this.outline.scale.multiplyScalar(1.05)
        object.add(this.outline)

        if (object.name === "tv_16x9_screen") {
            this.outline.position.z = -0.03
        }

        if (object.name === "panel_screen") {
            this.outline.visible = false
        }
    }

    remove() {
        if (!this.currentHighlight) return
        this.currentHighlight.remove(this.outline)
        this.currentHighlight = null
    }

    fadeOut() {
        if (!this.outline) return
        this.instance = new TWEEN.Tween(this.outline.material)
            .to({ opacity: 0 }, 1500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .yoyo(true)
            .onComplete(() => {
                this.remove()
            })
            .start()
    }

    pulse() {
        this.instance = new TWEEN.Tween(this.outline.material)
            .to({ opacity: 0 }, 1500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .repeat(Infinity)
            .yoyo(true)
            .start()
    }
}