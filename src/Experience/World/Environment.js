import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Setup
        this.setScreens()
    }

    setScreens() {
        this.images = {}

        this.images.intensity = 0.4
        this.images.texture = this.resources.items.UVChecker
        this.images.texture.encoding = THREE.sRGBEncoding
        this.images.texture.flipY = false
        this.images.texture.rotation = Math.PI * 0.5
        this.images.texture.wrapS = THREE.RepeatWrapping
        this.images.texture.wrapT = THREE.RepeatWrapping

        this.images.screen16x10 = this.resources.items.screen_16x10
        this.images.screen16x10.encoding = THREE.sRGBEncoding
        this.images.screen16x10.flipY = false
        this.images.screen16x10.rotation = 0
        this.images.screen16x10.wrapS = THREE.RepeatWrapping
        this.images.screen16x10.wrapT = THREE.RepeatWrapping

        this.images.screen_16x9_5 = this.resources.items.screen_16x9_5
        this.images.screen_16x9_5.encoding = THREE.sRGBEncoding
        this.images.screen_16x9_5.flipY = false
        this.images.screen_16x9_5.rotation = Math.PI * 0.5
        this.images.screen_16x9_5.wrapS = THREE.RepeatWrapping
        this.images.screen_16x9_5.wrapT = THREE.RepeatWrapping


        this.images.updateMaterials = () => {
            this.scene.traverse((child) => {
                if (child.name === 'tv_4x4_screen') {
                    child.material.map = this.images.texture
                }

                if (child.name === 'tv_4x5_screen') {
                    child.material.map = this.images.texture
                }

                if (child.name === 'tv_16x10_screen') {
                    child.material.map = this.images.screen16x10
                }

                if (child.name === 'tv_16x9_5_screen') {
                    child.material.map = this.images.screen_16x9_5
                }

                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.needsUpdate = true
                }
            })
        }

        this.images.updateMaterials()
    }
}