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
        instance = this
        instance.experience = new Experience()
        instance.resources = instance.experience.resources
        instance.world = instance.experience.world
        instance.camera = instance.experience.camera
        instance.highlight = instance.world.highlight
        instance.programData = instance.world.selectedChapter.program
        instance.points = instance.experience.world.points
        instance.debug = instance.experience.debug

        instance.archive = new Archive()
        instance.taskDescription = new TaskDescription()
        instance.video = new Video()
        instance.codeUnlock = new CodeUnlock()
        instance.pictureAndCode = new PictureAndCode()
        instance.questionAndCode = new QuestionAndCode()
        instance.questions = new Questions()
        instance.quiz = new Quiz()
        instance.congrats = new Congrats()
        instance.pause = new Pause()
        instance.dialogue = new Dialogue()
        instance.message = new Message()
        instance.gameDescription = new GameDescription()

        instance.gamesData = {
            pictureAndCode: {
                circles: []
            }
        }

        // Get instance variables
        instance.chapterProgress = () => parseInt(localStorage.getItem(instance.world.getId())) || 0
        instance.currentCheckpoint = instance.debug.onQuickLook() ? 0 : (instance.chapterProgress() || 0)
        instance.getCurrentCheckpointData = () => instance.currentCheckpoint in instance.programData ? instance.programData[instance.currentCheckpoint] : null

        instance.currentStep = 0
        instance.getCurrentStepData = () => instance.getCurrentCheckpointData() ? instance.getCurrentCheckpointData().steps[instance.currentStep] : null
        instance.stepType = () => instance.getCurrentStepData() ? instance.getCurrentStepData().details.step_type : null
        instance.taskType = () => instance.getCurrentStepData() ? instance.getCurrentStepData().details.task_type : null

        instance.updateAssetInProgramData = (field, newValue) => {
            console.log(field, newValue)
            instance.programData[instance.currentCheckpoint].steps[instance.currentStep][field] = newValue
        }

        instance.currentLocation = () => {
            if (instance.stepType() == 'video') { return 'portal' }
            else if (instance.stepType() == 'iris') { return 'irisCloseLook' }
            else if (instance.stepType() == 'task') { return 'irisWithOptions' }
            else { return 'default' }
        }
        instance.interactiveObjects = () => instance.getCurrentStepData() ? instance.getAllInteractiveObjects() : []
        instance.totalCheckpoints = Object.keys(instance.programData).length
        instance.clickedObject = null
        instance.canClick = () =>
            !document.body.classList.contains('freeze') &&
            !document.body.classList.contains('modal-on') &&
            !document.body.classList.contains('camera-is-moving')

        instance.toggleStep()
        instance.addEventListeners()
    }

    addEventListeners() {
        instance.experience.navigation.prev.addEventListener('click', instance.previousStep)
        instance.experience.navigation.next.addEventListener('click', instance.nextStep)
    }

    control(currentIntersect) {
        if (!instance.canClick()) return

        instance.clickedObject = currentIntersect.name

        if (instance.objectIsClickable()) {
            instance.startAction()
        }
    }

    previousStep() {
        instance.currentStep--
        console.log('previousStep', instance.currentStep)
        instance.toggleStep()
    }

    nextStep() {
        instance.currentStep++
        console.log('nextStep', instance.currentStep)
        instance.toggleStep()
    }

    toggleStep() {
        // Disable prev on first step - Enable otherwise
        instance.experience.navigation.prev.disabled = instance.currentStep == 0

        instance.stepType() == 'iris' || instance.taskType() == 'dialog'
            ? instance.world.progressBar?.hide()
            : instance.world.progressBar?.show()

        // Advance to next checkpoint
        if (instance.currentStep == instance.getCurrentCheckpointData().steps.length) {
            instance.nextCheckpoint()
        }
        else {
            instance.startInteractivity()
        }
    }

    nextCheckpoint(checkpoint = ++instance.currentCheckpoint) {
        console.log('nextCheckpoint', checkpoint)
        console.log('currentStep', 0)

        instance.points.fadeOut()
        instance.highlight.fadeOut()

        instance.world.audio.playSound('whoosh-between-screens')
        instance.currentStep = 0
        instance.experience.navigation.prev.disabled = true

        instance.updateCurrentCheckpoint(checkpoint)
        instance.world.progressBar.refresh()

        instance.startInteractivity()
    }

    startInteractivity() {
        if (instance.stepType() == 'video') {
            instance.updateCameraForCurrentStep(() => {
                instance.experience.navigation.next.disabled = true
                instance.world.controlRoom.tv_portal.scale.set(1, 1, 1)
                instance.video.load(instance.currentVideo())
            })
        }
        else {
            instance.updateCameraForCurrentStep(() => {
                instance.video.defocus()
                instance.world.controlRoom.tv_portal.scale.set(0, 0, 0)
                instance.video.setTexture(instance.nextVideo())

                if (instance.stepType() == 'iris') {
                    instance.message.show()
                }
            })

            if (instance.stepType() == 'task') {
                if (instance.taskType() == 'code_to_unlock') {
                    instance.codeUnlock.toggleCodeUnlock()
                }

                else if (instance.taskType() == 'picture_and_code') {
                    instance.pictureAndCode.togglePictureAndCode()
                }

                else if (instance.taskType() == 'question_and_code') {
                    instance.questionAndCode.toggleQuestionAndCode()
                }

                else if (instance.taskType() == 'questions') {
                    instance.questions.toggleQuestions()
                }

                else if (instance.taskType() == 'dialog') {
                    instance.dialogue.toggle()
                }

                // Games
                else if (instance.taskType() == 'cables'
                    || instance.taskType() == 'sorting'
                    || instance.taskType() == 'simon_says'
                    || instance.taskType() == 'flip_cards'
                    || instance.taskType() == 'heart_defense'
                    || instance.taskType() == 'davids_refuge'
                ) {
                    instance.gameDescription.show()
                }
            }

            else if (instance.stepType() == 'quiz') {
                instance.quiz.toggleQuiz()
            }

            else if (instance.stepType() == 'pause') {
                instance.pause.togglePause()
            }
        }

        // Finish program
        if (instance.currentCheckpoint == instance.totalCheckpoints) {
            instance.updateCameraForCurrentStep(instance.congrats.toggleBibleCardsReminder)
        }
    }

    updateCurrentCheckpoint(newCheckpoint) {
        instance.currentCheckpoint = newCheckpoint

        if (newCheckpoint > instance.chapterProgress() && !instance.debug.onQuickLook())
            instance.updateLocalStorage()
    }

    updateCameraForCurrentStep(callback = () => {}) {
        instance.camera.updateCameraTo(instance.currentLocation(), () => {
            instance.points.add(instance.interactiveObjects()[0], instance.stepType())
            instance.highlight.add(instance.interactiveObjects()[0])

            callback()

            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('label')) {
                    instance.control(instance.points.currentLabel)
                }
            })
        })
    }

    objectIsClickable() {
        return instance.currentCheckpoint in instance.programData &&
            instance.interactiveObjects().includes(instance.clickedObject)
    }

    getAllInteractiveObjects() {
        let interactiveObjects = []

        if (instance.stepType() == 'video') {
            interactiveObjects = interactiveObjects.concat(["Screen"])
        }
        else if (instance.stepType() == 'iris' || instance.stepType() == 'task') {
            interactiveObjects.push("tv_16x9_screen")
        }

        return interactiveObjects
    }

    startAction() {
        if (instance.clickedObject == 'tv_16x9_screen') {
            instance.message.show()
        }
        else if (instance.clickedObject == 'Screen') {
            instance.video.play()
        }
    }

    currentVideo() {
        if (instance.currentCheckpoint >= instance.programData.length)
            return null

        return instance.programData[instance.currentCheckpoint].steps[instance.currentStep].videoId
    }

    nextVideo() {
        for (let checkpoint = instance.currentCheckpoint; checkpoint < instance.totalCheckpoints; checkpoint++) {
            const startingStep = checkpoint == instance.currentCheckpoint ? instance.currentStep : 0

            for (let step = startingStep; step < instance.programData[checkpoint].steps.length; step++) {
                if (instance.programData[checkpoint].steps[step].details.step_type == 'video')
                    return instance.programData[checkpoint].steps[step].videoId
            }
        }

        return null
    }

    updateLocalStorage() {
        localStorage.setItem(instance.world.getId(), instance.currentCheckpoint)
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener('click', instance.previousStep)
        instance.experience.navigation.next.removeEventListener('click', instance.nextStep)
    }

    destroy() {
        instance.removeEventListeners()
        instance.message.destroy()
        instance.dialogue.destroy()
    }
}