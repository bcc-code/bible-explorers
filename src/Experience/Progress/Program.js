import Experience from "../Experience.js"
import Archive from '../Extras/Archive.js'
import Timer from '../Extras/Timer.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import data from "./episode-1.json";

export default class Program {
    constructor() {
        this.initialize()
    }

    initialize() {
        this.experience = new Experience()
        this.archive = new Archive()
        this.timer = new Timer()
        this.codeUnlock = new CodeUnlock()
        this.world = this.experience.world
        this.camera = this.experience.camera


        this.highlight = this.world.highlight

        // Get instance variables
        this.currentStep = localStorage.getItem(this.getId()) || 0
        this.currentVideo = this.currentStep in data.steps && "video" in data.steps[this.currentStep] ? data.steps[this.currentStep].video : null
        this.currentLocation = this.currentStep in data.steps ? data.steps[this.currentStep].location : null
        this.currentLocationUpdated = () => this.currentStep in data.steps ? data.steps[this.currentStep].location : null
        this.interactiveObjects = () => this.currentStep in data.steps ? data.steps[this.currentStep].clickableElements : []
        this.totalSteps = Object.keys(data.steps).length
        this.clickedObject = null
        this.canClick = true

        this.camera.moveCameraTo(this.currentLocation)
    }

    control(currentIntersect) {
        if (!this.canClick && !this.experience.debug.active) return

        this.clickedObject = currentIntersect.name

        if (this.isNextStep()) {
            this.startAction()
        }
    }

    advance() {
        this.currentStep++
        this.updateLocalStorage()
        this.world.progressBar.refresh()
        this.camera.moveCameraTo(this.currentLocationUpdated())

        this.highlight.setHightlight(this.interactiveObjects())
    }

    isNextStep() {
        return this.currentStep in data.steps &&
            data.steps[this.currentStep].clickableElements.includes(this.clickedObject)
    }

    startAction() {
        if (this.clickedObject === 'tv_4x4') {
        }

        if (this.clickedObject === 'tv_4x5') {
        }

        if (this.clickedObject === 'tv_16x10') {
        }

        if (this.clickedObject === 'tv_16x9_5') {
        }

        if (this.clickedObject === 'Panel_Screen') {
            this.timer.setMinutes(5)
            this.codeUnlock.open()
        }

        if (this.clickedObject === 'Panel_Green_button') {
            let video = this.getVideo()
            if (video) {
                if (video.paused) {
                    video.play()
                } else {
                    video.pause()
                }
            }
        }

        if (this.clickedObject === 'Panel_Red_button') {
            let video = this.getVideo()
            if (video) {
                video.pause()
                video.currentTime = 0
                this.advance()
            }
        }
    }

    getVideo() {
        return this.currentVideo
            ? this.world.video.mediaItems[0].item.image
            : null
    }

    updateLocalStorage() {
        localStorage.setItem(this.getId(), this.currentStep)
    }

    getId() {
        return "progress-episode-" + this.world.selectedEpisode
    }
}