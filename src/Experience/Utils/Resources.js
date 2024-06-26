import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import Offline from './Offline.js'
import { PlayerFactory, createPlayer } from 'bccm-video-player'
import 'bccm-video-player/css'
import _c from './Connection.js'
import _api from './Api.js'
import _lang from './Lang.js'
import _s from './Strings.js'
import _e from '../Utils/Events.js'

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

            // loader.innerText = _s.status.fetching

            const personId = this.experience.auth0.userData
                ? this.experience.auth0.userData['https://login.bcc.no/claims/personId']
                : ''

            resources.fetchApiThenCache(_api.getBiexChapters(personId), (json) => {
                this.api[_api.getBiexChapters(personId)] = json

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

        type && type == 'default'
            ? (this.textureItems[name] = textureObject)
            : (this.customTextureItems[name] = textureObject)

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

    loadEpisodeTexture(videoName) {
        resources.addVideoDivElementToContainer(videoName)
        this.offline.loadVideoFromIndexedDb(videoName, resources.streamLocally, resources.streamFromBtv)
    }

    addVideoDivElementToContainer(videoName) {
        const videoEl = document.createElement('div')
        videoEl.setAttribute('id', videoName)

        const containerWrapper = document.getElementById('video-container')
        containerWrapper.appendChild(videoEl)
    }

    async streamLocally(videoName, videoUrl) {
        const loopVideo = videoName.includes('texture')
        const player = await createPlayer(videoName, {
            src: {
                type: 'video/mp4',
                src: videoUrl,
            },
            autoplay: false,
            videojs: {
                autoplay: false,
                loop: loopVideo,
            },
        })

        // Hide controlbar for textures
        if (!videoName.includes('episode')) {
            player.controlBar.hide()
        }

        player.addClass('offline-video')
        resources.videoPlayers[videoName] = player

        document.dispatchEvent(_e.EVENTS.VIDEO_LOADED)
    }

    async streamFromBtv(videoName) {
        const loopVideo = videoName.includes('texture')
        const episodeId = videoName.replace('episode-', '').replace('texture-', '')
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
                    loop: loopVideo,
                    hls: {
                        limitRenditionByPlayerDimensions: false,
                        useDevicePixelRatio: true,
                    },
                },
            },
        })

        // Hide controlbar for textures
        if (!videoName.includes('episode')) {
            player.controlBar.hide()
        }

        player.on('ready', () => {
            resources.videoPlayers[videoName] = player
            document.dispatchEvent(_e.EVENTS.VIDEO_LOADED)
        })
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
                    cache
                        .match(theUrl)
                        .then((response) => {
                            response.json().then(function (cachedData) {
                                callback(cachedData)
                            })
                        })
                        .catch(function () {
                            const loader = document.querySelector('#loading_text')
                            if (!loader) return

                            loader.innerText = _s.status.noCacheNoInternet
                        })
                })
            })
    }
}
