import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import _lang from '../Utils/Lang.js'
import Offline from '../Utils/Offline.js'

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        this.offline = new Offline()
        this.experience = new Experience()
        this.loadingManager = new THREE.LoadingManager()

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0
        this.mediaItems = []
        this.mediaItemsScreens = []
        this.textureItems = []

        this.loadManager()
        this.setLoaders()
        this.startLoading()
    }

    loadManager() {
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            // console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
        }

        this.loadingManager.onLoad = () => {
            // console.log('Loading complete!')
        }

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
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
        this.loaded++
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

    async loadThemeVideos(episodeId, videoName) {
        let animationId = videoName.replace('episode-', '')
        this.offline.loadFromIndexedDb(
            { name: animationId+'_video', episodeId: episodeId },
            this.streamFromBtv(videoName)
        )
    }

    async streamFromBtv(videoName) {
        // Video stream from BTV
        await this.loadEpisodeFromBtv(videoName)
        const video = this.getGeneratedVideoElement(videoName)
        this.generateTextureForVideo(video, videoName, 'https://brunstad.tv/series/' + videoName)
    }

    async loadEpisodeFromBtv(videoName) {
        const filmId = videoName.replace('episode-', '')
        const locale = _lang.getLanguageCode()

        var btvplayer = BTVPlayer({
            type: 'episode',
            id: filmId,
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

    generateTextureForVideo(video, id, path) {
        const texture = new THREE.VideoTexture(video)
        texture.flipY = false
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.encoding = THREE.sRGBEncoding

        this.mediaItems[id] = {
            item: texture,
            path: path,
            naturalWidth: video.videoWidth || 1,
            naturalHeight: video.videoHeight || 1
        }
    }

    createVideoElement(videoName, path) {
        let video = document.createElement('video')
        video.setAttribute('id', videoName)
        video.crossOrigin = 'anonymous'
        video.muted = false
        video.loop = false
        video.controls = true
        video.autoplay = false
        video.src = path

        return video
    }

    getGeneratedVideoElement(videoName) {
        let video = document.getElementById('videojs-' + videoName + '_html5_api')
        video.autoplay = false // Make sure the video won't start autoplay

        return video
    }

    fetchApiThenCache(theUrl, callback) {
        fetch(theUrl)
            .then(function(response) {
                // console.log('network ok - save also to cache', theUrl)
                var responseClone = response.clone()

                response.json().then(function(apiData) {
                    callback(apiData)
                })

                // Save to cache for offline use
                caches.open('apiResponses').then(function(cache) {
                    cache.put(theUrl, responseClone)
                })
            })
            .catch(function() {
                // console.log('network down - fetch from cache', theUrl)
                caches.open('apiResponses').then(function(cache) {
                    cache.match(theUrl).then(response => {
                        response.json().then(function(cachedData) {
                            callback(cachedData)
                        })
                    })
                })
            })
    }
}