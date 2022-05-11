import * as THREE from 'three'
import Experience from "../Experience.js";
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import _lang from '../Utils/Lang.js'

let instance = null

export default class Video {
    constructor() {
        if (instance)
            return instance

        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.canvas = this.experience.canvas
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.renderer = this.experience.renderer
        this.controls = this.experience.camera.controls
        instance = this

        // Setup
        this.videoWidth = 1920
        this.videoHeight = 1111 // videoOverlayWidth * 9 / 16
        this.portalScreen = this.experience.world.controlRoom.tv_portal
        this.portalScreen.material = new THREE.MeshBasicMaterial({ color: 0xffffff })

        this.setVideo(this.portalScreen)
        this.render()

        this.video = () => {
            let id = instance.playingVideoId

            // If video is streamed from BTV
            if (this.resources.mediaItems.hasOwnProperty(id) && this.resources.mediaItems[id].path.includes('brunstad.tv'))
                id = 'videojs-' + id + '_html5_api'

            return document.getElementById(id)
        }

        this.videoProgress = 0.0
        this.playingVideoId = null
        this.isDragging = false
        this.mouseX = 0
        this.percentageNow = 0
        this.percentageNow = 0

    }

    setVideo(obj) {
        const size = new THREE.Vector3()
        const box = new THREE.Box3().setFromObject(obj)
        const planeWidth = box.getSize(size).z
        const planeHeight = 2

        const videoGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
        const videoControlsMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })

        this.videoControls = new THREE.Mesh(videoGeometry, videoControlsMaterial)
        this.videoControls.name = "video_controls"
        this.videoControls.position.z += 0.01
        this.videoControls.position.y -= (box.getSize(size).y * 0.5) - (planeHeight / 2)

        // Add Plane
        obj.add(this.videoControls)

        // Create html
        this.createHTML()

        // Add controls
        const cssObject = new CSS3DObject(this.videoOverlay)
        cssObject.position.y -= this.videoControls.geometry.parameters.height * 0.5
        cssObject.scale.x /= this.videoWidth / planeWidth
        cssObject.scale.y /= this.videoWidth / planeWidth

        this.videoControls.add(cssObject);
    }

    createHTML() {
        this.videoOverlay = document.createElement('div')
        this.videoOverlay.classList.add('css3dobject')
        this.videoOverlay.innerHTML = `<div class="video__overlay is-paused" style="width: ${this.videoWidth}px; height: ${this.videoHeight}px">
            <div class="video__iframe hide"></div>
            <div class="video__play"><i class="icon icon-play-solid"></i></div>
            <div class="video__controlbar hide">
                <div class="video__timeline">
                    <div class="video__loadedbar"></div>
                    <div class="video__seekbar"></div>
                    <div class="video__progressbar"></div>
                    <div class="video__progress-button"></div>
                </div>
                <div class="video__controls">
                    <span class="video__play-pause video__controlsBtn"><i class="icon-play-solid"></i><i class="icon-pause-solid"></i></span>
                    <span class="video__sound video__controlsBtn"><i class="icon-volume-solid"></i><i class="icon-volume-slash-solid"></i></span>
                    <span class="video__timetracker"></span>
                    <span class="video__fullscreen video__controlsBtn"><i class="icon-expand-solid"></i></span>
                </div>
            </div>
        </div>`
    }

    load(id) {
        this.playingVideoId = id

        if (!this.texture)
            this.setVideoListeners()

        instance.el.videoControlBar.classList.remove('hide')
        instance.el.videoIframe.classList.add('hide')

        // Pause initial video
        if (this.texture && !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path))
            this.texture.image.pause()

        // Update video on screen (set initial or replace if it's a new video)
        if (!this.texture || !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path)) {
            this.texture = this.resources.mediaItems[id].item

            this.portalScreen.material.map = this.texture
            this.portalScreen.material.tonnedMap = false
            this.portalScreen.material.needsUpdate = true
        }

        // Event listener on video update
        this.video().addEventListener('timeupdate', function () {
            instance.setProgress(this.video().currentTime);
        }.bind(instance));

        // Event listener on volume changer while on fullscreen
        this.video().onvolumechange = function () {
            if (document.fullscreenElement) {
                if (instance.video().muted || instance.video().volume == 0) {
                    instance.el.videoOverlay.classList.add('is-muted')
                } else {
                    instance.el.videoOverlay.classList.remove('is-muted')
                }
            }
        }

        // Event listener on video end
        this.video().onended = function () {
            instance.exitFullscreenVideo()
            instance.defocus()
            instance.experience.world.program.advance()
        }

        // Event listener on fullscreen change
        this.video().onfullscreenchange = function () {
            if (!document.fullscreenElement)
                instance.camera.revertZoom()
        }

        this.setProgress(this.video().currentTime)
        this.focus()
        this.setControls()
    }

    setTexture(id) {
        if (!this.resources.textureItems.hasOwnProperty(id)) return

        this.portalScreen.material.map = this.resources.textureItems[id]
        this.portalScreen.material.map.flipY = false
        this.portalScreen.material.needsUpdate = true
    }

    setProgress(currentTime) {
        const duration = this.video().duration
        this.el.timetracker.innerHTML = this.formatToTimestamps(currentTime || 0, duration || 0)
        var width = currentTime / duration
        if (!!this.el.progressBar) this.el.progressBar.style.width = width * 100 + '%'
        if (!!this.el.progressButton) this.el.progressButton.style.left = width * 100 + '%'
    }

    //#region Time Format

    formatToTimestamps(currentTime, duration) {
        var timeString = this.formatTimeObject(this.secondsToObject(currentTime))
        var durationString = typeof duration === 'string' ? duration : this.formatTimeObject(this.secondsToObject(duration))
        return timeString + ' / ' + durationString
    }

    formatTimeObject(timeObject) {
        return timeObject.minutes.toString().padStart(2, '0') + ':' + timeObject.seconds.toString().padStart(2, '0')
    }

    secondsToObject(time) {
        var hours = Math.floor(time / 3600)
        var minutes = Math.floor((time - hours * 3600) / 60)
        var seconds = Math.floor(time - minutes * 60)

        return {
            hours: hours,
            minutes: minutes,
            seconds: seconds
        }
    }

    setVideoCurrentTime(percentage) {
        if (this.video() && !Number.isNaN(percentage) && percentage !== 1) {
            instance.video().currentTime = instance.video().duration * percentage
        }
    }
    //#endregion

    //#region Actions

    focus() {
        instance.camera.zoomIn()
        instance.el.videoOverlay.classList.add('in-frustum')
        instance.portalScreen.material.color.set(new THREE.Color().setRGB(1, 1, 1))

        if (instance.texture && !instance.texture.image.muted)
            instance.el.videoOverlay.classList.remove('is-muted')
    }

    play() {
        if (!instance.texture) return

        instance.texture.image.play()
        instance.setFullscreenVideo()
        instance.el.videoControlBar.classList.remove('show-controls')
        instance.el.videoOverlay.classList.remove('is-paused')
        instance.el.videoOverlay.classList.add('is-playing')
    }

    defocus() {
        if (instance.texture) {
            instance.pause()
            instance.camera.revertZoom()
            instance.el.videoOverlay.classList.remove('in-frustum')
        }
        else {
            if (instance.el) {
                instance.el.videoIframe.classList.add('hide')
            }
        }
    }

    pause() {
        instance.texture.image.pause()
        instance.el.videoControlBar.classList.add('show-controls')
        instance.el.videoOverlay.classList.remove('is-playing')
        instance.el.videoOverlay.classList.add('is-paused')
    }

    togglePlay() {
        if (!instance.texture) return

        instance.texture.image.paused
            ? instance.play()
            : instance.pause()
    }

    toggleSound() {
        let video = instance.video()
        video.muted = !video.muted;

        instance.el.videoOverlay.classList.toggle('is-muted')
    }

    setFullscreenVideo() {
        let video = instance.video()
        if (video.requestFullscreen) {
            video.requestFullscreen()
        } else if (video.webkitRequestFullscreen) { /* Safari */
            video.webkitRequestFullscreen()
        } else if (video.msRequestFullscreen) { /* IE11 */
            video.msRequestFullscreen()
        }
    }

    exitFullscreenVideo() {
        let video = instance.video()
        if (video.exitFullscreen) {
            video.exitFullscreen()
        } else if (video.webkitExitFullScreen) { /* Safari */
            video.webkitExitFullScreen()
        } else if (video.msExitFullscreen) { /* IE11 */
            video.msExitFullscreen()
        } else if (video.mozCancelFullScreen) {
            video.mozCancelFullScreen()
        }
    }
    //#endregion

    //#region Events

    setVideoListeners() {
        instance.el = {
            videoOverlay: document.querySelector(".video__overlay"),
            videoIframe: document.querySelector(".video__iframe"),
            videoControlBar: document.querySelector(".video__controlbar"),
            playPause: document.querySelector(".video__play-pause"),
            sound: document.querySelector(".video__sound"),
            videoTimeline: document.querySelector(".video__timeline"),
            progressBar: document.querySelector(".video__progressbar"),
            progressButton: document.querySelector(".video__progress-button"),
            timetracker: document.querySelector(".video__timetracker"),
            fullscreen: document.querySelector(".video__fullscreen"),
            playButton: document.querySelector(".video__play")
        }

        instance.el.videoOverlay.addEventListener("mouseover", () => { instance.el.videoControlBar.style.opacity = 1 })
        instance.el.videoOverlay.addEventListener("mouseout", () => { if (!instance.el.videoControlBar.classList.contains('show-controls')) instance.el.videoControlBar.style.opacity = 0 })
        instance.el.playPause.addEventListener("click", instance.togglePlay)
        instance.el.playButton.addEventListener("click", instance.togglePlay)
        instance.el.sound.addEventListener("click", instance.toggleSound)
        instance.el.fullscreen.addEventListener("click", instance.setFullscreenVideo)
        instance.el.progressButton.addEventListener('click', instance.onMouseDown)
        instance.el.progressButton.addEventListener('touchstart', instance.onMouseDown)
        instance.el.videoTimeline.addEventListener('click', instance.onTap)
    }
    onMouseDown(event) {
        event.stopPropagation()
        instance.isDragging = true
        instance.mouseX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX)
        instance.percentageNow = parseInt(instance.el.progressBar.style.width) / 100
        instance.addControlListeners()
    }
    onTap(event) {
        event.preventDefault();
        event.stopPropagation();

        const percentage = (event.changedTouches && event.changedTouches.length > 0)
            ? (event.changedTouches[0].pageX - event.target.getBoundingClientRect().left) / instance.el.videoTimeline.clientWidth
            : event.offsetX / instance.el.videoTimeline.clientWidth;

        instance.setVideoCurrentTime(percentage)
        instance.setProgress(percentage)
    }
    //#endregion

    //#region Controls

    onVideoControlStop(event) {
        event.stopPropagation();
        instance.isDragging = false;
        instance.removeControlListeners();
    }

    onVideoControlDrag(event) {
        if (instance.isDragging) {
            const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX)
            instance.percentageNow = (clientX - instance.mouseX) / instance.el.videoTimeline.clientWidth
            instance.percentageNow = instance.percentageNow + instance.percentageNow
            instance.percentageNow = instance.percentageNow > 1 ? 1 : ((instance.percentageNow < 0) ? 0 : instance.percentageNow)
            instance.setVideoCurrentTime(instance.percentageNow)
        }
    }

    addControlListeners() {
        document.addEventListener('mousemove', instance.onVideoControlDrag);
        document.addEventListener('mouseup', instance.onVideoControlStop);
        document.addEventListener('touchmove', instance.onVideoControlDrag);
        document.addEventListener('touchend', instance.onVideoControlStop);
    }

    removeControlListeners() {
        document.removeEventListener('mousemove', instance.onVideoControlDrag, false);
        document.removeEventListener('mouseup', instance.onVideoControlStop, false);
        document.removeEventListener('touchmove', instance.onVideoControlDrag, false);
        document.removeEventListener('touchend', instance.onVideoControlStop, false);
    }

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

    // #endregion

    render() {
        this.rendererCSS = new CSS3DRenderer()
        this.rendererCSS.setSize(this.sizes.width, this.sizes.height)
        this.rendererCSS.domElement.classList.add('video')
        document.body.appendChild(this.rendererCSS.domElement)
    }

    resize() {
        this.rendererCSS.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.rendererCSS.render(this.scene, this.camera.instance)
    }

}