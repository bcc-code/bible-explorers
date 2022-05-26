import Experience from "../Experience.js";
import _s from '../Utils/Strings.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

export default class Points {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera

        this.objects = this.experience.world.controlRoom.clickableObjects
        this.currentLabel = null
        this.currentObject = null
        this.render()
    }

    add(name, type) {
        if (this.currentLabel)
            this.delete()

        this.objects.filter(child => {
            if (child.name === name) {
                // First step is a task description from Iris
                if (type == 'task') type = 'iris'
                this.create(child, _s.tooltips[type])
            }
        })
    }

    create(object, labelText) {
        const div = document.createElement('div')
        div.className = 'label'
        div.textContent = labelText

        const hightlight = document.createElement('div')
        hightlight.classList.add('highlight__circle')

        div.append(hightlight)

        this.currentLabel = new CSS2DObject(div)
        this.currentLabel.position.set(0, object.geometry.boundingBox.min.y, 0)
        this.currentObject = object
        this.currentObject.add(this.currentLabel)
    }

    delete() {
        if (!this.currentObject) return
        this.currentObject.remove(this.currentLabel)
        this.currentObject = null
        this.currentLabel = null
    }

    render() {
        this.labelRenderer = new CSS2DRenderer()
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
        document.body.appendChild(this.labelRenderer.domElement)
    }

    resize() {
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.labelRenderer.render(this.scene, this.camera.instance)
    }
}