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
    }

    load(id) {
        this.playingVideoId = id

         // Pause initial video
         if (this.texture && !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path))
            this.texture.image.pause()

        // Update video on screen (set initial or replace if it's a new video)
        if (!this.texture || !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path)) {
            this.texture = this.resources.mediaItems[id].item
            this.videoMesh.material.map = this.texture
            this.videoMesh.material.needsUpdate = true
        }
    }

    play() {
        instance.texture.image.play()
    }

    stop() {
        instance.texture.image.pause()
        instance.texture.image.currentTime = 0
        instance.videoMesh.material.map = null
        instance.hideVideoControls()
    }

    togglePlay() {
        if (!instance.texture) return

        if (instance.texture.image.paused) {
            instance.texture.image.play()
        } else {
            instance.texture.image.pause()
        }
    }

    toggleSound() {
        let video = document.getElementById(instance.playingVideoId)
        video.muted = !video.muted;
        console.log('toggleSound')
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
        videoOverlay.classList.add('video-overlay','show-controls','in-frustum')
        videoOverlay.innerHTML = `<div class="video-overlay show-controls in-frustum" style="width: ${ videoOverlayWidth }px; height: ${ videoOverlayHeight }px">  
            <div class="video-controlbar">
                <div class="video-timeline">
                    <div class="loadedbar"></div>
                    <div class="seekbar"></div>
                    <div class="progressbar"></div>
                    <div class="progress-button"></div>
                </div>
                <div class="video-controls">
                    <span class="play-pause btn"><i class="icon icon-play"></i></span>
                    <span class="prev btn" disabled=""><i class="icon icon-skip-back"></i></span>
                    <span class="next btn" disabled=""><i class="icon icon-skip-forward"></i></span>
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

        setTimeout(function() {
            instance.el = {
                videoControlBar: document.querySelector(".video-controlbar"),
                playPause: document.querySelector(".play-pause"),
                prev: document.querySelector(".prev"),
                next: document.querySelector(".next"),
                sound: document.querySelector(".sound"),
                timetracker: document.querySelector(".timetracker"),
                fullscreen: document.querySelector(".fullscreen")
            }

            instance.el.playPause.addEventListener("click", instance.togglePlay)
            instance.el.sound.addEventListener("click", instance.toggleSound)
            instance.el.fullscreen.addEventListener("click", instance.setFullscreenVideo)
        }, 2000)
    }

    hideVideoControls() {
        instance.el.videoControlBar.style.opacity = '0'
    }

    showVideoControls() {
        instance.el.videoControlBar.style.opacity = '1'
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
                this.texture.image.play()
            }
            else if (e.key === ' ') {
                this.texture.image.pause()
            }
            else if (e.key === 's') {
                this.texture.image.pause()
                this.texture.image.currentTime = 0
                this.experience.world.program.advance()
            }
            else if (e.key === 'r') {
                this.texture.image.currentTime = 0
            }
        }
    }
}