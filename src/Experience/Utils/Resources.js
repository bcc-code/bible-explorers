import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import Offline from '../Utils/Offline.js'
import { PlayerFactory, createPlayer } from 'bccm-video-player'
import 'bccm-video-player/css'
import _c from '../Utils/Connection.js'
import _api from '../Utils/Api.js'
import _lang from '../Utils/Lang.js'
import _s from '../Utils/Strings.js'

let resources = null

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        this.offline = new Offline()
        this.experience = new Experience()
        this.loadingManager = new THREE.LoadingManager()
        this.chapterLoadingManager = new THREE.LoadingManager()
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
        this.customTextureItems = []
        this.posterImages = []
        this.videoPlayers = []
        this.api = []

        this.loadManager()
        this.setLoaders()
        this.startLoading()

        // BTV player factory
        this.factory = new PlayerFactory({
            tokenFactory: null,
            endpoint: 'https://api.brunstad.tv/query',
        })
    }

    loadManager() {
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            if (!document.querySelector('#loading_screen')) return

            this.loadingIcon = new rive.Rive({
                src: 'textures/loading_icon.riv',
                canvas: document.querySelector('#loading_logo'),
                autoplay: true,
                stateMachines: 'State Machine 1',
            })
        }

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            // console.log(
            //   `Started loading file: ${url} .\nloaded ${itemsLoaded} of ${itemsTotal} files`,
            // );

            const progressRatio = Math.trunc((itemsLoaded / itemsTotal) * 100)

            if (this.loadingIcon.loaded) {
                if (this.loadingIcon.stateMachineInputs('State Machine 1')) {
                    const inputs = this.loadingIcon.stateMachineInputs('State Machine 1')
                    const progress = inputs.find((i) => i.name === 'Progress')

                    progress.runtimeInput.value = progressRatio
                }
            }
        }

        this.loadingManager.onLoad = () => {
            const loader = document.querySelector('#loading_text')
            if (!loader) return

            loader.innerText = _s.fetching

            resources.fetchApiThenCache(_api.getBiexChapters(), (json) => {
                this.api[_api.getBiexChapters()] = json

                console.log('Loading complete!')
                this.trigger('ready')

                document.querySelector('#loading_screen')?.remove()
                document.querySelector('#header').style.display = 'flex'

                this.loadingIcon.cleanupInstances()
                this.loadingIcon.reset()
            })
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
        for (const source of this.sources) {
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader)
                this.loaders.gltfLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file)
                })
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file)
                })
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file)
                })
            } else if (source.type === 'videoTexture') {
                this.loadVideoTexture(source.name, source.path, 'default')
            }
        }
    }

    loadVideoTexture(name, url, type) {
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

        if (type == 'default') video.autoplay = true

        const texture = new THREE.VideoTexture(video)
        texture.flipY = false
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.colorSpace = THREE.SRGBColorSpace
        texture.needsUpdate = true

        const textureObject = {
            item: texture,
            path: url,
            naturalWidth: video.videoWidth || 1,
            naturalHeight: video.videoHeight || 1,
        }

        type && type == 'default' ? (this.textureItems[name] = textureObject) : (this.customTextureItems[name] = textureObject)

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
    }

    updateBtvStreamVideoWithDownloadedVersion(videoName) {
        let videoEl = document.getElementById(videoName)
        if (videoEl) {
            videoEl.remove()
            this.loadEpisodeTextures(videoName)
        }
    }

    updateBtvStreamTextureWithDownloadedVersion(videoName) {
        let videoEl = document.getElementById(videoName)
        if (videoEl) {
            videoEl.remove()
            this.loadTextureInBtvPlayer(videoName.replace('texture-', ''))
        }
    }

    loadEpisodeTextures(videoName) {
        resources.addVideoDivElementToContainer(videoName, 'videos-container')
        this.offline.loadEpisodeFromIndexedDb(videoName, this.loadTexturesLocally, this.loadTexturesOnline)
    }

    loadLobbyVideoInBtvPlayer(id) {
        const videoName = 'lobby-video-' + id
        if (document.getElementById(videoName)) return

        resources.addVideoDivElementToContainer(videoName, 'videos-container')
        this.offline.loadVideoFromIndexedDb(videoName, this.loadTexturesLocally, this.loadTexturesOnline)
    }

    loadVideoInBtvPlayer(id) {
        const textureName = 'video-' + id
        if (document.getElementById(textureName)) return

        resources.addVideoDivElementToContainer(textureName, 'videos-container')
        this.offline.loadVideoFromIndexedDb(textureName, this.loadTexturesLocally, this.loadTexturesOnline)
    }

    loadTextureInBtvPlayer(id) {
        const textureName = 'texture-' + id
        if (document.getElementById(textureName)) return

        resources.addVideoDivElementToContainer(textureName, 'videos-container')
        this.offline.loadVideoFromIndexedDb(textureName, this.loadTexturesLocally, this.loadTexturesOnline)
    }

    addVideoDivElementToContainer(videoName, containerId) {
        const videoEl = document.createElement('div')
        videoEl.setAttribute('id', videoName)
        document.getElementById(containerId).appendChild(videoEl)
    }

    async loadTexturesLocally(videoName, videoUrl, thumbnailUrl) {
        await resources.streamLocally(videoName, videoUrl)
        resources.loadVideoThumbnail(videoName, thumbnailUrl)
    }

    async loadTexturesOnline(videoName) {
        await resources.streamFromBtv(videoName)
        resources.loadVideoThumbnail(videoName, resources.posterImages[videoName])
    }

    loadVideoThumbnail(videoName, thumbnailUrl) {
        if (!thumbnailUrl) return
        this.loaders.textureLoader.load(thumbnailUrl, (texture) => {
            this.customTextureItems[videoName] = texture
        })
    }

    async streamLocally(videoName, videoUrl) {
        const player = await createPlayer(videoName, {
            src: {
                type: 'video/mp4',
                src: videoUrl,
            },
            autoplay: false,
            videojs: {
                autoplay: false,
            },
        })

        // Hide controlbar for textures
        if (!videoName.includes('episode')) player.controlBar.hide()

        resources.videoPlayers[videoName] = player
    }

    async streamFromBtv(videoName) {
        const episodeId = videoName.replace('episode-', '').replace('texture-', '').replace('lobby-video-', '')

        const player = await resources.factory.create(videoName, {
            episodeId: episodeId,
            overrides: {
                languagePreferenceDefaults: {
                    audio: _lang.get3LettersLang(),
                    subtitle: _lang.get3LettersLang(),
                },
                autoplay: false,
                videojs: {
                    autoplay: false,
                },
            },
        })

        // Hide controlbar for textures
        if (!videoName.includes('episode')) player.controlBar.hide()

        resources.videoPlayers[videoName] = player
        resources.posterImages[videoName] = player.poster_
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
                    cache.match(theUrl).then((response) => {
                        response.json().then(function (cachedData) {
                            callback(cachedData)
                        })
                    })
                })
            })
    }
}
