import * as THREE from 'three'
import Experience from "./Experience.js"

export default class Renderer {
    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.debug = this.experience.debug

        this.setInstance()

        if (this.debug.developer) {
            this.addGUIControls()
        }
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        })

        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    update() {
        this.instance.render(this.scene, this.camera.instance)
    }

    addGUIControls() {
        const renderer = this.debug.ui.addFolder('Renderer')
        renderer.close()
        renderer.add(this.instance, 'toneMapping', {
            No: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Cineon: THREE.CineonToneMapping,
            ACESFilmic: THREE.ACESFilmicToneMapping
        })

        renderer.add(this.instance, 'toneMappingExposure', 0, 2).name('Exposure').onChange((value) => { this.instance.toneMappingExposure = Math.pow(value, 5.0) })
    }
}