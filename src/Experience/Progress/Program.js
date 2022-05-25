import Experience from "../Experience.js"
import Archive from '../Extras/Archive.js'
import Timer from '../Extras/Timer.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import Questions from '../Extras/Questions.js'
import TaskDescription from '../Extras/TaskDescription.js'
import Video from '../Extras/Video.js'
import SortingGame from '../Games/SortingGame.js'
import Congrats from '../Extras/Congrats.js'

let instance = null

export default class Program {
    constructor() {
        this.initialize()
    }

    initialize() {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.world = this.experience.world
        this.camera = this.experience.camera
        this.highlight = this.world.highlight
        this.programData = this.world.selectedChapter.program
        this.points = this.experience.world.points
        this.debug = this.experience.debug

        this.archive = new Archive()
        this.timer = new Timer()
        this.codeUnlock = new CodeUnlock()
        this.questions = new Questions()
        this.taskDescription = new TaskDescription()
        this.video = new Video()
        this.sortingGame = new SortingGame()
        this.congrats = new Congrats()

        instance = this

        // Get instance variables
        this.chapterProgress = () => localStorage.getItem(this.world.getId())
        this.currentStep = this.chapterProgress() || 0
        this.getCurrentStepData = () => this.currentStep in this.programData ? this.programData[this.currentStep] : null
        this.stepType = () => this.getCurrentStepData() ? this.getCurrentStepData().type : null
        this.currentLocation = () => {
            if (this.stepType() == 'video') { return 'portal' }
            else if (this.stepType() == 'iris' || this.stepType() == 'task') { return 'screens' }
            else { return 'default' }
        }
        this.customInteractiveObjs = []
        this.interactiveObjects = () => this.getCurrentStepData() ? this.getAllInteractiveObjects() : []
        this.totalSteps = Object.keys(this.programData).length
        this.clickedObject = null
        this.canClick = () =>
            !document.body.classList.contains('freeze') &&
            !document.body.classList.contains('modal-on')

        this.startInteractivity()
    }

    control(currentIntersect) {
        if (!this.canClick()) return

        this.clickedObject = currentIntersect.name

        if (this.objectIsClickable()) {
            this.startAction()
        }
    }

    advance(step = ++this.currentStep) {
        this.updateCurrentStep(step)
        this.world.progressBar.refresh()
        this.resetCustomInteractiveObjs()
        this.startInteractivity()
    }

    updateCurrentStep(newStep) {
        this.currentStep = newStep

        if (newStep > this.chapterProgress())
            this.updateLocalStorage()
    }

    startInteractivity() {
        this.world.audio.playWhoosh()
        let currentVideo = this.currentVideo()
        let nextVideo = this.nextVideo()

        this.camera.updateCameraTo(this.currentLocation(), instance.points.add(this.interactiveObjects()[0], instance.stepType()))
        this.highlight.add(this.interactiveObjects()[0])

        if (this.stepType() == 'video') {
            setTimeout(function () {
                instance.video.load(currentVideo)
            }, instance.camera.data.moveDuration, currentVideo)
        }
        else {
            instance.video.defocus()

            setTimeout(function () {
                instance.video.setTexture(nextVideo)
            }, instance.camera.data.moveDuration, nextVideo)
        }

        if (this.currentStep == this.totalSteps) {
            setTimeout(() => {
                instance.congrats.toggleCongrats()
            

            }, instance.camera.data.moveDuration)
        }
    }

    objectIsClickable() {
        return this.currentStep in this.programData &&
            this.interactiveObjects().includes(this.clickedObject)
    }

    getAllInteractiveObjects() {
        let interactiveObjects = []

        if (this.stepType() == 'video') {
            interactiveObjects = interactiveObjects.concat(["panel_screen"])

            if (this.debug.active) {
                interactiveObjects = interactiveObjects.concat(["panel_time_switchers_holder"])
            }
        }
        else if (this.stepType() == 'iris' || this.stepType() == 'task') {
            interactiveObjects.push("tv_16x9_screen")
        }

        if (this.customInteractiveObjs.length)
            return this.customInteractiveObjs

        return interactiveObjects
    }

    addCustomInteractiveObj(objectName) {
        this.customInteractiveObjs.push(objectName)
    }
    resetCustomInteractiveObjs() {
        this.customInteractiveObjs = []
    }

    startAction() {
        if (this.clickedObject == 'tv_16x9_screen') {
            this.taskDescription.toggleTaskDescription()
        }

        else if (this.clickedObject == 'panel_time_switchers_holder') {
            this.video.defocus()
            this.advance()
        }

        else if (this.clickedObject == 'panel_screen') {
            this.video.play()
        }
    }

    currentVideo() {
        let localCurrentStep = this.currentStep
        while (!(localCurrentStep in this.programData) || !(this.programData[localCurrentStep].type == 'video')) {
            if (localCurrentStep == 0) return null
            else localCurrentStep--
        }

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
        instance.world.controlRoom.setTexture('tv_16x9_screen', instance.resources.textureItems['BIEX_S01_E01_IRIS_' + mode].item)
    }
}