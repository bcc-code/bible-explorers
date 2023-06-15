import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import Offline from '../Utils/Offline.js'
import _c from '../Utils/Connection.js'
import _lang from '../Utils/Lang.js'
import _s from '../Utils/Strings.js'

let resources = null

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        this.offline = new Offline()
        this.experience = new Experience()
        this.loadingManager = new THREE.LoadingManager()
        this.page = this.experience.page

        resources = this

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length
        this.itemsLoaded = 0
        this.loadingScreenLoaded = false
        this.mediaItems = []
        this.textureItems = []
        this.posterImages = []
        this.videoPlayers = []

        this.loadManager()
        this.setLoaders()
        this.startLoading()
    }

    loadManager() {
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            // console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')

            if (!document.querySelector('.loader')) return

            this.loadingIcon = new rive.Rive({
                src: 'textures/loading_icon.riv',
                canvas: document.querySelector('#loading_icon'),
                autoplay: true,
                stateMachines: 'State Machine 1',
            })

        }

        this.loadingManager.onLoad = () => {
            // console.log('Loading complete!')
            document.querySelector('.loader')?.remove()
            document.querySelector('.app-header').style.display = "flex"
            // this.loadingIcon.cleanup();
        }

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            // console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')

            const progressRatio = Math.trunc(itemsLoaded / itemsTotal * 100)

            if (this.loadingIcon.loaded) {
                const inputs = this.loadingIcon.stateMachineInputs('State Machine 1')
                const progress = inputs.find(i => i.name === 'Progress')

                progress.runtimeInput.value = progressRatio
            }
        }

        this.loadingManager.onError = function (url) {
            console.log('There was an error loading ' + url)
        }
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
                this.loadVideoTexture(source.name, source.path)
            }
        }
    }

    loadVideoTexture(name, url) {
        const video = document.createElement('video')
        video.addEventListener('canplay', this.onVideoLoad(video, url), false)

        video.setAttribute('id', name)
        video.setAttribute('webkit-playsinline', 'webkit-playsinline')
        video.setAttribute('playsinline', '')
        video.style.background = 'white'
        video.crossOrigin = ''
        video.muted = false
        video.loop = true
        video.controls = false
        video.autoplay = false
        video.preload = 'auto'
        video.src = url
        
        if (name == 'iris')
            video.autoplay = true

        const texture = new THREE.VideoTexture(video)
        texture.flipY = false
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.encoding = THREE.sRGBEncoding
        texture.needsUpdate = true
        
        this.textureItems[name] = {
            item: texture,
            path: url,
            naturalWidth: video.videoWidth || 1,
            naturalHeight: video.videoHeight || 1
        }

        this.loadingManager.itemStart(url)
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

    updateBtvStreamWithDownloadedVersion(videoName) {
        let videoEl = document.getElementById(videoName)
        if (videoEl) {
            videoEl.remove()
            this.loadEpisodeTextures(videoName)
        }
    }

    loadEpisodeTextures(videoName) {
        this.offline.loadFromIndexedDb(
            videoName,
            this.loadTexturesLocally,
            this.loadTexturesOnline
        )
    }

    loadTexturesLocally(videoName, videoUrl, thumbnailUrl) {
        resources.streamLocally(videoName, videoUrl)
        resources.loadVideoThumbnail(videoName, thumbnailUrl)
    }

    async loadTexturesOnline(videoName) {
        await resources.streamFromBtv(videoName)
        resources.loadVideoThumbnail(videoName, resources.posterImages[videoName])
    }

    loadVideoThumbnail(videoName, thumbnailUrl) {
        this.loaders.textureLoader.load(
            thumbnailUrl,
            (texture) => {
                this.textureItems[videoName] = texture
            }
        )
    }

    streamLocally(videoName, videoUrl) {
        let options = {
            src: {
                type: 'video/mp4',
                src: videoUrl
            },
            videojs: {
                autoplay: false
            }
        }

        resources.videoPlayers[videoName] = createVideoJsPlayer(videoName, options)
    }

    async streamFromBtv(videoName) {
        const episodeId = videoName.replace('episode-', '')
        let locale = _lang.getLanguageCode()
        locale = 'pt-pt' == locale ? 'pt' : locale // BTV and WPML have different language codes

        const claims = await resources.experience.auth0.getIdTokenClaims()
        const idToken = claims ? claims.__raw : '';

        var btvPlayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale,
            access_token: idToken
        })

        let btvContainer = document.createElement('div')
        btvContainer.setAttribute('id', videoName)
        document.getElementById('videos-container').appendChild(btvContainer)

        const loadResponse = await btvPlayer.load({
            el: videoName,
            options: {
                videojs: {
                    autoplay: false
                }
            }
        })

        resources.videoPlayers[videoName] = loadResponse.player
        resources.posterImages[videoName] = loadResponse.info.image
    }

    fetchApiThenCache(theUrl, callback) {
        fetch(theUrl)
            .then(function (response) {
                var responseClone = response.clone()

                response.json().then(function (apiData) {
                    resources.offline.setConnection(_c.ONLINE)
                    callback(apiData)
                })

                // Save to cache for offline use
                caches.open('apiResponses').then(function (cache) {
                    cache.put(theUrl, responseClone)
                })
            })
            .catch(function () {
                resources.offline.setConnection(_c.OFFLINE)
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