import Experience from "../Experience.js"
import Archive from '../Extras/Archive.js'
import TaskDescription from '../Extras/TaskDescription.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import CodeAndIris from '../Extras/CodeAndIris.js'
import PictureAndCode from '../Extras/PictureAndCode.js'
import QuestionAndCode from '../Extras/QuestionAndCode.js'
import Questions from '../Extras/Questions.js'
import Video from '../Extras/Video.js'
import SortingGame from '../Games/SortingGame.js'
import CableConnectorGame from '../Games/CableConnectorGame.js'
import SimonSaysGame from '../Games/SimonSaysGame.js'
import Quiz from '../Extras/Quiz.js'
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
        this.taskDescription = new TaskDescription()
        this.video = new Video()
        this.codeUnlock = new CodeUnlock()
        this.codeAndIris = new CodeAndIris()
        this.pictureAndCode = new PictureAndCode()
        this.questionAndCode = new QuestionAndCode()
        this.questions = new Questions()
        this.sortingGame = new SortingGame()
        this.cableConnectorGame = new CableConnectorGame()
        this.simonSays = new SimonSaysGame()
        this.quiz = new Quiz()
        this.congrats = new Congrats()

        instance = this

        instance.gamesData = {
            pictureAndCode: {
                circles: []
            }
        }

        // Get instance variables
        this.chapterProgress = () => parseInt(localStorage.getItem(this.world.getId())) || 0
        this.currentStep = this.chapterProgress() || 0
        this.getCurrentStepData = () => this.currentStep in this.programData ? this.programData[this.currentStep] : null
        this.stepType = () => this.getCurrentStepData() ? this.getCurrentStepData().type : null
        this.currentLocation = () => {
            if (this.stepType() == 'video') { return 'portal' }
            else if (this.stepType() == 'iris' || this.stepType() == 'task') { return 'screens' }
            else { return 'default' }
        }
        this.interactiveObjects = () => this.getCurrentStepData() ? this.getAllInteractiveObjects() : []
        this.totalSteps = Object.keys(this.programData).length
        this.clickedObject = null
        this.canClick = () =>
            !document.body.classList.contains('freeze') &&
            !document.body.classList.contains('modal-on') &&
            !document.body.classList.contains('camera-is-moving')

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
        this.startInteractivity()
    }

    updateCurrentStep(newStep) {
        this.currentStep = newStep

        if (newStep > this.chapterProgress() && !document.body.classList.contains('quick-look-mode')) {
            this.updateLocalStorage()
        }
    }

    startInteractivity() {
        this.world.audio.playWhoosh()
        let currentVideo = this.currentVideo()
        let nextVideo = this.nextVideo()

        this.points.fadeOut()
        this.highlight.fadeOut()

        this.camera.updateCameraTo(this.currentLocation(), () => {
            instance.points.add(this.interactiveObjects()[0], instance.stepType())
            instance.highlight.add(this.interactiveObjects()[0])

            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('label')) {
                    this.control(instance.points.currentLabel)
                }
            })
        })

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
                instance.congrats.toggleBibleCardsReminder()
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
        }
        else if (this.stepType() == 'iris' || this.stepType() == 'task') {
            interactiveObjects.push("tv_16x9_screen")
        }

        return interactiveObjects
    }

    startAction() {
        if (this.clickedObject == 'tv_16x9_screen') {
            this.taskDescription.toggleTaskDescription()
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
}