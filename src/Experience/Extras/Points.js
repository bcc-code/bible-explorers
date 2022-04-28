import Experience from "../Experience.js";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'


export default class Points {
    constructor() {

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera

        this.objects = this.experience.world.controlRoom.clickableObjects


        this.objects.forEach(child => {
            console.log(child);
            if (child.name === 'panel_screen') {
                this.createLabel(child)
            }
        })

        this.render()
    }

    createLabel(object) {
        const panelDiv = document.createElement('div')
        panelDiv.className = 'label'
        panelDiv.textContent = 'Panel'
        
        const panelLabel = new CSS2DObject(panelDiv)
        panelLabel.position.set(0, 0.1, 0)

        object.add(panelLabel)
    }

    render() {
        this.labelRenderer = new CSS2DRenderer()
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
        this.labelRenderer.domElement.style.position = 'absolute'
        this.labelRenderer.domElement.style.top = '0px'
        document.body.appendChild(this.labelRenderer.domElement)
    }

    resize() {
        this.labelRenderer.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.labelRenderer.render(this.scene, this.camera.instance)
    }

}