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
        this.currentStep = localStorage.getItem(this.world.getId()) || 0
        this.stepType = () => this.getCurrentStepData() ? this.getCurrentStepData().type : null
        this.currentLocation = () => this.getCurrentStepData() ? this.getCurrentStepData().location : null
        this.interactiveObjects = () => this.getCurrentStepData() ? this.getCurrentStepData().clickableElements : []
        this.getCurrentStepData = () => this.currentStep in data.steps ? data.steps[this.currentStep] : null
        this.totalSteps = Object.keys(data.steps).length
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
        this.startInteractivity()
    }

    updateCurrentStep(newStep) {
        this.currentStep = newStep
        this.updateLocalStorage()
    }

    startInteractivity(initial = false) {
        this.camera.updateCameraTo(this.currentLocation())
        this.highlight.setHightlight(this.interactiveObjects())
        
        let video = this.currentVideo()
        
        if (this.stepType() == 'video') {
            setTimeout(function() {
                instance.video.load(video)
                instance.camera.zoomIn()

                setTimeout(function() {
                    instance.video.setFullscreenVideo()
                }, 5000, video)

            }, instance.camera.data.moveDuration, video)
        }
        else {
            instance.video.defocus()
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
        instance.camera.updateCameraTo(0)
        instance.updateIrisTexture('SLEEP')
        instance.world.finishJourney()
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
            this.video.stop()
            this.advance()
        }

        if (this.clickedObject === 'Panel_Cabels') {
            this.advance()
        }
    }

    currentVideo() {
        let localCurrentStep = this.currentStep
        while (!(localCurrentStep in data.steps) || !(data.steps[localCurrentStep].type == 'video'))
            localCurrentStep--

        return data.steps[localCurrentStep].videoId
    }

    updateLocalStorage() {
        localStorage.setItem(this.world.getId(), this.currentStep)
    }

    updateIrisTexture(mode) {
        instance.world.controlRoom.setTexture(instance.resources.textureItems['BIEX_S01_E01_IRIS_'+mode].item, 90)
        let mesh = instance.world.controlRoom.textureObjects.filter((mesh) => { return mesh.name == 'tv_16x9_5_screen' })[0]
        mesh.material.map = instance.world.controlRoom.texture
    }
}