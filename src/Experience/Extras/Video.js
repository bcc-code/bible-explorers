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
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        instance = this

        // Setup
        this.portalScreen = this.world.controlRoom.tv_portal
        this.tablet = this.world.controlRoom.tablet

        this.video = () => {
            let id = instance.playingVideoId
            return instance.resources.videoPlayers[id];
        }

        this.videoJsEl = () => {
            let id = instance.playingVideoId

            if (this.resources.mediaItems.hasOwnProperty(id))
                id = 'videojs-' + id

            return document.getElementById(id)
        }

        this.playingVideoId = null
    }

    load(id) {
        const mediaItem = this.resources.mediaItems[id].item
        this.playingVideoId = id

        // Pause initial video
        if (this.texture && !this.texture.image.currentSrc.includes(mediaItem.path))
            this.texture.image.pause()

        // Update video on screen (set initial or replace if it's a new video)
        if (!this.texture || !this.texture.image.currentSrc.includes(mediaItem.path)) {
            this.texture = mediaItem

            // Set texture when starting directly on a video task type
            if (this.portalScreen.material.map != this.resources.textureItems[id])
                this.setTexture(id)

            this.resources.videoPlayers[id].setVideoQuality(this.getVideoQuality())
        }

        // Event listener on video update
        this.video().on('timeupdate', function () {
            if (instance.showSkipBtn()) {
                if (!instance.videoJsEl().querySelector('.skip-video__btn')) {
                    let skipVideo = document.createElement('div')
                    skipVideo.classList.add("button", "button__continue", "skip-video__btn")

                    const bg = document.createElement('div')
                    bg.classList.add('button__content')

                    let span = document.createElement('span')
                    span.innerText = _s.miniGames.skip
                    skipVideo.appendChild(bg)
                    bg.appendChild(span)

                    skipVideo.addEventListener('click', instance.finish)
                    instance.videoJsEl().appendChild(skipVideo)
                }
            }
        })

        // Event listener on fullscreen change
        this.video().on('fullscreenchange', function () {
            if (!document.fullscreenElement) {
                instance.pause()
            }
        })

        // Event listener on video end
        this.video().on('ended', instance.finish)

        this.focus()
        this.setControls()
    }

    setTexture(id) {
        if (!this.resources.textureItems.hasOwnProperty(id)) return

        this.portalScreen.material.map = this.resources.textureItems[id]
        this.portalScreen.material.map.flipY = false
        this.portalScreen.material.needsUpdate = true
    }

    //#region Actions

    play() {
        if (!instance.texture) return

        instance.portalScreen.material.map = instance.texture
        instance.texture.image.play()
        instance.video().requestFullscreen()
    }

    pause() {
        instance.texture.image.pause()
    }

    focus() {
        instance.camera.zoomIn(1500)

        this.tablet.material.map.source.data.play()
        new TWEEN.Tween(instance.portalScreen.material)
            .to({ color: new THREE.Color(0xFFFFFF) }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }

    defocus() {
        if (instance.texture) {
            instance.pause()
            if (document.fullscreenElement) {
                instance.video().exitFullscreen()
            }

            this.tablet.material.map.source.data.pause()
            new TWEEN.Tween(instance.portalScreen.material)
                .to({ color: new THREE.Color(0x131A43) }, 1000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start()
        }
    }

    finish() {
        instance.defocus()
        instance.world.program.advance()
    }

    togglePlay() {
        if (!instance.texture) return

        instance.texture.image.paused
            ? instance.play()
            : instance.pause()
    }

    //#endregion

    setControls() {
        document.onkeydown = (e) => {
            if (e.key === ' ') {
                instance.togglePlay()
            }
            else if (e.key === 'ArrowLeft') {
                instance.video().currentTime -= 10
            }
            else if (e.key === 'ArrowRight') {
                instance.video().currentTime += 10
            }
            else if (e.key === 'ArrowUp') {
                instance.video().volume = Math.min(instance.video().volume + 0.1, 1)
            }
            else if (e.key === 'ArrowDown') {
                instance.video().volume = Math.max(instance.video().volume - 0.1, 0)
            }
        }
    }

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
        const secondsToSkip = 25
        const currentTime = instance.video().currentTime()
        const duration = instance.video().duration()

        return duration - currentTime < secondsToSkip
    }
}