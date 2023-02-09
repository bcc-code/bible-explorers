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
        }
        else {
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
            color: 0xfcb04e,
            transparent: true,
            opacity: 0.6
        })
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
        this.outline.name = object.name + "_outline"
        object.add(this.outline)

        if (object.name === "tv_16x9_screen") {
            this.outline.position.z = 0.001
        }

        if (object.name === "Switch") {
            this.outline.material.opacity = 1
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