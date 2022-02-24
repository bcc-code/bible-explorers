import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'


export default class Resources extends EventEmitter {

    constructor(sources) {

        super()

        this.experience = new Experience()

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        this.loadManager()
        this.setLoaders()
        this.startLoading()
    }

    loadManager() {
        this.loadingManager = new THREE.LoadingManager(
            // Loaded
            () => {
                window.setTimeout(() => {
                this.experience.pageLoader.loaded()
                }, 500)

                window.setTimeout(() => {
                    this.experience.loaded = true
                }, 4000)
            },

            // Progress
            (itemUrl, itemsLoaded, itemsTotal) => {
                this.experience.pageLoader.progress(itemsLoaded, itemsTotal)
            }
        )
    }

    setLoaders() {
        this.loaders = {}

        this.loaders.dracoLoader = new DRACOLoader(this.loadingManager)
        this.loaders.dracoLoader.setDecoderPath('draco/')

        this.loaders.gltfLoader = new GLTFLoader(this.loadingManager)
        this.loaders.textureLoader = new THREE.TextureLoader(this.loadingManager)
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()

    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {

            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader)
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file);
                    }
                )
            }
            else if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file);
                    }
                )
            }
            else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file);
                    }
                )
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file
        this.loaded++

        if (this.loaded === this.toLoad) {
            this.trigger('ready')
        }
    }
}