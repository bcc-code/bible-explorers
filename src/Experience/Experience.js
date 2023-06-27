import * as THREE from 'three'
import confetti from 'canvas-confetti'
import { Debug, StatsModule } from './Utils/Debug.js'
import Sizes from "./Utils/Sizes.js"
import Time from "./Utils/Time.js"
import Resources from './Utils/Resources.js'
import MouseMove from './Utils/MouseMove.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import sources from './Sources.js'
import Menu from './Components/Menu.js'
import World from './World/World.js'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import Page from './Components/Page.js'
import FAQ from './Components/FAQ.js'
import _gl from './Utils/Globals.js'

let instance = null

export default class Experience {
    constructor(canvas) {
        // Singleton
        if (instance)
            return instance

        instance = this

        // Global access
        window.experience = this

        // Options
        this.canvas = canvas
        this.faq = new FAQ()

        // Setup
        this.page = new Page()
        this.settings = new Menu()
        this.debug = new Debug()
        this.stats = new StatsModule()
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources(sources)
        this.pointer = new MouseMove()
        this.camera = new Camera()
        this.world = new World()
        this.raycaster = new THREE.Raycaster()
        this.renderer = new Renderer()
        this.auth0 = {}

        if (WebGL.isWebGLAvailable()) {
            console.log('WebGL is available')
        } else {
            const warning = WebGL.getWebGLErrorMessage()
            console.log('WebGL is not available', warning)
        }

        // Sizes resize event
        this.sizes.on('resize', () => {
            this.resize()
        })

        // Time animation event
        this.videoIsPlaying = false
        this.gameIsOn = false

        this.time.on('animation', () => {
            if (this.videoIsPlaying == false && this.gameIsOn == false)
                this.update()
        })

        this.navigation = {
            prev: document.querySelector('[aria-label="prev page"]'),
            next: document.querySelector('[aria-label="next page"]')
        }

        const celebrateCanvas = _gl.elementFromHtml(`<canvas class="celebrate" width="${this.sizes.width}"  height="${this.sizes.height}"></canvas>`)
        document.body.appendChild(celebrateCanvas)

        this.celebrate = confetti.create(celebrateCanvas, {
            resize: true,
            useWorker: true
        })
    }

    resize() {
        this.camera.resize()
        this.world.resize()
        this.renderer.resize()
    }

    update() {
        this.camera.update()
        this.world.update()
        this.stats.update()
        this.renderer.update()
    }
}