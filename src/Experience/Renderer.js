import * as THREE from 'three'
import Experience from "./Experience.js"

export default class Renderer {
    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.canvasDebug = this.experience.canvasDebug
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.debug = this.experience.debug


        this.setInstance()

        if (this.debug.active) {
            this.setInstanceDebug()
            this.addGUIControls()
        }
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        })

        this.instance.physicallyCorrectLights = true
        this.instance.outputEncoding = THREE.sRGBEncoding
        this.instance.toneMapping = THREE.ReinhardToneMapping
        this.instance.toneMappingExposure = 2.9080590668511674
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    setInstanceDebug() {
        this.instanceDebug = new THREE.WebGLRenderer({
            canvas: this.canvasDebug,
            antialias: true
        })

        this.instanceDebug.physicallyCorrectLights = true
        this.instanceDebug.outputEncoding = THREE.sRGBEncoding
        this.instanceDebug.toneMapping = THREE.ReinhardToneMapping
        this.instanceDebug.toneMappingExposure = 2.9080590668511674
        this.instanceDebug.shadowMap.enabled = true
        this.instanceDebug.shadowMap.type = THREE.PCFSoftShadowMap
        this.instanceDebug.setSize(480, 320)
        this.instanceDebug.setPixelRatio(this.sizes.pixelRatio)
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)

        if (this.debug.active) {
            this.instanceDebug.setSize(480, 320)
            this.instanceDebug.setPixelRatio(this.sizes.pixelRatio)
        }

    }

    update() {
        this.instance.render(this.scene, this.camera.instance)

        if (this.debug.active)
            this.instanceDebug.render(this.scene, this.camera.instanceDebug)
    }

    addGUIControls() {
        const renderer = this.debug.ui.addFolder('Renderer')
        // renderer.close()
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