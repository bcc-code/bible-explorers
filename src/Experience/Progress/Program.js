import Experience from "../Experience.js"
import Archive from '../Components/Archive.js'
import CodeUnlock from '../Components/CodeUnlock.js'
import HiddenItems from '../Games/HiddenItems.js'
import QuestionAndCode from '../Extras/QuestionAndCode.js'
import Video from '../Extras/Video.js'
import Quiz from '../Components/Quiz.js'
import Congrats from '../Extras/Congrats.js'
import Pause from '../Extras/Pause.js'
import Dialogue from '../Components/Dialogue.js'
import Message from '../Components/Message.js'
import GameDescription from '../Components/GameDescription.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Program {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.resources = instance.experience.resources
        instance.world = instance.experience.world
        instance.programData = instance.world.selectedChapter.program
        instance.camera = instance.experience.camera
        instance.points = instance.world.points
        instance.highlight = instance.world.highlight
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug

        instance.archive = new Archive()
        instance.video = new Video()
        instance.codeUnlock = new CodeUnlock()
        instance.pictureAndCode = new HiddenItems()
        instance.questionAndCode = new QuestionAndCode()
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
        instance.currentCheckpoint = instance.debug.onPreviewMode() ? 0 : (instance.chapterProgress() || 0)
        instance.getCurrentCheckpointData = () => instance.currentCheckpoint in instance.programData ? instance.programData[instance.currentCheckpoint] : null

        instance.currentStep = 0
        instance.getCurrentStepData = () => instance.getCurrentCheckpointData() ? instance.getCurrentCheckpointData().steps[instance.currentStep] : null
        instance.stepType = () => instance.getCurrentStepData() ? instance.getCurrentStepData().details.step_type : null
        instance.taskType = () => instance.getCurrentStepData() ? instance.getCurrentStepData().details.task_type : null

        instance.updateAssetInProgramData = (field, newValue) => {
            instance.programData[instance.currentCheckpoint].steps[instance.currentStep][field] = newValue
        }

        instance.currentLocation = () => {
            if (instance.stepType() == 'video') { return 'portal' }
            else if (instance.stepType() == 'iris') { return 'irisCloseLook' }
            else if (instance.stepType() == 'task') {
                // Games
                if (instance.taskType() == 'cables'
                    || instance.taskType() == 'sorting'
                    || instance.taskType() == 'simon_says'
                    || instance.taskType() == 'flip_cards'
                    || instance.taskType() == 'heart_defense'
                    || instance.taskType() == 'davids_refuge'
                ) {
                    return 'irisCloseLook'
                }
                else {
                    return 'irisWithOptions'
                }
            }
            else { return 'default' }
        }
        instance.interactiveObjects = () => instance.getCurrentStepData() ? instance.getAllInteractiveObjects() : []
        instance.totalCheckpoints = Object.keys(instance.programData).length
        instance.clickedObject = null
        instance.clickCallback = () => { }
        instance.canClick = () =>
            !document.body.classList.contains('freeze') &&
            !document.body.classList.contains('modal-on') &&
            !document.body.classList.contains('camera-is-moving')

        instance.startInteractivity()
        instance.addEventListeners()
        instance.stepToggled()
    }

    addEventListeners() {
        instance.experience.navigation.prev.addEventListener('click', instance.previousStep)
        instance.experience.navigation.next.addEventListener('click', instance.nextStep)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.removeInteractivity)
    }

    previousStep() {
        // If there is a multi-action step, go to the first step of the checkpoint instead of going to the previous step
        if (instance.points.previousLabel) {
            instance.goToCheckpoint(instance.currentCheckpoint)
            instance.points.delete()
            return
        }

        instance.currentStep--
        instance.toggleStep()
    }

    nextStep() {
        // If there is any clickable item, trigger the action instead of going to the next step
        if (instance.points.currentLabel) {
            instance.control(instance.points.currentLabel)
            instance.points.delete()
            return
        }

        instance.currentStep++
        instance.toggleStep()
    }

    toggleStep() {
        instance.world.progressBar.hide()

        if (instance.currentStep < 0) {
            // Back to previous checkpoint
            instance.previousCheckpoint()
            instance.stepToggled()
            instance.startInteractivity()
        } else {
            if (instance.currentStep == instance.getCurrentCheckpointData().steps.length) {
                // Advance to next checkpoint
                instance.nextCheckpoint()
                instance.stepToggled()
                instance.startInteractivity()
            } else {
                // Start next task
                instance.stepToggled()
                instance.startTask()
            }
        }
    }

    stepToggled() {
        document.dispatchEvent(_e.EVENTS.STEP_TOGGLED)
    }

    startTask() {
        instance.experience.navigation.prev.disabled = instance.currentStep == 0
        instance.experience.navigation.next.disabled = false

        if (instance.stepType() == 'video') {
            instance.updateCameraForCurrentStep(() => {
                instance.highlight.add(instance.interactiveObjects()[0])
                instance.points.add(instance.interactiveObjects()[0], instance.stepType())
                instance.experience.navigation.next.disabled = true
                instance.video.load(instance.currentVideo())
                instance.world.controlRoom.tv_portal.scale.set(1, 1, 1)
            })
        }

        else {
            instance.updateCameraForCurrentStep(() => {
                instance.world.controlRoom.tv_portal.scale.set(0, 0, 0)
                instance.video.defocus()
                instance.video.setTexture(instance.nextVideo())
            })

            if (instance.stepType() == 'iris') {
                instance.getCurrentStepData().message.character == 'glitch'
                    ? instance.camera.updateCameraTo('irisWithOptions', instance.message.show)
                    : instance.message.show()
            }

            else if (instance.stepType() == 'task') {
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
                    // instance.questions.toggleQuestions()
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

        // Check if it was the last step in the last checkpoint
        if (instance.currentCheckpoint == instance.totalCheckpoints)
            instance.showBibleCards()
    }

    previousCheckpoint() {
        instance.updateCurrentCheckpoint(--instance.currentCheckpoint)
        instance.currentStep = instance.programData[instance.currentCheckpoint].steps.length - 1
    }

    nextCheckpoint() {
        instance.updateCurrentCheckpoint(++instance.currentCheckpoint)
        instance.currentStep = 0
    }

    goToCheckpoint(checkpoint) {
        instance.updateCurrentCheckpoint(checkpoint)
        instance.currentStep = 0

        instance.stepToggled()
        instance.startInteractivity()
    }

    updateCurrentCheckpoint(newCheckpoint) {
        instance.currentCheckpoint = newCheckpoint

        if (newCheckpoint > instance.chapterProgress() && !instance.debug.onPreviewMode())
            instance.updateLocalStorage()
    }

    startInteractivity() {
        instance.experience.navigation.prev.disabled = true
        instance.experience.navigation.next.disabled = true

        if (instance.stepType() == 'iris') {
            instance.camera.updateCameraTo('screens', () => {
                instance.world.progressBar.show()
                instance.highlight.add(instance.interactiveObjects()[0])
                instance.points.add(instance.interactiveObjects()[0], instance.stepType())

                instance.clickCallback = () => {
                    instance.world.progressBar.hide()
                    instance.experience.navigation.next.disabled = false
                }

                document.addEventListener('click', (event) => {
                    if (event.target.classList.contains('highlight-label'))
                        instance.control(instance.points.currentLabel)
                })
            })
        }

        else if (instance.stepType() == 'pause') {
            instance.camera.updateCameraTo('default', () => {
                instance.world.progressBar?.hide()
                instance.startTask()
            })
        }

        else {
            instance.world.progressBar?.hide()
            instance.startTask()
        }
    }

    control(currentIntersect) {
        if (!instance.canClick()) return

        instance.clickedObject = currentIntersect.name

        if (instance.objectIsClickable()) {
            instance.camera.updateCameraTo(this.currentLocation())
            instance.startAction()

            instance.experience.navigation.prev.disabled = false
            if (instance.skip) document.querySelector('[aria-label="prev step"]').disabled = false
        }
    }

    startAction() {
        if (instance.clickedObject == 'tv_16x9_screen') {
            instance.clickCallback()
            instance.clickCallback = () => { }
            instance.message.show()
        }
        else if (instance.clickedObject == 'Screen') {
            instance.video.play()
        }

        else if (instance.clickedObject == 'Switch') {
            instance.world.controlRoom.animations.actions.drag.play()
            instance.world.controlRoom.animations.mixer.addEventListener('finished', (e) => {
                instance.video.play()
                instance.world.controlRoom.animations.actions.drag.stop()
            })
        }

        instance.removeInteractivity()
    }

    showBibleCards() {
        instance.updateCameraForCurrentStep(instance.congrats.toggleBibleCardsReminder)
    }

    updateCameraForCurrentStep(callback = () => { }) {
        instance.camera.updateCameraTo(instance.currentLocation(), () => {
            callback()

            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('highlight-label')) {
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

            if (instance.currentCheckpoint != 6) {
                interactiveObjects.push("Screen")
            } else {

                const UA = navigator.userAgent;
                const isWebkit =
                    /\b(iPad|iPhone|iPod)\b/.test(UA) &&
                    /WebKit/.test(UA) &&
                    !/Edge/.test(UA) &&
                    !window.MSStream;

                if (isWebkit) {
                    interactiveObjects.push("Screen")
                } else {
                    interactiveObjects.push("Switch")
                }
            }
        }

        else if (instance.stepType() == 'iris' || instance.stepType() == 'task' && instance.currentStep == 0) {
            interactiveObjects.push("tv_16x9_screen")
        }

        return interactiveObjects
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

    removeInteractivity() {
        instance.highlight.fadeOut()
        instance.points.delete()
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