import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import _lang from '../Utils/Lang.js'

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        this.experience = new Experience()

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length - this.sources.filter((source) => { return ['video', 'videoTexture'].includes(source.type) }).length
        this.loaded = 0 
        this.mediaItems = []
        this.mediaItemsScreens = []
        this.textureItems = []

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
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    }
                )
            }

            else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    }
                )
            }

            else if (source.type === 'videoTexture') {
                const video = document.createElement('video')
                video.setAttribute('id', source.name)
                video.crossOrigin = 'anonymous'
                video.muted = false
                video.loop = true
                video.controls = false
                video.autoplay = true
                video.src = source.path

                const texture = new THREE.VideoTexture(video)
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.encoding = THREE.RGBADepthPacking

                this.textureItems[source.name] = {
                    item: texture,
                    path: source.path,
                    naturalWidth: video.videoWidth || 1,
                    naturalHeight: video.videoHeight || 1
                }
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

    loadVideosThumbnail(fileName, thumbnail) {
        this.loaders.textureLoader.load(
            thumbnail,
            (texture) => {
                this.textureItems[fileName] = texture
            }
        )
    }

    loadThemeVideos(videoName) {
        const path = 'videos/' + videoName + '.mp4'
        let video = null

        if (this.checkFileExist(path) == true) {
            video = document.createElement('video')
            video.setAttribute('id', videoName)
            video.crossOrigin = 'anonymous'
            video.muted = false
            video.loop = false
            video.controls = true
            video.autoplay = false
            video.src = path

            video.oncanplay = () => {
                const texture = new THREE.VideoTexture(video)
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.encoding = THREE.RGBADepthPacking
                texture.flipY = false
                
                this.mediaItems[videoName] = {
                    item: texture,
                    path: path,
                    naturalWidth: video.videoWidth || 1,
                    naturalHeight: video.videoHeight || 1
                }
            }
        } else {
            const btvEpisodeId = videoName.replace('episode-','')
            video = document.createElement('iframe')
            video.setAttribute('id', videoName)
            video.src = `https://brunstad.tv/embed/series/${ btvEpisodeId }?autoplay=false&locale=${ _lang.getLanguageCode() }`
            video.width = 1920
            video.height = 1080
        }

        document.getElementById('videos-container').appendChild(video);
    }

    checkFileExist(urlToFile) {
        var xhr = new XMLHttpRequest()
        xhr.open('HEAD', urlToFile, false)
        xhr.send()
        
        return xhr.status != "404"
    }
}