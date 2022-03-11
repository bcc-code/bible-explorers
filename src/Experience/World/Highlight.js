import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
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

        this.deactivateObjectsExcept(objects)
    }

    deactivateObjectsExcept(objects) {
        let screenObjects = []
        objects.forEach((obj) => { screenObjects.push(obj += '_screen') })

        this.experience.resources.items.controlRoom.scene.children.forEach((mesh) => {
            if (mesh.name.includes('_screen')) {

                if (!screenObjects.includes(mesh.name)) {
                    mesh.material.color.set(new THREE.Color().setRGB(0.211,0.211,0.211))
                } else {
                    mesh.material.color.set(new THREE.Color().setRGB(1,1,1))
                }
            }
        })
    }

    hover(currentIntersect, newIntersect) {
        // Trigger only highlighted object
        if (!this.isHighlighted(currentIntersect) && !this.isHighlighted(newIntersect))
            return

        if (newIntersect != null) {
            // Moved away from a clickable object to another one
            this.scaleDown(currentIntersect)

            if (this.isHighlighted(newIntersect))
                this.scaleUp(newIntersect)
        }
        else {
            // Moved away from a clickable object
            this.scaleDown(currentIntersect)
        }
    }
 
    isHighlighted(intersect) {
        return this.outlinePass.selectedObjects.filter((obj) => { 
            return (intersect && obj.name == intersect.name)
        }).length
    }

    scaleUp(obj) {
        this.setupObjectScaleAnimation(obj, { x: 1.005, y: 1.005, z: 1 });

        let screen = this.experience.resources.items.controlRoom.scene.children.filter((mesh) => {
            return mesh.name == obj.name + '_screen'
        })
        if (screen.length)
            this.setupObjectScaleAnimation(screen[0], { x: 1.005, y: 1.005, z: 1 })
    }

    scaleDown(obj) {
        if (obj != null) {
            this.setupObjectScaleAnimation(obj, { x: 1, y: 1, z: 1 })

            let screen = this.experience.resources.items.controlRoom.scene.children.filter((mesh) => {
                return mesh.name == obj.name + '_screen'
            })
            if (screen.length)
                this.setupObjectScaleAnimation(screen[0], { x: 1, y: 1, z: 1 })
        }
    }

    setupObjectScaleAnimation(object, scale) {
        new TWEEN.Tween( object.scale )
            .to({ x: scale.x, y: scale.y, z: scale.z }, 300 )
            .easing( TWEEN.Easing.Quadratic.InOut )
            .start();
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