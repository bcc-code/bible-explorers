import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import Experience from "../Experience.js";
import _lang from '../Utils/Lang.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'

let instance = null
let canvasTexture = null

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
        this.scene = this.experience.scene
        this.clickableObjects = this.world.controlRoom.clickableObjects

        instance = this

        // Setup
        this.portalScreen = this.world.controlRoom.tv_portal
        this.tablet = this.world.controlRoom.tablet
        this.videoPlayIcon = null

        instance.canvasTexture()

        this.video = () => {
            let id = instance.playingVideoId
            return instance.resources.videoPlayers[id]
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

    canvasTexture() {
        //create image
        const bitmap = createRetinaCanvas(1920, 1080, 1)
        const ctx = bitmap.getContext('2d', { antialias: false })

        const centerX = bitmap.width / 2
        const centerY = bitmap.height / 2
        const size = 40
        const circle = size * 2.5

        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.rect(0, 0, 1920, 1080)
        ctx.fillStyle = 'black'
        ctx.fill()

        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 20
        ctx.strokeStyle = "#ffffff"
        ctx.fillStyle = "#ffffff"

        // make circle
        ctx.beginPath()
        ctx.arc(centerX, centerY , circle, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.stroke()

        // make play button
        
        ctx.lineJoin = "round"

        ctx.beginPath()
        ctx.moveTo(centerX - size + 10, centerY - size)
        ctx.lineTo(centerX - size + 10, centerY + size)
        ctx.lineTo(centerX + size + 5, centerY)
        ctx.closePath()
        ctx.stroke()
        ctx.fill()

        // canvas contents are used for
        const texture = new THREE.Texture(bitmap)
        texture.needsUpdate = true

        const material = new THREE.MeshBasicMaterial({ color: '#ffffff', map: texture, transparent: true })

        const geometry = new THREE.PlaneGeometry(16, 9)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = 'play_video_icon'
        this.scene.add(mesh)

        mesh.position.copy(instance.portalScreen.position)
        mesh.quaternion.copy(instance.portalScreen.quaternion)
        mesh.position.x -= 0.01
        mesh.visible = false

        this.videoPlayIcon = mesh
        this.clickableObjects.push(mesh)
    }

    load(id) {
        this.playingVideoId = id

        // First, remove all previous event listeners - if any
        this.video().off('ended', instance.waitAndFinish)

        // Always start new loaded videos from the beginning
        this.video().currentTime(0)

        // Set texture when starting directly on a video task type
        if (this.portalScreen.material.map != this.resources.customTextureItems[id])
            this.setTexture(id)

        const videoQuality = this.getVideoQuality()
        this.resources.videoPlayers[id].setVideoQuality(videoQuality)

        // Add event listener on play
        this.video().on('play', function () {
            this.requestFullscreen()
        })

        // Add event listener on video update
        this.video().on('timeupdate', function () {
            if (instance.showSkipBtn()) {
                if (instance.hasSkipBtn()) return

                const skipVideo = document.createElement('div')
                skipVideo.className = 'skip-video btn default next'
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
        if (!this.resources.customTextureItems.hasOwnProperty(id)) return

        this.portalScreen.material.map = this.resources.customTextureItems[id]
        this.portalScreen.material.map.flipY = false
        this.portalScreen.material.needsUpdate = true
    }

    //#region Actions

    play() {
        instance.video().play()
        this.experience.videoIsPlaying = true
    }

    pause() {
        instance.video().pause()
        this.experience.videoIsPlaying = false
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
            instance.portalScreen.scale.set(0, 0, 0)
            instance.videoPlayIcon.visible = false


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

        // instance.experience.navigation.next.disabled = false
    }

    waitAndFinish() {
        if (instance.hasSkipBtn())
            instance.getSkipBtn().remove()

        setTimeout(() => { instance.finish() }, 1000)
    }

    finish() {
        instance.defocus()
        instance.world.program.nextStep()
    }

    update() {
        canvasTexture.needsUpdate = true
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
        if (instance.debug.developer || instance.debug.onPreviewMode())
            return true

        const secondsToSkip = 10
        const currentTime = instance.video().currentTime()
        const duration = instance.video().duration()

        return duration - currentTime < secondsToSkip
    }
}

const PIXEL_RATIO = (function () {
    var ctx = document.createElement('canvas').getContext('2d'),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
    return dpr / bsr;
})();


const createRetinaCanvas = function (w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement('canvas');
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + 'px';
    can.style.height = h + 'px';
    can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}