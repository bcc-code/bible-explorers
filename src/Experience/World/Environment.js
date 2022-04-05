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

        // ref for lumens: http://www.power-sure.com/lumens.htm
        this.bulbLuminousPowers = {
            "110000 lm (1000W)": 110000,
            "3500 lm (300W)": 3500,
            "1700 lm (100W)": 1700,
            "800 lm (60W)": 800,
            "400 lm (40W)": 400,
            "180 lm (25W)": 180,
            "20 lm (4W)": 20,
            "Off": 0
        }

        this.data = {
            bulbPower: Object.keys(this.bulbLuminousPowers)[3],
        }

        // Setup
        this.setEnvironmentMap()
        this.setSceneLights()

        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    setSceneLights() {
        this.bulbLight = new THREE.PointLight(0xffffee, 1, 100, 2);
        this.bulbLight.position.set(0, 3.5, 0);
        this.bulbLight.power = this.bulbLuminousPowers[this.data.bulbPower]
        this.scene.add(this.bulbLight)
    }

    setSpotlight() {
        this.spotLight = new THREE.SpotLight(0xffaf8c);

        this.spotLight.castShadow = true

        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;

        const targetObject = new THREE.Object3D()
        this.scene.add(targetObject)

        this.spotLight.target = targetObject

        this.spotLight.power = 1800
        this.spotLight.distance = 10
        this.spotLight.angle = Math.PI / 4
        this.spotLight.decay = 2
        this.spotLight.penumbra = 1
        this.spotLight.position.set(0, 3.5, 0);

        this.scene.add(this.spotLight);
    }

    setAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0xffffee, 1);
        this.scene.add(this.ambientLight);
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

            light.add(this.data, 'bulbPower', Object.keys(this.bulbLuminousPowers))
                .onChange((val) => {
                    this.bulbLight.power = this.bulbLuminousPowers[val]
                    bulbMaterial.emissiveIntensity = this.bulbLight.intensity / Math.pow(0.02, 2.0)
                })


            if (!this.ambientLight) return

            const ambientLight = light.addFolder('Ambient light')
            // ambientLight.close()
            ambientLight.addColor(this.data, 'colorAmbient').onChange(() => {
                this.ambientLight.color.setHex(Number(this.data.colorAmbient.toString().replace('#', '0x')))
            })
            ambientLight.add(this.ambientLight, 'intensity').min(0).max(100).step(0.01).name('intensity')


            if (!this.spotLight) return

            this.spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
            this.scene.add(this.spotLightHelper);

            const spotLight = light.addFolder('Spotlight Platform')
            spotLight.addColor(this.data, 'colorSpot').onChange(() => {
                this.spotLight.color.setHex(Number(this.data.colorSpot.toString().replace('#', '0x')))
            })

            spotLight.add(this.spotLight.position, 'x', -20, 20).step(0.01).onChange((val) => { this.spotLight.position.x = val })
            spotLight.add(this.spotLight.position, 'y', -10, 10).step(0.01).onChange((val) => { this.spotLight.position.y = val })
            spotLight.add(this.spotLight.position, 'z', -20, 20).step(0.01).onChange((val) => { this.spotLight.position.z = val })

            spotLight.add(this.spotLight, 'intensity', 0, 2).onChange((val) => { this.spotLight.intensity = val, this.spotLightHelper.update() })
            spotLight.add(this.spotLight, 'penumbra', 0, 1).onChange((val) => { this.spotLight.penumbra = val, this.spotLightHelper.update() })
            spotLight.add(this.spotLight, 'distance', 0, 20).step(0.1).onChange((val) => { this.spotLight.distance = val, this.spotLightHelper.update() })
            spotLight.add(this.spotLight, 'angle', 0, Math.PI / 2).onChange((val) => { this.spotLight.angle = val, this.spotLightHelper.update() })
            spotLight.add(this.spotLight, 'decay', 1, 2).onChange((val) => { this.spotLight.decay = val, this.spotLightHelper.update() })

        }
    }

}