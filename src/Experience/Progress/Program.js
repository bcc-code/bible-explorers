import Experience from "../Experience.js"
import Archive from '../Extras/Archive.js'
import Timer from '../Extras/Timer.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import Video from '../Extras/Video.js'

let instance = null

export default class Program {
    constructor() {
        this.initialize()
    }

    initialize() {
        instance = this

        this.experience = new Experience()
        this.archive = new Archive()
        this.timer = new Timer()
        this.codeUnlock = new CodeUnlock()
        this.video = new Video()
        this.resources = this.experience.resources
        this.world = this.experience.world
        this.camera = this.experience.camera
        this.highlight = this.world.highlight
        this.programData = this.world.selectedEpisode.program

        // Get instance variables
        this.episodeProgress = () => localStorage.getItem(this.world.getId())
        this.currentStep = this.episodeProgress() || 0
        this.getCurrentStepData = () => this.currentStep in this.programData ? this.programData[this.currentStep] : null
        this.stepType = () => this.getCurrentStepData() ? this.getCurrentStepData().type : null
        this.currentLocation = () => this.getCurrentStepData() ? this.getCurrentStepData().location : null
        this.interactiveObjects = () => this.getCurrentStepData() ? this.getAllInteractiveObjects() : []
        this.totalSteps = Object.keys(this.programData).length
        this.clickedObject = null
        this.canClick = true

        this.startInteractivity(true)
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
        this.world.audio.playWhoosh()
        this.startInteractivity()
    }

    updateCurrentStep(newStep) {
        this.currentStep = newStep

        if (newStep > this.episodeProgress())
            this.updateLocalStorage()
    }

    startInteractivity(initial = false) {
        let currentVideo = this.currentVideo()
        let nextVideo = this.nextVideo()

        this.camera.updateCameraTo(this.currentLocation())
        this.highlight.setHightlight(this.interactiveObjects())
     
        if (this.stepType() == 'video') {
            setTimeout(function() {
                instance.video.load(currentVideo)
            }, instance.camera.data.moveDuration, currentVideo)
        }
        else {
            instance.video.defocus()

            if (currentVideo != nextVideo) {
                setTimeout(function() {
                    instance.video.setTexture(nextVideo)
                }, instance.camera.data.moveDuration, nextVideo)
            }
        }

        if (this.currentStep == this.totalSteps) {
            this.finish()
        }
        else if (initial) {
            setTimeout(() => {
                instance.updateIrisTexture('READY')
            }, instance.camera.data.moveDuration)
        }
    }

    finish() {
        instance.camera.updateCameraTo()
        instance.updateIrisTexture('SLEEP')
        setTimeout(() => {
            instance.world.finishJourney()
        }, instance.camera.data.moveDuration)
    }

    objectIsClickable() {
        return this.currentStep in this.programData &&
            this.interactiveObjects().includes(this.clickedObject)
    }

    getAllInteractiveObjects() {
        let interactiveObjects = this.getCurrentStepData().clickableElements || [];

        if (this.stepType() == 'video') {
            interactiveObjects = interactiveObjects.concat("Panel_Green_button","Panel_Red_button")
        }
        else if (this.stepType() == 'iris') {
            interactiveObjects.push("tv_16x9_5")
        }

        return interactiveObjects
    }

    startAction() {
        if (this.clickedObject === 'tv_4x4') {
        }

        if (this.clickedObject === 'tv_4x5') {
        }

        if (this.clickedObject === 'tv_16x10') {
        }

        if (this.clickedObject === 'tv_16x9_5') {
            instance.updateIrisTexture('SPEAK')
            instance.world.audio.playIris('BIEX_S01_E01_IRIS_OPG_test')
        }

        if (this.clickedObject === 'Panel_Screen') {
            this.timer.setMinutes(5)
            this.codeUnlock.open()
        }

        if (this.clickedObject === 'Panel_Green_button') {
            this.video.togglePlay()
        }

        if (this.clickedObject === 'Panel_Red_button') {
            this.video.defocus()
            this.advance()
        }

        if (this.clickedObject === 'Panel_Cabels') {
            this.advance()
        }
    }

    currentVideo() {
        let localCurrentStep = this.currentStep
        while (!(localCurrentStep in this.programData) || !(this.programData[localCurrentStep].type == 'video'))
            localCurrentStep--

        return this.programData[localCurrentStep].videoId
    }

    nextVideo() {
        let localCurrentStep = this.currentStep
        while (!(localCurrentStep in this.programData) || !(this.programData[localCurrentStep].type == 'video')) {
            if (localCurrentStep >= this.totalSteps) return null
            else localCurrentStep++
        }

        return this.programData[localCurrentStep].videoId
    }

    updateLocalStorage() {
        localStorage.setItem(this.world.getId(), this.currentStep)
    }

    updateIrisTexture(mode) {
        instance.world.controlRoom.setTexture('tv_16x9_5_screen', instance.resources.textureItems['BIEX_S01_E01_IRIS_'+mode].item, 90)
    }
}