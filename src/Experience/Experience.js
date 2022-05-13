import * as THREE from 'three'
import { Debug, StatsModule } from './Utils/Debug.js'
import Sizes from "./Utils/Sizes.js"
import Time from "./Utils/Time.js"
import Resources from './Utils/Resources.js'
import MouseMove from './Utils/MouseMove.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import sources from './Sources.js'
import Settings from './Extras/Settings.js'
import World from './World/World.js'

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

        // Setup
        this.debug = new Debug()
        this.stats = new StatsModule()
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources(sources)
        this.pointer = new MouseMove()
        this.camera = new Camera()
        this.settings = new Settings()
        this.world = new World()
        this.raycaster = new THREE.Raycaster()
        this.renderer = new Renderer()
        this.auth0 = {}

        // Sizes resize event
        this.sizes.on('resize', () => {
            this.resize()
        })

        // Time animation event
        this.time.on('animation', () => {
            this.update()
        })
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()

        if (this.world.program)
            this.world.program.video.resize()
    }

    update() {
        this.camera.update()
        this.world.update()
        this.stats.update()
        this.renderer.update()
    }
}