import * as THREE from 'three'
import Experience from '../Experience.js'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        // Setup
        this.setPlatformLight()
        this.setElevatorLight()
        this.setVideoLight()
        this.setEnvironmentMap()

        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    setPlatformLight() {
        this.platformPointLight = new THREE.PointLight(0xFFCE96, 100, 5);
        this.platformPointLight.position.set(0, 3.75, 0);
        this.platformPointLight.name = 'Platform_light'
        this.scene.add(this.platformPointLight);
    }
    setElevatorLight() {
        this.elevatorPointLight = new THREE.PointLight(0xFFCB80, 100, 5);
        this.elevatorPointLight.position.set(-11.3, 3.6, 0);
        this.elevatorPointLight.name = 'Elevator_light'
        this.scene.add(this.elevatorPointLight);
    }

    setVideoLight() {
        RectAreaLightUniformsLib.init();

        this.videoLight = new THREE.RectAreaLight(0xffffff, 20, 16.4, 9.2)
        this.videoLight.position.set(17.1, 3, 0)
        this.videoLight.rotation.y = THREE.MathUtils.degToRad(90)
        this.videoLight.name = 'Video Light'
        this.videoLight.lookAt(0, 0, 0)
        this.scene.add(new RectAreaLightHelper(this.videoLight))

        console.log(this.videoLight);
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
            const platformBulb = new THREE.Mesh(bulbGeometry, bulbMaterial)
            const elevatorBulb = new THREE.Mesh(bulbGeometry, bulbMaterial)

            this.platformPointLight.add(platformBulb)
            this.elevatorPointLight.add(elevatorBulb)

            const environment = this.debug.ui.addFolder('Envitornment')
            environment.close()
            environment.add(this.environmentMap, 'intensity').min(0).max(20).step(0.001).name('intensity').onChange((value) => { this.environmentMap.updateMaterials() })

            const light = this.debug.ui.addFolder('Light')
            light.close()

            const platformLight = light.addFolder('Platform light')
            platformLight.close()

            platformLight.add(this.platformPointLight, 'intensity').min(0).max(800).step(0.001).name('lightIntensity').onChange((value) => { bulbMesh.material.emissiveIntensity = value })
            platformLight.add(this.platformPointLight.position, 'x').min(-20).max(20).step(0.001).name('lightX')
            platformLight.add(this.platformPointLight.position, 'y').min(-20).max(20).step(0.001).name('lightY')
            platformLight.add(this.platformPointLight.position, 'z').min(-20).max(20).step(0.001).name('lightZ')

            const elevatorLight = light.addFolder('Elevator light')
            elevatorLight.close()
            elevatorLight.add(this.elevatorPointLight, 'intensity').min(0).max(800).step(0.001).name('lightIntensity').onChange((value) => { bulbMesh.material.emissiveIntensity = value })
            elevatorLight.add(this.elevatorPointLight.position, 'x').min(-20).max(20).step(0.001).name('lightX')
            elevatorLight.add(this.elevatorPointLight.position, 'y').min(-20).max(20).step(0.001).name('lightY')
            elevatorLight.add(this.elevatorPointLight.position, 'z').min(-20).max(20).step(0.001).name('lightZ')
        }
    }
}