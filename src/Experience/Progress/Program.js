import Experience from "../Experience.js"
import Archive from '../Extras/Archive.js'
import Timer from '../Extras/Timer.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import Video from '../Extras/Video.js'
import data from "./episode-1.json";

let instance = null

export default class Program {
    constructor() {
        this.initialize()
    }

    initialize() {
        this.experience = new Experience()
        this.archive = new Archive()
        this.timer = new Timer()
        this.codeUnlock = new CodeUnlock()
        this.video = new Video()
        this.resources = this.experience.resources
        this.world = this.experience.world
        this.camera = this.experience.camera
        this.highlight = this.world.highlight
        instance = this

        // Get instance variables
        this.currentStep = localStorage.getItem(this.getId()) || 0
        this.videoType = () => this.currentStep in data.steps ? "video" in data.steps[this.currentStep] : false
        this.currentLocation = () => this.currentStep in data.steps ? data.steps[this.currentStep].location : null
        this.interactiveObjects = () => this.currentStep in data.steps ? data.steps[this.currentStep].clickableElements : []
        this.totalSteps = Object.keys(data.steps).length
        this.clickedObject = null
        this.canClick = true

        this.startInteractivity()
    }

    control(currentIntersect) {
        if (!this.canClick) return

        this.clickedObject = currentIntersect.name

        if (this.objectIsClickable()) {
            this.startAction()
        }
    }

    advance(step = ++this.currentStep) {
        this.updateCurrentStep(step)
        this.world.progressBar.refresh()
        this.startInteractivity()
    }

    updateCurrentStep(newStep) {
        this.currentStep = newStep
        this.updateLocalStorage()
    }

    startInteractivity() {
        this.camera.updateCameraTo(this.currentLocation())
        this.highlight.setHightlight(this.interactiveObjects())
        
        if (this.videoType()) {
            let video = this.currentVideo()
            setTimeout(function() {
                instance.video.load(video)
            }, instance.camera.data.moveDuration, video)
        }
    }

    objectIsClickable() {
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
            this.advance()
        }

        if (this.clickedObject === 'Panel_Screen') {
            this.timer.setMinutes(5)
            this.codeUnlock.open()
        }

        if (this.clickedObject === 'Panel_Green_button') {
            this.video.togglePlay()
        }

        if (this.clickedObject === 'Panel_Red_button') {
            this.video.stop()
            this.advance()
        }

        if (this.clickedObject === 'Video_Screen') {
            this.video.togglePlay()
        }
    }

    currentVideo() {
        let localCurrentStep = this.currentStep
        while (!(localCurrentStep in data.steps) || !("video" in data.steps[localCurrentStep]))
            localCurrentStep--

        return data.steps[localCurrentStep].video
    }

    updateLocalStorage() {
        localStorage.setItem(this.getId(), this.currentStep)
    }

    getId() {
        return "progress-episode-" + this.world.selectedEpisode
    }
}