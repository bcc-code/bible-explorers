import Experience from "../Experience.js"
import Archive from '../Components/Archive.js'
import TaskDescription from '../Extras/TaskDescription.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import PictureAndCode from '../Extras/PictureAndCode.js'
import QuestionAndCode from '../Extras/QuestionAndCode.js'
import Questions from '../Extras/Questions.js'
import Video from '../Extras/Video.js'
import Quiz from '../Extras/Quiz.js'
import Congrats from '../Extras/Congrats.js'
import Pause from '../Extras/Pause.js'
import Dialogue from '../Components/Dialogue.js'
import Message from '../Components/Message.js'
import GameDescription from '../Components/GameDescription.js'

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
        this.pictureAndCode = new PictureAndCode()
        this.questionAndCode = new QuestionAndCode()
        this.questions = new Questions()
        this.quiz = new Quiz()
        this.congrats = new Congrats()
        this.pause = new Pause()
        this.dialogue = new Dialogue()
        this.message = new Message()
        this.gameDescription = new GameDescription()

        instance = this

        instance.gamesData = {
            pictureAndCode: {
                circles: []
            }
        }

        // Get instance variables
        this.chapterProgress = () => parseInt(localStorage.getItem(this.world.getId())) || 0
        this.currentCheckpoint = instance.debug.onQuickLook() ? 0 : (this.chapterProgress() || 0)
        this.getCurrentCheckpointData = () => this.currentCheckpoint in this.programData ? this.programData[this.currentCheckpoint] : null

        this.currentStep = 0
        this.getCurrentStepData = () => this.getCurrentCheckpointData() ? this.getCurrentCheckpointData().steps[this.currentStep] : null
        this.stepType = () => this.getCurrentStepData() ? this.getCurrentStepData().details.step_type : null
        this.taskType = () => this.getCurrentStepData() ? this.getCurrentStepData().details.task_type : null

        this.updateAssetInProgramData = (field, newValue) => {
            console.log(field, newValue)
            this.programData[this.currentCheckpoint].steps[this.currentStep][field] = newValue
        }

        this.currentLocation = () => {
            if (this.stepType() == 'video') { return 'portal' }
            else if (this.stepType() == 'iris') { return 'irisCloseLook' }
            else if (this.stepType() == 'task') { return 'irisWithOptions' }
            else { return 'default' }
        }
        this.interactiveObjects = () => this.getCurrentStepData() ? this.getAllInteractiveObjects() : []
        this.totalCheckpoints = Object.keys(this.programData).length
        this.clickedObject = null
        this.canClick = () =>
            !document.body.classList.contains('freeze') &&
            !document.body.classList.contains('modal-on') &&
            !document.body.classList.contains('camera-is-moving')

        this.startInteractivity()
        this.updateCameraForCurrentStep()

        // Disable prev on first step
        instance.experience.navigation.prev.disabled = this.currentStep == 0
    }

    control(currentIntersect) {
        if (!this.canClick()) return

        this.clickedObject = currentIntersect.name

        if (this.objectIsClickable()) {
            this.startAction()
        }
    }

    previousStep() {
        this.currentStep--
        console.log('previousStep', this.currentStep)
        this.toggleStep()
    }

    nextStep() {
        this.currentStep++
        console.log('nextStep', this.currentStep)
        this.toggleStep()
    }

    toggleStep() {
        console.log("steptype", this.stepType())
        console.log("tasktype", this.taskType())

        // Disable prev on first step
        instance.experience.navigation.prev.disabled = this.currentStep == 0

        let moveCamera = true

        // Advance to next checkpoint
        if (this.currentStep == this.getCurrentCheckpointData().steps.length) {
            console.log('currentStep', 0)
            this.currentStep = 0
            this.advance()
            instance.experience.navigation.prev.disabled = true
        }

        else if (this.stepType() == 'iris') {
            this.message.show()
        }

        else if (this.stepType() == 'task') {
            if (this.taskType() == 'code_to_unlock') {
                this.codeUnlock.toggleCodeUnlock()
            }

            else if (this.taskType() == 'picture_and_code') {
                this.pictureAndCode.togglePictureAndCode()
            }

            else if (this.taskType() == 'question_and_code') {
                this.questionAndCode.toggleQuestionAndCode()
            }

            else if (this.taskType() == 'questions') {
                this.questions.toggleQuestions()
            }

            else if (this.taskType() == 'dialog') {
                this.dialogue.toggle()
            }

            // Games
            else if (this.taskType() == 'cables'
                || this.taskType() == 'sorting'
                || this.taskType() == 'simon_says'
                || this.taskType() == 'flip_cards'
                || this.taskType() == 'heart_defense'
                || this.taskType() == 'davids_refuge'
            ) {
                moveCamera = false
                this.gameDescription.show()
            }
        }

        else if (this.stepType() == 'quiz') {
            this.quiz.toggleQuiz()
        }

        else if (this.stepType() == 'pause') {
            this.pause.togglePause()
        }

        if (moveCamera)
            this.updateCameraForCurrentStep()
    }

    advance(checkpoint = ++this.currentCheckpoint) {
        this.updateCurrentCheckpoint(checkpoint)
        this.world.progressBar.refresh()
        this.startInteractivity()

        console.log('advance', checkpoint)
    }

    updateCurrentCheckpoint(newCheckpoint) {
        console.log('updateCurrentCheckpoint', newCheckpoint)
        this.currentCheckpoint = newCheckpoint

        if (newCheckpoint > this.chapterProgress() && !instance.debug.onQuickLook()) {
            this.updateLocalStorage()
        }
    }

    startInteractivity() {
        this.world.audio.playWhoosh()
        let currentVideo = this.currentVideo()
        let nextVideo = this.nextVideo()

        this.points.fadeOut()
        this.highlight.fadeOut()

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

        if (this.currentCheckpoint == this.totalCheckpoints) {
            setTimeout(() => {
                instance.congrats.toggleBibleCardsReminder()
            }, instance.camera.data.moveDuration)
        }

        if (this.stepType() == 'iris') {
            setTimeout(() => {
                this.message.show()
            }, instance.camera.data.moveDuration)
        }

        if (this.stepType() == 'pause') {
            setTimeout(() => {
                this.pause.togglePause()
            }, instance.camera.data.moveDuration)
        }
    }

    updateCameraForCurrentStep() {
        this.camera.updateCameraTo(this.currentLocation(), () => {
            instance.points.add(this.interactiveObjects()[0], instance.stepType())
            instance.highlight.add(this.interactiveObjects()[0])

            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('label')) {
                    this.control(instance.points.currentLabel)
                }
            })
        })
    }

    objectIsClickable() {
        return this.currentCheckpoint in this.programData &&
            this.interactiveObjects().includes(this.clickedObject)
    }

    getAllInteractiveObjects() {
        let interactiveObjects = []

        if (this.stepType() == 'video') {
            interactiveObjects = interactiveObjects.concat(["Screen"])
        }
        else if (this.stepType() == 'iris' || this.stepType() == 'task') {
            interactiveObjects.push("tv_16x9_screen")
        }

        return interactiveObjects
    }

    startAction() {
        if (this.clickedObject == 'tv_16x9_screen') {
            this.message.show()
        }
        else if (this.clickedObject == 'Screen') {
            this.video.play()
        }
    }

    currentVideo() {
        if (this.currentCheckpoint >= this.programData.length)
            return null

        return this.programData[this.currentCheckpoint].steps[this.currentStep].videoId
    }

    nextVideo() {
        for (let checkpoint = this.currentCheckpoint; checkpoint < this.totalCheckpoints; checkpoint++) {
            const startingStep = checkpoint == this.currentCheckpoint ? this.currentStep : 0

            for (let step = startingStep; step < this.programData[checkpoint].steps.length; step++) {
                if (this.programData[checkpoint].steps[step].details.step_type == 'video')
                    return this.programData[checkpoint].steps[step].videoId
            }
        }

        return null
    }

    updateLocalStorage() {
        localStorage.setItem(this.world.getId(), this.currentCheckpoint)
    }
}