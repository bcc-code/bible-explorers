import Experience from '../Experience.js'
import _lang from '../Utils/Lang.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Video {
    constructor() {
        if (instance) return instance

        instance = this

        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.debug = instance.experience.debug
        instance.resources = instance.experience.resources
        instance.audio = instance.world.audio
        instance.scene = instance.experience.scene
        instance.controlRoom = instance.world.controlRoom
        instance.clickableObjects = instance.controlRoom.clickableObjects

        // Setup
        instance.video = () => {
            let id = instance.playingVideoId
            return instance.resources.videoPlayers[id]
        }

        instance.videoJsEl = () => {
            let id = 'videojs-' + instance.playingVideoId
            return document.getElementById(id)
        }

        instance.hasSkipBtn = () => {
            return instance.videoJsEl().querySelector('.skip-video') != null
        }

        instance.getSkipBtn = () => {
            return instance.videoJsEl().querySelector('.skip-video')
        }

        instance.playingVideoId = null
        instance.videosContainer = document.querySelector('#videos-container')
    }

    load(id) {
        instance.playingVideoId = id

        // First, remove all previous event listeners - if any
        instance.video().off('play', instance.setFullscreenIfNecessary)
        instance.video().off('ended', instance.finish)

        // Always start new loaded videos from the beginning
        instance.video().currentTime(0)

        const videoQuality = instance.getVideoQuality()
        instance.resources.videoPlayers[id].setVideoQuality(videoQuality)

        instance.video().on('play', instance.setFullscreenIfNecessary)
        instance.video().on('ended', instance.finish)

        instance.focus()
    }

    //#region Actions

    play() {
        instance.video().play()
        instance.experience.videoIsPlaying = true
    }

    pause() {
        instance.video().pause()
        instance.experience.videoIsPlaying = false
    }

    focus() {
        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()

        instance.videosContainer.style.display = 'flex'
        instance.videosContainer.querySelector('#' + instance.playingVideoId).style.display = 'flex'
    }

    defocus() {
        if (!instance.video()) return

        instance.pause()

        if (instance.video().isFullscreen_) {
            instance.video().exitFullscreen()
        }

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()

        instance.videosContainer.style.display = 'none'
        instance.videosContainer.querySelector('#' + instance.playingVideoId).style.display = 'none'

        instance.playingVideoId = null
    }

    finish() {
        if (instance.hasSkipBtn()) instance.getSkipBtn().remove()

        instance.defocus()
        instance.world.program.nextStep()
    }

    //#endregion

    getVideoQuality() {
        switch (instance.world.selectedQuality) {
            case 'low':
                return 270

            case 'medium':
                return 540

            case 'high':
            default:
                return 1080
        }
    }

    setFullscreenIfNecessary() {
        if (!this.isFullscreen_ && [...instance.video().el_.classList].filter((c) => c.includes('episode') || c.includes('lobby-video')).length) {
            this.requestFullscreen()
            instance.addSkipBtn()
        }
    }

    addSkipBtn() {
        if (instance.hasSkipBtn()) return

        const skipVideo = document.createElement('div')
        skipVideo.className = 'skip-video button-normal less-focused z-10 absolute right-8 top-8'
        skipVideo.innerText = _s.miniGames.skip
        skipVideo.addEventListener('click', instance.finish)
        instance.videoJsEl().appendChild(skipVideo)
    }
}
