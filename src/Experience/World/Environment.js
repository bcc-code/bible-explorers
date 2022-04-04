import * as THREE from 'three'
import Experience from '../Experience.js'
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.debug = this.experience.debug

        // Setup
        this.setSpotlight()
        this.setEnvironmentMap()

        if (this.debug.active) {
            this.setAmbientLight()
            this.setPlatformLight()
            this.setElevatorLight()

            // Options
            this.data = {
                colorPlatform: this.platformPointLight.color.getHex(),
                colorElevator: this.elevatorPointLight.color.getHex(),
                colorAmbient: this.ambientLight.color.getHex(),
                mapsEnabled: true,
            }

            this.addGUIControls()
        }
    }

    setPlatformLight() {
        this.platformPointLight = new THREE.PointLight(0xffaf8c, 50, 10);
        this.platformPointLight.position.set(0, 3.75, 0);
        this.platformPointLight.name = 'Platform_light'
        this.platformPointLight.castShadow = true
        this.platformPointLight.shadow.camera.far = 5
        this.platformPointLight.shadow.camera.fov = 60
        this.scene.add(this.platformPointLight);
    }
    setElevatorLight() {
        this.elevatorPointLight = new THREE.PointLight(0xffaf8c, 50, 10);
        this.elevatorPointLight.position.set(-11.3, 3.6, 0);
        this.elevatorPointLight.name = 'Elevator_light'
        this.elevatorPointLight.castShadow = true
        this.elevatorPointLight.shadow.camera.far = 5
        this.elevatorPointLight.shadow.camera.fov = 60

        this.scene.add(this.elevatorPointLight);
    }

    setAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0xfcafff, 1);
        this.scene.add(this.ambientLight);
    }

    setVideoLight() {
        RectAreaLightUniformsLib.init();

        this.videoLight = new THREE.RectAreaLight(0xffffff, 20, 16.4, 9.2)
        this.videoLight.position.set(17.1, 3, 0)
        this.videoLight.rotation.y = THREE.MathUtils.degToRad(90)
        this.videoLight.name = 'Video Light'
        this.videoLight.lookAt(0, 0, 0)
        this.scene.add(new RectAreaLightHelper(this.videoLight))
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

    setSpotlight() {
        const spotLight = new THREE.SpotLight(0xffaf8c);
        spotLight.power = 800
        spotLight.angle = Math.PI
        spotLight.decay = 2
        spotLight.penumbra = 1
        spotLight.position.set(0, 3.5, 0);
        this.scene.add(spotLight);

        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        this.scene.add(spotLightHelper);
    }

    addGUIControls() {
        if (this.debug.active) {

            const bulbGeometry = new THREE.SphereGeometry(0.2, 16, 8)
            const bulbMaterial = new THREE.MeshStandardMaterial({
                emissive: 0xffaf8c,
                emissiveIntensity: this.platformPointLight.intensity,
                color: 0x000000
            })
            const platformBulb = new THREE.Mesh(bulbGeometry, bulbMaterial)
            const elevatorBulb = new THREE.Mesh(bulbGeometry, bulbMaterial)

            // this.platformPointLight.add(platformBulb)
            // this.elevatorPointLight.add(elevatorBulb)

            const environment = this.debug.ui.addFolder('Environment')
            environment.close()
            environment.add(this.environmentMap, 'intensity').min(0).max(20).step(0.01).name('intensity').onChange(() => { this.environmentMap.updateMaterials() })

            const light = this.debug.ui.addFolder('Light')
            light.close()

            const ambientLight = light.addFolder('Ambient light')
            ambientLight.close()
            ambientLight.addColor(this.data, 'colorAmbient').onChange(() => {
                this.ambientLight.color.setHex(Number(this.data.colorAmbient.toString().replace('#', '0x')))
            })
            ambientLight.add(this.ambientLight, 'intensity').min(0).max(100).step(0.01).name('intensity')


            const platformLight = light.addFolder('Platform light')
            platformLight.close()

            platformLight.addColor(this.data, 'colorPlatform').onChange(() => {
                this.platformPointLight.color.setHex(Number(this.data.colorPlatform.toString().replace('#', '0x')))
            })
            platformLight.add(this.platformPointLight, 'distance').min(0).max(20).step(0.01).name('distance')
            platformLight.add(this.platformPointLight, 'decay').min(0).max(4).step(0.1).name('decay')
            platformLight.add(this.platformPointLight, 'intensity').min(0).max(100).step(0.01).name('intensity')
            platformLight.add(this.platformPointLight.position, 'x').min(-20).max(20).step(0.01).name('lightX')
            platformLight.add(this.platformPointLight.position, 'y').min(-20).max(20).step(0.01).name('lightY')
            platformLight.add(this.platformPointLight.position, 'z').min(-20).max(20).step(0.01).name('lightZ')

            this.platformLightHelper = new THREE.CameraHelper(this.platformPointLight.shadow.camera)
            this.platformLightHelper.visible = false
            this.scene.add(this.platformLightHelper)

            platformLight.add(this.platformLightHelper, 'visible').name('light helper')

            const elevatorLight = light.addFolder('Elevator light')
            elevatorLight.close()

            elevatorLight.addColor(this.data, 'colorElevator').onChange(() => {
                this.elevatorPointLight.color.setHex(Number(this.data.colorElevator.toString().replace('#', '0x')))
            })
            elevatorLight.add(this.elevatorPointLight, 'distance').min(0).max(20).step(0.01).name('distance')
            elevatorLight.add(this.elevatorPointLight, 'decay').min(0).max(4).step(0.1).name('decay')
            elevatorLight.add(this.elevatorPointLight, 'intensity').min(0).max(100).step(0.01).name('intensity')
            elevatorLight.add(this.elevatorPointLight.position, 'x').min(-20).max(20).step(0.01).name('lightX')
            elevatorLight.add(this.elevatorPointLight.position, 'y').min(-20).max(20).step(0.01).name('lightY')
            elevatorLight.add(this.elevatorPointLight.position, 'z').min(-20).max(20).step(0.01).name('lightZ')

            this.elevatorLightHelper = new THREE.CameraHelper(this.elevatorPointLight.shadow.camera)
            this.elevatorLightHelper.visible = false
            this.scene.add(this.elevatorLightHelper)

            elevatorLight.add(this.elevatorLightHelper, 'visible').name('light helper')

        }
    }
}