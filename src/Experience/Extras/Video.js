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
        instance.resources = instance.experience.resources
        instance.audio = instance.world.audio

        // Load all videos
        const chapterId = instance.world.selectedChapter.id
        instance.world.offline.allDownloadableVideos[chapterId].forEach((video) => {
            const id = `${video.type}-${video.id}`
            instance.resources.loadEpisodeTexture(id)
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

        instance.videoContainer.classList.remove('hidden')

        // Move current video first in the list in order to be visible
        instance.videoContainer.prepend(instance.videoContainer.querySelector('#' + id))

        // First, remove all previous event listeners - if any
        instance.video().off('play', instance.setFullscreenIfNecessary)
        instance.video().off('ended', instance.finish)

        // Always start new loaded videos from the beginning
        instance.video().currentTime(0)

        // Add video event listeners
        instance.video().on('play', instance.setFullscreenIfNecessary)
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

    setNoVideoPlaying() {
        instance.playingVideoId = null
        instance.videoContainer.classList.remove('hidden')

        // Move Iris video first in the list in order to be visible
        instance.videoContainer.prepend(instance.videoContainer.querySelector('#iris-idle'))
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
        return (
            id.includes('episode-') && instance.world.program.getCurrentStepData().details.play_video_directly
        )
    }

    setFullscreenIfNecessary() {
        if (!this.isFullscreen_ && instance.isVideoEpisode()) {
            instance.video().requestFullscreen()
            instance.addSkipBtn()
        }
    }

    addSkipBtn() {
        if (instance.hasSkipBtn()) return

        const skipVideo = document.createElement('div')
        skipVideo.className = 'skip-video button-arrow'
        skipVideo.innerHTML = `<span>${_s.miniGames.skip}</span>`
        skipVideo.setAttribute('role', 'button')
        skipVideo.addEventListener('click', instance.finish)
        instance.videoJsEl().appendChild(skipVideo)
    }
}
