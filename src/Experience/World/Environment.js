import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.debug = this.experience.debug
        this.renderer = this.experience.renderer

        // Setup
        this.setEnvironmentMap()
        this.setSceneLights()

        this.params = {
            color: this.bulbLight.color.getHex()
        }

        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    setSceneLights() {
        this.bulbLight = new THREE.PointLight(0xd4af89, 1, 20, 2);
        this.bulbLight.position.set(0, 3.5, 0);
        this.bulbLight.power = 1700
        this.scene.add(this.bulbLight)
    }

    setEnvironmentMap() {
        this.environmentMap = {}
        this.environmentMap.intensity = 3
        this.environmentMap.texture = this.resources.items.environmentMap
        this.environmentMap.texture.encoding = THREE.sRGBEncoding


        this.scene.background = this.environmentMap.texture
        this.scene.environment = this.environmentMap.texture

        this.environmentMap.updateMaterials = () => {
            this.scene.traverse((child) => {

                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {

                    child.material.envMapIntensity = this.environmentMap.intensity
                    child.material.needsUpdate = true

                }

            })
        }

        this.environmentMap.updateMaterials()
    }

    addGUIControls() {
        if (this.debug.active) {

            const environment = this.debug.ui.addFolder('Environment')
            // environment.close()
            environment.add(this.environmentMap, 'intensity').min(0).max(20).step(0.01).name('intensity').onChange(() => { this.environmentMap.updateMaterials() })

            const light = this.debug.ui.addFolder('Light')
            // light.close()

            const bulbGeometry = new THREE.SphereGeometry(0.1, 16, 8)
            const bulbMaterial = new THREE.MeshStandardMaterial({
                emissive: 0xffffee,
                emissiveIntensity: 1,
                color: 0x000000
            })
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial)
            this.bulbLight.add(bulb)

            light.addColor(this.params, 'color').onChange(() => { this.bulbLight.color.setHex(this.params.color) })
            // bulbMaterial.emissiveIntensity = this.bulbLight.intensity / Math.pow(0.02, 2.0)
            light.add(this.bulbLight, 'power', 0, 3000).step(1)


        }
    }

}