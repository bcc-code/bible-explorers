import Experience from '../Experience.js'
import Archive from '../Components/Archive.js'
import CodeUnlock from '../Components/CodeUnlock.js'
import HiddenItems from '../Games/HiddenItems.js'
import QuestionAndCode from '../Extras/QuestionAndCode.js'
import Video from '../Extras/Video.js'
import Quiz from '../Components/Quiz.js'
import MultipleChoiceWithPicture from '../Extras/MultipleChoiceWithPicture.js'
import VideoWithQuestion from '../Extras/VideoWithQuestion.js'
import Congrats from '../Extras/Congrats.js'
import Pause from '../Extras/Pause.js'
import Dialogue from '../Components/Dialogue.js'
import Message from '../Components/Message.js'
import GameDescription from '../Components/GameDescription.js'
import ConfirmationScreen from '../Components/ConfirmationScreen.js'
import WaitingScreen from '../Components/WaitingScreen.js'
import _e from '../Utils/Events.js'
import TaskDescriptionScreen from '../Components/TaskDescriptionScreen.js'
import TaskDescriptionWithCalculatorScreen from '../Components/TaskDescriptionWithCalculatorScreen.js'
import MessageWithSupportingScreens from '../Components/MessageWithSupportingScreens.js'
import SingleChoice from '../Components/SingleChoice.js'
import TrueFalsQuiz from '../Components/TrueFalseQuiz.js'

let instance = null

export default class Program {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.resources = instance.experience.resources
        instance.world = instance.experience.world
        instance.offline = instance.world.offline
        instance.programData = instance.world.selectedChapter.program
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug

        instance.archive = new Archive()

        instance.video = new Video()
        instance.videosLoaded = 0

        instance.codeUnlock = new CodeUnlock()
        instance.pictureAndCode = new HiddenItems()
        instance.questionAndCode = new QuestionAndCode()
        instance.quiz = new Quiz()
        instance.multipleChoiceWithPicture = new MultipleChoiceWithPicture()
        instance.videoWithQuestion = new VideoWithQuestion()
        instance.congrats = new Congrats()
        instance.pause = new Pause()
        instance.dialogue = new Dialogue()
        instance.message = new Message()
        instance.messageWithSupportingScreens = new MessageWithSupportingScreens()
        instance.gameDescription = new GameDescription()
        instance.confirmationScreen = new ConfirmationScreen()
        instance.waitingScreen = new WaitingScreen()
        instance.taskDescriptionScreen = new TaskDescriptionScreen()
        instance.taskDescriptionWithCalculatorScreen = new TaskDescriptionWithCalculatorScreen()
        instance.singleChoice = new SingleChoice()
        instance.quizTrueFalse = new TrueFalsQuiz()

        instance.gamesData = {
            pictureAndCode: {
                circles: [],
            },
        }

        // Get instance variables
        instance.chapterProgress = () => 0
        instance.currentCheckpoint = 0
        instance.getCurrentCheckpointData = () => (instance.currentCheckpoint in instance.programData ? instance.programData[instance.currentCheckpoint] : null)

        instance.currentStep = 0
        instance.getCurrentStepData = () => (instance.getCurrentCheckpointData() ? instance.getCurrentCheckpointData().steps[instance.currentStep] : null)

        instance.stepType = () => (instance.getCurrentStepData() ? instance.getCurrentStepData().details.step_type : null)
        instance.taskType = () => (instance.getCurrentStepData() ? instance.getCurrentStepData().details.task_type : null)

        instance.updateAssetInProgramData = (field, newValue) => {
            instance.programData[instance.currentCheckpoint].steps[instance.currentStep][field] = newValue
        }

        instance.totalCheckpoints = Object.keys(instance.programData).length
        instance.clickCallback = () => {}
        instance.canClick = () => !document.body.classList.contains('freeze') && !document.body.classList.contains('modal-on') && !document.body.classList.contains('camera-is-moving')

