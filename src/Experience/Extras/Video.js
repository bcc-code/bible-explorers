import Experience from '../Experience.js'
import _lang from '../Utils/Lang.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Video {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.offline = instance.world.offline
        instance.debug = instance.experience.debug
        instance.resources = instance.experience.resources
        instance.audio = instance.world.audio
        instance.scene = instance.experience.scene
        instance.controlRoom = instance.world.controlRoom
        instance.clickableObjects = instance.controlRoom.clickableObjects

        // Load all videos
        const chapterId = instance.world.selectedChapter.id
        instance.world.offline.allDownloadableVideos[chapterId].forEach((video) => {
            const id = `${video.type}-${video.id}`
            instance.resources.loadEpisodeTexture(id, 'video-container')
        })

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

        instance.isVideoEpisode = () => {
            return instance.playingVideoId?.includes('episode-')
        }

        instance.playingVideoId = null
        instance.videoContainer = document.querySelector('#video-container')
    }

    load(id) {
        // Set new playing video id
        instance.playingVideoId = id

        // Move current video first in the list in order to be visible
        instance.videoContainer.prepend(instance.videoJsEl().parentElement)

        // First, remove all previous event listeners - if any
        instance.video().off('play', instance.setFullscreenIfNecessary)
        instance.video().off('playing', instance.setDesiredVideoQuality)
        instance.video().off('ended', instance.finish)

        // Always start new loaded videos from the beginning
        instance.video().currentTime(0)

        // Add video event listeners
        instance.video().on('play', instance.setFullscreenIfNecessary)
        instance.video().on('playing', instance.setDesiredVideoQuality)
        instance.video().on('ended', instance.finish)

        // If the video is an episode, focus on the video (fade out bg music)
        if ([...instance.video().el_.classList].filter((c) => c.includes('episode')).length) {
            instance.focus()
        }

        // Play if necessary
        if (id.includes('texture-') || instance.episodeIsDirectlyPlayable(id)) {
            instance.play()
        }
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
    }

    defocus() {
        if (!instance.video()) return

        instance.pause()

        if (instance.video().isFullscreen_) {
            instance.video().exitFullscreen()
        }

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()

        instance.playingVideoId = null
    }

    finish() {
        if (instance.hasSkipBtn()) {
            instance.getSkipBtn().remove()
        }

        instance.defocus()
        instance.world.program.nextStep()
    }

    //#endregion

    episodeIsDirectlyPlayable(id) {
        return id.includes('episode-') && instance.world.program.getCurrentStepData().details.play_video_directly
    }

    setFullscreenIfNecessary() {
        if (!this.isFullscreen_ && instance.isVideoEpisode()) {
            instance.video().requestFullscreen()
            instance.addSkipBtn()
        }
    }

    setDesiredVideoQuality() {
        if (!instance.videoJsEl()) return

        const videoQuality = instance.getVideoQuality()

        // Set video quality only for online videos
        if (!instance.isOfflineVideo()) {
            instance.video().setVideoQuality(videoQuality)
        }
    }

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

    addSkipBtn() {
        if (instance.hasSkipBtn()) return

        const skipVideo = document.createElement('div')
        skipVideo.className = 'skip-video button-arrow-skip'
        skipVideo.innerHTML = `<span>${_s.miniGames.skip}</span>`
        skipVideo.addEventListener('click', instance.finish)
        instance.videoJsEl().appendChild(skipVideo)
    }
}
