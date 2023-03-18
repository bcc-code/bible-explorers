import Experience from "../Experience.js";
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

let instance = null

export default class Points {
    constructor() {
        instance = this

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.world = this.experience.world

        this.objects = this.experience.world.controlRoom.clickableObjects
        this.currentLabel = null
        this.previousLabel = null
        this.currentObject = null

        this.render()
        this.addEventListeners()
    }

    add(name, type) {
        if (this.currentLabel)
            this.delete()

        this.objects.filter(child => {
            if (child.name === name) {
                // First checkpoint is a task description from Iris
                if (type == 'task') type = 'iris'

                this.create(child, _s.tooltips[type])
                setTimeout(function () { instance.fadeIn() }, 50)
            }
        })
    }

    create(object, labelText) {
        const div = document.createElement('div')
        div.className = 'highlight-label'
        div.textContent = labelText

        const highlight = document.createElement('div')
        highlight.classList.add('highlight-circle')

        this.previousLabel = this.currentLabel
        this.currentLabel = new CSS2DObject(highlight)

        if (object.name === "tv_16x9_screen") {
            const posX = object.geometry.boundingBox.min.x + 0.1
            const posY = object.geometry.boundingBox.max.y - 0.1
            this.currentLabel.position.set(posX, posY, 0)
        }

        if (object.name === "Switcher") {
            const posX = object.geometry.boundingBox.min.x
            const posY = object.geometry.boundingBox.min.y
            this.currentLabel.position.set(posX, posY, 0)
        }

        this.currentLabel.name = object.name
        this.currentObject = object
        this.currentObject.add(this.currentLabel)
    }

    delete() {
        this.previousLabel = this.currentLabel

        if (!this.currentObject) return

        this.currentObject.remove(this.currentLabel)
        this.currentObject = null
        this.currentLabel = null
    }

    fadeIn() {
        if (!this.currentLabel) return
        this.currentLabel.element.classList.add('fade-in')
    }

    fadeOut() {
        if (!this.currentLabel) return
        this.currentLabel.element.classList.remove('fade-in')
    }

    render() {
        this.labelRenderer = new CSS2DRenderer()
        this.labelRenderer.domElement.classList.add('points')
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
        document.body.appendChild(this.labelRenderer.domElement)
    }

    addEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.delete)
    }

    resize() {
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.labelRenderer.render(this.scene, this.camera.instance)
    }
}