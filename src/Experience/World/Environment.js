import { update } from '@tweenjs/tween.js'
import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        // Setup
        this.setLight()
        this.setEnvironmentMap()

        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    setLight() {
        this.platformPointLight = new THREE.PointLight(0xFFCE96, 200, 5);
        this.platformPointLight.position.set(0, 3.75, 0);
        this.platformPointLight.name = 'Platform_light'
        this.scene.add(this.platformPointLight);

        this.elevatorPointLight = new THREE.PointLight(0xFFCB80, 100, 5);
        this.elevatorPointLight.position.set(-11.3, 3.6, 0);
        this.elevatorPointLight.name = 'Elevator_light'
        this.scene.add(this.elevatorPointLight);
    }

    setEnvironmentMap() {
        this.environmentMap = {}
        this.environmentMap.intensity = 0
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

            const bulbGeometry = new THREE.SphereGeometry(0.2, 16, 8)
            const bulbMaterial = new THREE.MeshStandardMaterial({
                emissive: 0xFFCE96,
                emissiveIntensity: this.platformPointLight.intensity,
                color: 0x000000
            })
            const bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial)
            this.platformPointLight.add(bulbMesh)
            this.elevatorPointLight.add(bulbMesh)

            const environment = this.debug.ui.addFolder('Envitornment')
            environment.add(this.environmentMap, 'intensity').min(0).max(20).step(0.001).name('intensity').onChange((value) => { this.environmentMap.updateMaterials() })

            const light = this.debug.ui.addFolder('Light')

            const platformLight = light.addFolder('Platform light')
            platformLight.add(this.platformPointLight, 'intensity').min(0).max(800).step(0.001).name('lightIntensity').onChange((value) => { bulbMesh.material.emissiveIntensity = value })
            platformLight.add(this.platformPointLight.position, 'x').min(-20).max(20).step(0.001).name('lightX')
            platformLight.add(this.platformPointLight.position, 'y').min(-20).max(20).step(0.001).name('lightY')
            platformLight.add(this.platformPointLight.position, 'z').min(-20).max(20).step(0.001).name('lightZ')

            const elevatorLight = light.addFolder('Elevator light')
            elevatorLight.add(this.elevatorPointLight, 'intensity').min(0).max(800).step(0.001).name('lightIntensity').onChange((value) => { bulbMesh.material.emissiveIntensity = value })
            elevatorLight.add(this.elevatorPointLight.position, 'x').min(-20).max(20).step(0.001).name('lightX')
            elevatorLight.add(this.elevatorPointLight.position, 'y').min(-20).max(20).step(0.001).name('lightY')
            elevatorLight.add(this.elevatorPointLight.position, 'z').min(-20).max(20).step(0.001).name('lightZ')
        }
    }
}