        instance.addEventListeners()
        document.addEventListener(_e.ACTIONS.VIDEO_LOADED, instance.startJourneyWhenVideoIsLoaded)
    }

    startJourneyWhenVideoIsLoaded() {
        let videoId = 'texture-'

        if (instance.currentCheckpoint == 0 && instance.world.selectedChapter.lobby_video_loop) {
            videoId += instance.world.selectedChapter.lobby_video_loop
        } else if (instance.stepType() === 'iris') {
            instance.stepData = instance.data = instance.stepData.message

            videoId += instance.getCurrentStepData().message.video
        } else if (instance.stepType() === 'iris_with_supporting_screens') {
            videoId += instance.getCurrentStepData().message_with_supporting_screens.video
        }

        if (!instance.videoPlayerLoaded(videoId)) {
            return
        }
        document.removeEventListener(_e.ACTIONS.VIDEO_LOADED, instance.startJourneyWhenVideoIsLoaded)

        instance.startInteractivity()
    }

    videoPlayerLoaded(id) {
        return instance.resources.videoPlayers.hasOwnProperty(id)
    }

    addEventListeners() {
        instance.experience.navigation.prev.addEventListener('click', instance.previousStep)
        instance.experience.navigation.next.addEventListener('click', instance.nextStep)
    }

    previousStep() {
        if (instance.currentCheckpoint == 0 && instance.currentStep == 0) {
            if (!!document.getElementById('waitingScreen') || !instance.world.selectedChapter.lobby_video_loop) {
                instance.world.goHome()
            } else {
                instance.waitingScreen.show()
            }

            return
        }

        instance.currentStep--

        if (instance.currentStep < 0) {
            instance.toggleStep()
            return
        }

        instance.toggleStep()
    }

    nextStep() {
        instance.currentStep++
        instance.toggleStep()
    }

    toggleStep() {
        if (instance.currentStep < 0) {
            // Back to previous checkpoint
            instance.previousCheckpoint()
            instance.stepToggled()
            instance.startInteractivity()
        } else {
            if (instance.currentStep == instance.getCurrentCheckpointData()?.steps.length) {
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
        if (instance.stepType() === 'video') {
            instance.video.load(instance.currentVideo())
        } else {
            if (instance.stepType() === 'iris') {
                instance.message.show()
            } else if (instance.stepType() === 'iris_with_supporting_screens') {
                instance.messageWithSupportingScreens.show()
            } else if (instance.stepType() === 'task') {
                if (instance.taskType() === 'code_to_unlock') {
                    instance.codeUnlock.toggleCodeUnlock()
                } else if (instance.taskType() === 'picture_and_code') {
                    instance.pictureAndCode.togglePictureAndCode()
                } else if (instance.taskType() === 'question_and_code') {
                    instance.questionAndCode.toggleQuestionAndCode()
                } else if (instance.taskType() === 'questions') {
                    // instance.questions.toggleQuestions()
                } else if (instance.taskType() === 'dialog') {
                    instance.dialogue.toggle()
                } else if (instance.taskType() === 'truefalse_quiz') {
                    instance.quizTrueFalse.show()
                } else if (instance.taskType() === 'single_choice') {
                    instance.singleChoice.show()
                }

                // Games
                else if (['cables', 'sorting', 'simon_says', 'flip_cards', 'choose_new_king', 'heart_defense', 'davids_refuge', 'labyrinth', 'duck_game'].includes(instance.taskType())) {
                    instance.gameDescription.show()
                } else if (instance.taskType() === 'multiple_choice_with_picture') {
                    instance.multipleChoiceWithPicture.show()
                } else if (instance.taskType() === 'video_with_question') {
                    instance.videoWithQuestion.toggleVideoWithQuestion()
                } else if (instance.taskType() === 'confirmation_screen') {
                    instance.confirmationScreen.show()
                } else if (instance.taskType() === 'task_description_screen') {
                    instance.taskDescriptionScreen.show()
                } else if (instance.taskType() === 'calculator_screen') {
                    instance.taskDescriptionWithCalculatorScreen.show()
                }
            } else if (instance.stepType() === 'quiz') {
                instance.quiz.toggleQuiz()
            } else if (instance.stepType() === 'pause') {
                instance.pause.togglePause()
            }
        }

        // Check if it was the last step in the last checkpoint
        if (instance.currentCheckpoint == instance.totalCheckpoints) {
            instance.congrats.toggleBibleCardsReminder()
        }
    }

    previousCheckpoint() {
        instance.updateCurrentCheckpoint(--instance.currentCheckpoint)
        instance.currentStep = instance.programData[instance.currentCheckpoint]?.steps.length - 1
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
    }

    startInteractivity() {
        if (instance.currentCheckpoint == 0 && instance.world.selectedChapter.lobby_video_loop) {
            instance.waitingScreen.show()
            return
        }

        if (instance.stepType() !== 'video') {
            instance.video.defocus()
        }

        if (instance.stepType() === 'iris') {
            instance.message.show()
        } else if (instance.stepType() === 'iris_with_supporting_screens') {
            instance.messageWithSupportingScreens.show()
        } else {
            instance.startTask()
        }
    }

    currentVideo() {
        if (instance.currentCheckpoint >= instance.programData.length) return null

        return instance.programData[instance.currentCheckpoint].steps[instance.currentStep].videoId
    }

    nextVideo() {
        for (let checkpoint = instance.currentCheckpoint; checkpoint < instance.totalCheckpoints; checkpoint++) {
            const startingStep = checkpoint == instance.currentCheckpoint ? instance.currentStep : 0

            for (let step = startingStep; step < instance.programData[checkpoint].steps.length; step++) {
                if (instance.programData[checkpoint].steps[step].details.step_type == 'video') return instance.programData[checkpoint].steps[step].videoId
            }
        }

        return null
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener('click', instance.previousStep)
        instance.experience.navigation.next.removeEventListener('click', instance.nextStep)

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.disablePrevBtnOnStart)
    }

    destroy() {
        instance.removeEventListeners()
        instance.message.destroy()
        instance.messageWithSupportingScreens.destroy()
        instance.dialogue.destroy()
    }
}
