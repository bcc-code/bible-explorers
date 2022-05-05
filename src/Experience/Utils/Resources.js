import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import _lang from '../Utils/Lang.js'
import Offline from '../Utils/Offline.js'

let resources = null

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        this.offline = new Offline()
        this.experience = new Experience()
        this.loadingManager = new THREE.LoadingManager()

        resources = this

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length
        this.itemsLoaded = 0
        this.loadingScreenLoaded = false
        this.mediaItems = []
        this.mediaItemsScreens = []
        this.textureItems = []

        this.loadManager()
        this.setLoaders()
        this.startLoading()
    }

    loadManager() {

        const loaderFlame = document.querySelector('.loader__flame .flame');

        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {

            // console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
        }

        this.loadingManager.onLoad = () => {
            // console.log('Loading complete!')

            this.experience.world.welcome.loadingScreen.style.display = "none"

            if (this.loadingScreenLoaded === false) {
                this.experience.world.welcome.topBar.style.display = "flex"
                this.experience.world.welcome.landingScreen.classList.add('visible')
            }

            this.loadingScreenLoaded = true
        }

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progressRatio = itemsLoaded / itemsTotal

            loaderFlame.style.transform = "scaleY(" + progressRatio + ")"

            // console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        }

        this.loadingManager.onError = function (url) {
            // console.log('There was an error loading ' + url);
        };

    }

    setLoaders() {
        this.loaders = {}

        this.loaders.dracoLoader = new DRACOLoader(this.loadingManager)
        this.loaders.dracoLoader.setDecoderPath('draco/')

        this.loaders.gltfLoader = new GLTFLoader(this.loadingManager)
        this.loaders.textureLoader = new THREE.TextureLoader(this.loadingManager)
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader(this.loadingManager)
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
                video.addEventListener('canplay', this.onVideoLoad(video, source.path), false)

                video.setAttribute('id', source.name)
                video.setAttribute('webkit-playsinline', 'webkit-playsinline')
                video.setAttribute('playsinline', '')
                video.crossOrigin = 'anonymous'
                video.muted = false
                video.loop = true
                video.controls = false
                video.autoplay = true
                video.preload = 'auto'
                video.src = source.path

                const texture = new THREE.VideoTexture(video)
                texture.flipY = false
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.encoding = THREE.sRGBEncoding

                this.textureItems[source.name] = {
                    item: texture,
                    path: source.path,
                    naturalWidth: video.videoWidth || 1,
                    naturalHeight: video.videoHeight || 1
                }

                this.loadingManager.itemStart(source.path)
            }
        }
    }

    onVideoLoad(video, url) {
        video.removeEventListener('canplay', this.onVideoLoad, false)
        this.loadingManager.itemEnd(url)
        this.itemsLoaded++
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file
        this.itemsLoaded++

        if (this.itemsLoaded === this.toLoad) {
            this.trigger('ready')
        }
    }

    loadEpisodeTextures(videoName, thumbnail) {
        this.offline.loadFromIndexedDb(
            { 
                name: videoName,
                thumbnail: thumbnail
            },
            this.loadTexturesLocally,
            this.loadTexturesOnline
        )
    }

    loadTexturesLocally(videoEl, videoName, videoUrl, thumbnailUrl) {
        resources.loadVideoThumbnail(videoName, thumbnailUrl)
        resources.generateTextureForVideo(videoEl, videoName, videoUrl)
    }

    loadTexturesOnline(videoName, thumbnailUrl) {
        resources.loadVideoThumbnail(videoName, thumbnailUrl)
        resources.streamFromBtv(videoName)
    }

    loadVideoThumbnail(videoName, thumbnailUrl) {
        this.loaders.textureLoader.load(
            thumbnailUrl,
            (texture) => {
                this.textureItems[videoName] = texture
            }
        )
    }

    async streamFromBtv(videoName) {
        await resources.loadEpisodeFromBtv(videoName)
        const video = resources.getGeneratedVideoElement(videoName)
        resources.generateTextureForVideo(video, videoName, 'https://brunstad.tv/series/' + videoName)
    }

    async loadEpisodeFromBtv(videoName) {
        const episodeId = videoName.replace('episode-', '')
        const locale = _lang.getLanguageCode()

        var btvplayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale
        })

        let btvContainer = document.createElement('div')
        btvContainer.setAttribute('id', videoName)

        document.getElementById('videos-container').appendChild(btvContainer)

        await btvplayer.load({
            el: videoName,
            options: {
                videojs: {
                    autoplay: false
                }
            },
        })
    }

    getGeneratedVideoElement(videoName) {
        let videoEl = document.getElementById('videojs-' + videoName + '_html5_api')
        videoEl.autoplay = false // Make sure the video won't start autoplay

        return videoEl
    }

    generateTextureForVideo(videoEl, id, path) {
        const texture = new THREE.VideoTexture(videoEl)
        texture.flipY = false
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.encoding = THREE.sRGBEncoding

        resources.mediaItems[id] = {
            item: texture,
            path: path,
            naturalWidth: videoEl.videoWidth || 1,
            naturalHeight: videoEl.videoHeight || 1
        }
    }

    fetchApiThenCache(theUrl, callback) {
        fetch(theUrl)
            .then(function (response) {
                // console.log('Fetched - save also to cache', theUrl)
                var responseClone = response.clone()

                response.json().then(function (apiData) {
                    callback(apiData)
                })

                // Save to cache for offline use
                caches.open('apiResponses').then(function (cache) {
                    cache.put(theUrl, responseClone)
                })
            })
            .catch(function () {
                // console.log('Request failed - try to get it from the cache', theUrl)
                caches.open('apiResponses').then(function (cache) {
                    cache.match(theUrl).then(response => {
                        response.json().then(function (cachedData) {
                            callback(cachedData)
                        })
                    })
                })
            })
    }
}