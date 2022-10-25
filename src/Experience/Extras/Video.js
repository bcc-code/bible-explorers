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

        this.hasSkipBtn = () => {
            return instance.videoJsEl().querySelector('.skip-video') != null
        }
        this.getSkipBtn = () => {
            return instance.videoJsEl().querySelector('.skip-video')
        }

        this.playingVideoId = null
    }

    load(id) {
        this.playingVideoId = id

        // Remove all event listeners - if any
        this.video().off('ended', instance.waitAndFinish)

        // Always start new loaded videos from the beginning
        this.video().currentTime(0)

        // Set texture when starting directly on a video task type
        if (this.portalScreen.material.map != this.resources.textureItems[id])
            this.setTexture(id)

        this.resources.videoPlayers[id].setVideoQuality(this.getVideoQuality())

        // Add event listener on video update
        this.video().on('timeupdate', function () {
            if (instance.showSkipBtn()) {
                if (instance.hasSkipBtn()) return

                const skipVideo = document.createElement('div')
                skipVideo.className = 'skip-video button bg--secondary height px border--5 border--solid border--transparent rounded--forward pulsate'
                skipVideo.innerText = _s.miniGames.skip

                skipVideo.addEventListener('click', instance.finish)
                instance.videoJsEl().appendChild(skipVideo)
            }
            else {
                if (!instance.hasSkipBtn()) return
                instance.getSkipBtn().remove()
            }
        })

        // Add event listener on fullscreen change
        this.video().on('fullscreenchange', function () {
            if (!this.isFullscreen_) {
                instance.pause()
            }
        })

        // Add event listener on video end
        this.video().on('ended', instance.waitAndFinish)

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
        instance.video().pause()
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

    waitAndFinish() {
        if (instance.hasSkipBtn())
            instance.getSkipBtn().remove()

        setTimeout(() => { instance.finish() }, 1000)
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