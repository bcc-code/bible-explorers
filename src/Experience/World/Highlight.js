import Experience from '../Experience.js'

export default class Highlight {
    constructor() {

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.debug = this.experience.debug
        this.raycaster = this.experience.raycaster
        this.pointer = this.experience.pointer

        this.outlinePass = this.experience.composer.instance.passes[1]

        this.selectedObjects = this.experience.world.controlRoom.clickableObjects
        this.currentIntersect = null

        this.params = {
            edgeStrength: 4,
            edgeGlow: 1,
            edgeThickness: 2,
            pulsePeriod: 2
        }

        this.configuration = {
            visibleEdgeColor: '#ffffff',
            hiddenEdgeColor: '#ff0000'
        }

        if (this.debug.active)
            this.addGUIControls()
    }

    setHightlight(objects) {
        this.outlinePass.selectedObjects = this.selectedObjects.filter((obj) => {
            return objects.includes(obj.name)
        })
        this.outlinePass.pulsePeriod =  this.params.pulsePeriod;
        this.outlinePass.edgeGlow = this.params.edgeGlow;
        this.outlinePass.edgeStrength = this.params.edgeStrength;
        this.outlinePass.edgeThickness = this.params.edgeThickness;
    }

    addGUIControls() {
        const highlight = this.debug.ui.addFolder('Highlight')

        highlight.close()
        
        highlight
            .add(this.params, 'edgeStrength', 0.01, 10)
            .onChange((value) => {
                this.outlinePass.edgeStrength = Number(value)
            })

        highlight
            .add(this.params, 'edgeGlow', 0.0, 1)
            .onChange((value) => {
                this.outlinePass.edgeGlow = Number(value)
            })

        highlight
            .add(this.params, 'edgeThickness', 1, 10)
            .onChange((value) => {
                this.outlinePass.edgeThickness = Number(value)
            })

        highlight
            .add(this.params, 'pulsePeriod', 0.0, 5)
            .onChange((value) => {
                this.outlinePass.pulsePeriod = Number(value)
            })


        highlight
            .add(this.configuration, 'visibleEdgeColor')
            .onChange((value) => {
                this.outlinePass.visibleEdgeColor.set(value)
            })

        highlight
            .add(this.configuration, 'hiddenEdgeColor')
            .onChange((value) => {
                this.outlinePass.hiddenEdgeColor.set(value)
            })


    }


}