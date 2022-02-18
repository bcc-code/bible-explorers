import * as THREE from 'three'
import { Debug, StatsModule } from './Utils/Debug.js'
import Sizes from "./Utils/Sizes.js"
import Time from "./Utils/Time.js"
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'
import Resources from './Utils/Resources.js'
import sources from './Sources.js'
import Archive from './Archive.js'

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
        this.loaded = false

        // Setup
        this.debug = new Debug()
        this.stats = new StatsModule()
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources(sources)
        this.raycaster = new THREE.Raycaster()
        this.pointer = new THREE.Vector2()
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.world = new World()
        this.archive = new Archive()

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
    }

    update() {
        this.camera.update()
        this.world.update()
        this.stats.update()
        this.renderer.update()
    }

    destroy() {
        this.sizes.off('resize')
        this.time.off('animation')

        // Treverse the whole scene
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose()

                for (const key in child.material) {
                    const value = child.material[key]

                    if (value && typeof value.dispose === 'function') {
                        value.dispose()
                    }
                }
            }
        })

        this.camera.controls.dispose()
        this.renderer.instance.dispose()

        if (this.debug.active)
            this.debug.ui.destroy()
    }
}