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
    }

    add(name) {
        this.remove()
        this.clickableObjects.filter(child => {
            if (child.name === name) {
                this.set(child)
                this.pulse()
            }
        })
    }

    set(object) {
        this.currentHighlight = object

        const outlineGeometry = object.geometry
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0xfcb04e,
            transparent: true
        })
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
        this.outline.name = object.name + "_highlight"
        object.add(this.outline)

        if (object.name === "tv_16x9_screen") {
            this.outline.material.opacity = 0.6
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
            .to({ opacity: 0 }, 800)
            .easing(TWEEN.Easing.Quartic.Out)
            .yoyo(true)
            .onComplete(() => {
                this.remove()
            })
            .start()
    }

    pulse() {
        this.instance = new TWEEN.Tween(this.outline.material)
            .to({ opacity: 0 }, 800)
            .easing(TWEEN.Easing.Quartic.Out)
            .repeat(Infinity)
            .yoyo(true)
            .start()
    }
}