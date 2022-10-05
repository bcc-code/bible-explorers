import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import Experience from "../Experience.js";
import _lang from '../Utils/Lang.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class Video {
    constructor() {
        if (instance)
            return instance

        this.experience = new Experience()
        this.world = this.experience.world
        this.debug = this.experience.debug
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.audio = this.experience.world.audio

        instance = this

        // Setup
        this.portalScreen = this.world.controlRoom.tv_portal
        this.tablet = this.world.controlRoom.tablet

        this.video = () => {
            let id = instance.playingVideoId
            return instance.resources.videoPlayers[id];
        }

        this.videoJsEl = () => {
            let id = 'videojs-' + instance.playingVideoId
            return document.getElementById(id)
        }

        this.playingVideoId = null
    }

    load(id) {
        this.playingVideoId = id

        this.video().currentTime(0)

        // Set texture when starting directly on a video task type
        if (this.portalScreen.material.map != this.resources.textureItems[id])
            this.setTexture(id)

        this.resources.videoPlayers[id].setVideoQuality(this.getVideoQuality())


        // Event listener on video update
        this.video().on('timeupdate', function () {
            if (instance.showSkipBtn()) {
                if (!document.getElementById('skip-video')) {
                    let skipVideo = document.createElement('div')
                    skipVideo.classList.add("button", "button__secondary")
                    skipVideo.setAttribute('id', 'skip-video')
                    skipVideo.innerText = _s.miniGames.continue

                    skipVideo.addEventListener('click', instance.finish)
                    instance.videoJsEl().appendChild(skipVideo)
                }
            }
        })

        // Event listener on fullscreen change
        this.video().on('fullscreenchange', function () {
            if (!this.isFullscreen_) {
                instance.pause()
            }
        })

        // Event listener on video end
        this.video().on('ended', instance.finish)

        this.focus()
    }

    setTexture(id) {
        if (!this.resources.textureItems.hasOwnProperty(id)) return

        this.portalScreen.material.map = this.resources.textureItems[id]
        this.portalScreen.material.map.flipY = false
        this.portalScreen.material.needsUpdate = true
    }

    //#region Actions

    play() {
        instance.video().play()
        instance.video().requestFullscreen()
    }

    pause() {
        instance.video().pause();
    }

    focus() {
        instance.camera.zoomIn(2000)
        instance.tablet.material.map.image.play()

        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()

        new TWEEN.Tween(instance.portalScreen.material)
            .to({ color: new THREE.Color(0xFFFFFF) }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }

    defocus() {
        if (instance.video()) {
            instance.pause()
            instance.tablet.material.map.image.pause()

            if (this.video().isFullscreen_) {
                instance.video().exitFullscreen()
                // document.getElementById('videos-container').style.zIndex = '-1'
            }

            new TWEEN.Tween(instance.portalScreen.material)
                .to({ color: new THREE.Color(0x131A43) }, 1000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start()
                .onComplete(() => {
                    instance.audio.setOtherAudioIsPlaying(false)
                    instance.audio.fadeInBgMusic()
                })
        }
    }

    finish() {
        instance.defocus()
        instance.world.program.advance()
    }

    //#endregion

    getVideoQuality() {
        switch (this.world.selectedQuality) {
            case 'low':
                return 270

            case 'medium':
                return 540

            case 'high':
            default:
                return 1080
        }
    }

    showSkipBtn() {
        if (instance.debug.developer || instance.debug.onQuickLook())
            return true

        const secondsToSkip = 10
        const currentTime = instance.video().currentTime()
        const duration = instance.video().duration()

        return duration - currentTime < secondsToSkip
    }
}