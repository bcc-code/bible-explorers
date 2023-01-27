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

    }

    setCube() {
        let materialArray = []
        let texture_ft = new THREE.TextureLoader().load(this.resources.items.environmentMap.source.data[0].src)
        let texture_bk = new THREE.TextureLoader().load(this.resources.items.environmentMap.source.data[1].src)
        let texture_up = new THREE.TextureLoader().load(this.resources.items.environmentMap.source.data[2].src)
        let texture_dn = new THREE.TextureLoader().load(this.resources.items.environmentMap.source.data[3].src)
        let texture_rt = new THREE.TextureLoader().load(this.resources.items.environmentMap.source.data[4].src)
        let texture_lt = new THREE.TextureLoader().load(this.resources.items.environmentMap.source.data[5].src)

        materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }))
        materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }))
        materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }))
        materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }))
        materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lt }))
        materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }))

        for (let i = 0; i < 6; i++) {
            materialArray[i].side = THREE.BackSide
        }

        const cubeGeometry = new THREE.BoxGeometry(36, 40, 36)
        const cube = new THREE.Mesh(cubeGeometry, materialArray)

        this.scene.add(cube)
    }

    setEnvironmentMap() {
        this.environmentMap = {}
        this.environmentMap.intensity = 1
        this.environmentMap.texture = this.resources.items.cubeMap
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


}