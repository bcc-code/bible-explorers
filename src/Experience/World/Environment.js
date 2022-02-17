import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Video
        this.video = document.getElementById('video')

        // Setup
        this.setEnvironment()
        this.setScreens()
        this.videoControls()
    }

    setEnvironment() {
        this.environmentMap = {}
        this.environmentMap.texture = this.resources.items.environmentMapTexture
        this.scene.background = this.environmentMap.texture
    }

    videoControls() {

        document.onkeydown = (e) => {
            if (e.key === 'p') {
                this.video.play()
            }
            else if (e.key === ' ') {
                this.video.pause()
            }
            else if (e.key === 's') {
                this.video.pause()
                this.video.currentTime = 0
            }
            else if (e.key === 'r') {
                this.video.currentTime = 0
            }

        }
    }

    setScreens() {
        this.screensMap = {}

        this.screensMap.intensity = 0.4
        this.screensMap.texture = this.resources.items.UVChecker
        this.screensMap.texture.encoding = THREE.sRGBEncoding
        this.screensMap.texture.flipY = false
        this.screensMap.texture.rotation = Math.PI * 0.5
        this.screensMap.texture.wrapS = THREE.RepeatWrapping
        this.screensMap.texture.wrapT = THREE.RepeatWrapping
        this.screensMap.texture.magFilter = THREE.NearestFilter

        this.screensMap.screen16x10 = this.resources.items.screen_16x10
        this.screensMap.screen16x10.encoding = THREE.sRGBEncoding
        this.screensMap.screen16x10.flipY = false
        this.screensMap.screen16x10.rotation = 0
        this.screensMap.screen16x10.wrapS = THREE.RepeatWrapping
        this.screensMap.screen16x10.wrapT = THREE.RepeatWrapping
        this.screensMap.screen16x10.magFilter = THREE.NearestFilter

        this.screensMap.screen_16x9_5 = this.resources.items.screen_16x9_5
        this.screensMap.screen_16x9_5.encoding = THREE.sRGBEncoding
        this.screensMap.screen_16x9_5.flipY = false
        this.screensMap.screen_16x9_5.rotation = Math.PI * 0.5
        this.screensMap.screen_16x9_5.wrapS = THREE.RepeatWrapping
        this.screensMap.screen_16x9_5.wrapT = THREE.RepeatWrapping
        this.screensMap.screen_16x9_5.magFilter = THREE.NearestFilter

        this.screensMap.video = new THREE.VideoTexture(this.video)
        this.screensMap.video.encoding = THREE.sRGBEncoding
        this.screensMap.video.flipY = false
        this.screensMap.video.minFilter = THREE.LinearFilter
        this.screensMap.video.magFilter = THREE.LinearFilter
        this.screensMap.video.rotation = Math.PI * 0.5
        this.screensMap.video.wrapS = THREE.RepeatWrapping
        this.screensMap.video.wrapT = THREE.RepeatWrapping

        this.screensMap.updateMaterials = () => {

            this.scene.traverse((child) => {

                if (child.name === 'tv_4x4_screen') {
                    child.material.map = this.screensMap.texture
                }

                if (child.name === 'tv_4x5_screen') {
                    child.material.map = this.screensMap.texture
                }

                if (child.name === 'tv_16x10_screen') {
                    child.material.map = this.screensMap.screen16x10
                }

                if (child.name === 'tv_16x9_5_screen') {
                    child.material.map = this.screensMap.screen_16x9_5
                }

                if (child.name === 'Portal') {
                    child.material.map = this.screensMap.video
                    child.material.toneMapped = false
                }

                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.needsUpdate = true
                }
            })
        }

        this.screensMap.updateMaterials()
    }
   
}