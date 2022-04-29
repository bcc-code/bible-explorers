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
                this.create(child, _s.tooltips[type])
            }
        })
    }

    create(object, labelText) {
        const div = document.createElement('div')
        div.className = 'label'
        div.textContent = labelText

        this.currentLabel = new CSS2DObject(div)
        this.currentLabel.position.set(0, 0.2, 0)

        this.currentObject = object
        this.currentObject.add(this.currentLabel)
    }

    delete() {
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