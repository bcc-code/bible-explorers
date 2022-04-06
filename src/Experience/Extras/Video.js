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
        this.videoMesh = this.experience.world.controlRoom.videoObject
        this.videoMesh.material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide })
        this.videoMesh.material.needsUpdate = true

        this.setVideoControls()

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

    load(id) {
        this.playingVideoId = id

        if (!this.texture)
            this.setVideoListeners()

        console.log(this.resources.mediaItems[id].item);

        instance.el.videoControlBar.classList.remove('hide')
        instance.el.videoIframe.classList.add('hide')

        // Pause initial video
        if (this.texture && !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path))
            this.texture.image.pause()

        // Update video on screen (set initial or replace if it's a new video)
        if (!this.texture || !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path)) {
            this.texture = this.resources.mediaItems[id].item


            this.videoMesh.material.map = this.texture
            this.videoMesh.material.tonnedMap = false
            this.videoMesh.material.needsUpdate = true

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
        if (!this.videoMesh.material.map) return
        if (!this.resources.textureItems.hasOwnProperty(id)) return

        this.videoMesh.material.map = this.resources.textureItems[id]
        this.videoMesh.material.map.flipY = false
        this.videoMesh.material.color.set(new THREE.Color().setRGB(0.211, 0.211, 0.211))
    }

    focus() {
        instance.play()
        instance.camera.zoomIn()
        instance.el.videoOverlay.classList.add('in-frustum')
        instance.videoMesh.material.color.set(new THREE.Color().setRGB(1, 1, 1))

        if (instance.texture && !instance.texture.image.muted)
            instance.el.videoOverlay.classList.remove('is-muted')
    }

    play() {
        if (!instance.texture) return

        instance.texture.image.play()
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

    setVideoControls() {
        const size = new THREE.Vector3()
        const box = new THREE.Box3().setFromObject(this.videoMesh)

        // Video controls
        var planeWidth = box.getSize(size).z
        var planeHeight = 2
        var videoOverlayWidth = 1920
        var videoOverlayHeight = 1111 // videoOverlayWidth * 9 / 16

        var videoControls = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, opacity: 0, transparent: true })
        var videoPlaneGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
        var videoControlsMesh = new THREE.Mesh(videoPlaneGeometry, videoControls)
        videoControlsMesh.rotation.y = -THREE.MathUtils.degToRad(90)
        videoControlsMesh.position.x = this.videoMesh.position.x - 0.01
        videoControlsMesh.position.y = - (box.getSize(size).y / 2 - this.videoMesh.position.y)
        this.scene.add(videoControlsMesh)

        // Create a new scene to hold CSS
        this.cssScene = new THREE.Scene()

        var videoOverlay = document.createElement('div')
        videoOverlay.innerHTML = `<div class="video__overlay" style="width: ${videoOverlayWidth}px; height: ${videoOverlayHeight}px">
            <div class="video__iframe hide"></div>
            <div class="video__controlbar hide">
                <div class="video__timeline">
                    <div class="video__loadedbar"></div>
                    <div class="video__seekbar"></div>
                    <div class="video__progressbar"></div>
                    <div class="video__progress-button"></div>
                </div>
                <div class="video__controls">
                    <span class="video__play-pause video__controlsBtn"><i class="icon-play"></i><i class="icon-pause"></i></span>
                    <span class="video__sound video__controlsBtn"><i class="icon-sound"></i><i class="icon-mute"></i></span>
                    <span class="video__timetracker"></span>
                    <span class="video__fullscreen video__controlsBtn"><i class="icon-expand"></i></span>
                </div>
            </div>
        </div>`

        var css3element = document.createElement('div')
        css3element.classList.add('css3dobject')
        css3element.innerHTML = videoOverlay.innerHTML

        var cssObject = new CSS3DObject(css3element)
        cssObject.position.copy(videoControlsMesh.position)
        cssObject.rotation.copy(videoControlsMesh.rotation)
        cssObject.scale.x /= videoOverlayWidth / planeWidth
        cssObject.scale.y /= videoOverlayWidth / planeWidth
        this.cssScene.add(cssObject);

        // Create a renderer for CSS
        this.rendererCSS = new CSS3DRenderer()
        this.rendererCSS.setSize(this.sizes.width, this.sizes.height)
        this.rendererCSS.domElement.classList.add('video')
        this.rendererCSS.domElement.style.position = 'absolute'
        this.rendererCSS.domElement.style.top = 0

        document.body.appendChild(this.rendererCSS.domElement)
        this.rendererCSS.domElement.prepend(this.renderer.instance.domElement)
    }

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
            fullscreen: document.querySelector(".video__fullscreen")
        }

        instance.el.videoOverlay.addEventListener("mouseover", () => { instance.el.videoControlBar.style.opacity = 1 })
        instance.el.videoOverlay.addEventListener("mouseout", () => { if (!instance.el.videoControlBar.classList.contains('show-controls')) instance.el.videoControlBar.style.opacity = 0 })
        instance.el.playPause.addEventListener("click", instance.togglePlay)
        instance.el.sound.addEventListener("click", instance.toggleSound)
        instance.el.fullscreen.addEventListener("click", instance.setFullscreenVideo)
        instance.el.progressButton.addEventListener('mousedown', instance.onMouseDown)
        instance.el.progressButton.addEventListener('touchstart', instance.onMouseDown)
        instance.el.videoTimeline.addEventListener('mousedown', instance.onTap)
    }

    setProgress(currentTime) {
        const duration = this.video().duration
        this.el.timetracker.innerHTML = this.formatToTimestamps(currentTime || 0, duration || 0)
        var width = currentTime / duration
        if (!!this.el.progressBar) this.el.progressBar.style.width = width * 100 + '%'
        if (!!this.el.progressButton) this.el.progressButton.style.left = width * 100 + '%'
    }

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

    onMouseDown(event) {
        event.stopPropagation()
        instance.isDragging = true
        instance.mouseX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX)
        instance.percentageNow = parseInt(instance.el.progressBar.style.width) / 100
        instance.addControlListeners()
    }

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

    setVideoCurrentTime(percentage) {
        if (this.video() && !Number.isNaN(percentage) && percentage !== 1) {
            instance.video().currentTime = instance.video().duration * percentage
        }
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

    resize() {
        this.rendererCSS.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.rendererCSS.render(this.cssScene, this.camera.instance)
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
}