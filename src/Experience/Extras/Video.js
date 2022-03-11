import * as THREE from 'three'
import Experience from "../Experience.js";
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

let instance = null

export default class Video {
    constructor() {
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
        this.setVideoScreen()
        this.setVideoControls()

        this.video = () => document.getElementById(instance.playingVideoId)
        this.videoProgress = 0.0
        this.playingVideoId = null
        this.isDragging = false
        this.mouseX = 0
        this.percentageNow = 0
        this.percentageNext = 0
    }

    load(id) {
        this.playingVideoId = id

        if (!this.texture)
            this.setVideoListeners()

        // Pause initial video
        if (this.texture && !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path))
            this.texture.image.pause()

        // Update video on screen (set initial or replace if it's a new video)
        if (!this.texture || !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path)) {
            this.texture = this.resources.mediaItems[id].item
            this.videoMesh.material.map = this.texture
            this.videoMesh.material.needsUpdate = true
        }

        // Event listener on video update
        this.video().addEventListener('timeupdate', function() {
            instance.setProgress(this.video().currentTime);
        }.bind(instance));

        // Event listener on video end
        this.video().onended = function() {
            instance.exitFullscreenVideo()
            instance.camera.revertZoom()
            instance.stop()
            instance.experience.world.program.advance()
        }

        // Event listener on fullscreen change
        this.video().onfullscreenchange = function() {
            if (!document.fullscreenElement)
                instance.camera.revertZoom()
        }

        this.setProgress(this.video().currentTime);
        this.focus()
    }

    focus() {
        instance.play()
        instance.el.videoOverlay.classList.add('in-frustum')
    }

    play() {
        instance.texture.image.play()
        instance.el.videoControlBar.classList.remove('show-controls')
    }

    defocus() {
        if (instance.texture) {
            instance.pause()
            instance.el.videoOverlay.classList.remove('in-frustum')
        }
    }

    pause() {
        instance.texture.image.pause()
        instance.el.videoControlBar.classList.add('show-controls')

    }

    stop() {
        instance.texture.image.pause()
        instance.texture.image.currentTime = 0
        instance.videoMesh.material.map = null
    }

    togglePlay() {
        if (!instance.texture) return

        instance.texture.image.paused
            ? instance.play()
            : instance.pause()
    }

    toggleSound() {
        let video = document.getElementById(instance.playingVideoId)
        video.muted = !video.muted;
    }

    setFullscreenVideo() {
        let video = document.getElementById(instance.playingVideoId)
        if (video.requestFullscreen) {
            video.requestFullscreen()
        } else if (video.webkitRequestFullscreen) { /* Safari */
            video.webkitRequestFullscreen()
        } else if (video.msRequestFullscreen) { /* IE11 */
            video.msRequestFullscreen()
        }
    }

    exitFullscreenVideo() {
        let video = document.getElementById(instance.playingVideoId)
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
    
    setVideoScreen() {
        this.planeGeometry = new THREE.PlaneGeometry(16, 9)
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        this.videoMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial)

        this.videoMesh.name = "Video_Screen"
        this.videoMesh.position.set(17, 3, 0)
        this.videoMesh.rotation.y = -THREE.MathUtils.degToRad(90)
        this.scene.add(this.videoMesh)
    }

    setVideoControls() {
        // Video controls
        var planeWidth = 16
        var planeHeight = 2
        var videoOverlayWidth = 1024
        var videoOverlayHeight = videoOverlayWidth * 9 / 16

        var videoControls = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, opacity: 0, transparent: true })
        var videoPlaneGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
        var videoControlsMesh = new THREE.Mesh(videoPlaneGeometry, videoControls)
        videoControlsMesh.rotation.y = -THREE.MathUtils.degToRad(90)
        videoControlsMesh.position.x = 16.9
        videoControlsMesh.position.y = -1
        this.scene.add(videoControlsMesh)
        
        // Create a new scene to hold CSS
        this.cssScene = new THREE.Scene()

        var videoOverlay = document.createElement('div')
        videoOverlay.innerHTML = `<div class="video-overlay" style="width: ${ videoOverlayWidth }px; height: ${ videoOverlayHeight }px">  
            <div class="video-controlbar">
                <div class="video-timeline">
                    <div class="loadedbar"></div>
                    <div class="seekbar"></div>
                    <div class="progressbar"></div>
                    <div class="progress-button"></div>
                </div>
                <div class="video-controls">
                    <span class="play-pause btn"><i class="icon icon-play"></i></span>
                    <span class="sound btn"><i class="icon icon-sound-on"></i></span>
                    <span class="timetracker"></span>
                    <span class="fullscreen btn"><i class="icon icon-fullscreen"></i></span>
                </div>
            </div>
        </div>`

        var css3element	= document.createElement('div')
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
        this.rendererCSS.domElement.classList.add('css-container')
        this.rendererCSS.domElement.style.position = 'absolute'
        this.rendererCSS.domElement.style.top = 0

        document.body.appendChild(this.rendererCSS.domElement)
        this.rendererCSS.domElement.prepend(this.renderer.instance.domElement)
    }

    setVideoListeners() {
        instance.el = {
            videoOverlay: document.querySelector(".video-overlay"),
            videoControlBar: document.querySelector(".video-controlbar"),
            playPause: document.querySelector(".play-pause"),
            sound: document.querySelector(".sound"),
            videoTimeline: document.querySelector(".video-timeline"),
            progressBar: document.querySelector(".progressbar"),
            progressButton: document.querySelector(".progress-button"),
            timetracker: document.querySelector(".timetracker"),
            fullscreen: document.querySelector(".fullscreen")
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
        instance.mouseX = event.clientX || ( event.changedTouches && event.changedTouches[0].clientX )
        instance.percentageNow = parseInt( instance.el.progressBar.style.width ) / 100
        instance.addControlListeners()
    }

    onVideoControlStop(event) {
        event.stopPropagation();
        instance.isDragging = false;
        instance.removeControlListeners();
    }

    onVideoControlDrag(event) {
        if (instance.isDragging) {
            const clientX = event.clientX || ( event.changedTouches && event.changedTouches[0].clientX )
            instance.percentageNext = ( clientX - instance.mouseX ) / instance.el.videoTimeline.clientWidth
            instance.percentageNext = instance.percentageNow + instance.percentageNext
            instance.percentageNext = instance.percentageNext > 1 ? 1 : ( ( instance.percentageNext < 0 ) ? 0 : instance.percentageNext )
            instance.setVideoCurrentTime(instance.percentageNext)
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
        if ( this.video() && !Number.isNaN( percentage ) && percentage !== 1 ) {
            instance.video().currentTime = instance.video().duration * percentage
        }
    }

    onTap(event) {
        event.preventDefault();
        event.stopPropagation();

        const percentage = ( event.changedTouches && event.changedTouches.length > 0 )
            ? ( event.changedTouches[0].pageX - event.target.getBoundingClientRect().left ) / instance.el.videoTimeline.clientWidth
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
            if (e.key === 'p') {
                this.play()
            }
            else if (e.key === ' ') {
                this.pause()
            }
            else if (e.key === 's') {
                this.stop()
                this.experience.world.program.advance()
            }
            else if (e.key === 'r') {
                this.texture.image.currentTime = 0
            }
        }
    }
}