import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Frame from './Frame.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class TrueFalsQuiz {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.truefalse_quiz

        instance.experience.setAppView('task-description')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`

        instance.setHTML()
        instance.questionsAnsweredCorrectly = 0

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHTML() {
        if (!document.querySelector('#quiz-content')) {
            const taskHeading = new Frame({
                content: instance.data.title,
            })
            const taskContainerFrame = new Frame({
                content: `<div class="task-content">
                        <h5 class="task-heading">
                            ${taskHeading.getHtml()}
                        </h5>
                        ${instance.data.description ? `<p class="task-prompts">${instance.data.description}</p>` : ''}
                        <div id="quiz-content"></div>
                    </div>`,
            })
            const staticHTML = `<div class="task-container" id="true-false-quiz">
                ${taskContainerFrame.getHtml()}
            </div>`

            instance.experience.interface.tasksDescription.innerHTML = staticHTML
        }

        if (instance.data.questions.length > 0) {
            instance.currentQuestionIndex = 0
            instance.setHTMLForQuestion(instance.currentQuestionIndex)
        }
    }

    setHTMLForQuestion(index) {
        const question = instance.data.questions[index]
        const questionContent =
            question.type === 'image' && question.question_media
                ? `<div class="task-container_image" id="task-image"><img class="max-w-[580px]" src="${question.question_media}" alt="Question Image" /></div>`
                : `<p>${question.question_text}</p>`
        const audioButton =
            question.type === 'question' && question.question_audio
                ? `<button class="button button-rectangle-wide bigger" id="button-audio"><svg class="icon"><use href="#volume-solid" fill="currentColor"></svg><span>${_s.miniGames.playAudio}</span></button>`
                : ''

        const questionHTML = `
            <div class="question flex flex-col justify-center items-center gap-8" data-index="${index}" data-correct="${question.question_statement}">
                ${audioButton}
                <audio id="quizAudio" class="hidden sr-only" preload="auto" crossOrigin="anonymous"></audio>
                ${questionContent}
                <div class="flex gap-12 items-center">
                    <button class="answer-button" data-answer="false" id="answer-button-false"></button>
                    <button class="answer-button" data-answer="true" id="answer-button-true"></button>
                </div>
            </div>`

        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = questionHTML

        instance.useCorrectAssetsSrc(index)
        instance.attachEventListeners(index)
    }

    useCorrectAssetsSrc(index) {
        const question = instance.data.questions[index]

        if (question.question_media) {
            instance.offline.fetchChapterAsset(question, 'question_media', (data) => {
                const taskImage = document.querySelector('#task-image img')
                if (taskImage) taskImage.src = data.question_media
            })
        }
    }

    moveToNextQuestion() {
        instance.currentQuestionIndex += 1

        if (instance.currentQuestionIndex < instance.data.questions.length) {
            instance.setHTMLForQuestion(instance.currentQuestionIndex)
        } else {
            setTimeout(() => {
                instance.destroy()
                instance.program.nextStep()
            }, 500)
        }
    }

    handleQuizCompletion() {
        const prompt = document.querySelector('.task-container_prompts')
        prompt.innerText = 'Quiz completed!'

        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = ''

        instance.experience.navigation.next.innerText = ''
    }

    handleAnswer = (event) => {
        event.stopPropagation()

        const button = event.target
        const questionElement = button.closest('.question')
        questionElement.querySelectorAll('.answer-button').forEach((btn) => (btn.disabled = true))

        if (instance.quizAudio && !instance.quizAudio.paused) {
            instance.quizAudio.pause()
            instance.quizAudio.currentTime = 0
            instance.audio.fadeInBgMusic()
        }

        const correctAnswer = questionElement.getAttribute('data-correct') === 'true'
        const userAnswer = button.getAttribute('data-answer') === 'true'

        if (userAnswer === correctAnswer) {
            instance.audio.playSound('correct')
            instance.experience.celebrate({ particleCount: 100, spread: 160 })
            instance.questionsAnsweredCorrectly += 1

            setTimeout(() => {
                instance.moveToNextQuestion()
            }, 500)
        } else {
            instance.audio.playSound('wrong')
            questionElement.querySelectorAll('.answer-button').forEach((btn) => (btn.disabled = false))
        }
    }

    handleAudioPlay() {
        const quizAudio = document.getElementById('quizAudio')

        quizAudio.onplay = () => {
            instance.audio.fadeOutBgMusic()
        }

        quizAudio.onended = () => {
            quizAudio.currentTime = 0
            instance.audio.fadeInBgMusic()
        }

        if (!quizAudio.paused) {
            quizAudio.pause()
        } else {
            quizAudio.play().catch((e) => {
                console.error('Error playing audio:', e)
            })
        }
    }

    attachEventListeners(index) {
        const answerButtons = document.querySelectorAll('.answer-button')
        const buttonAudio = document.getElementById('button-audio')

        if (buttonAudio) {
            const question = instance.data.questions[index]

            if (!question.question_audio) {
                console.error('No audio URL found for this question')
                return
            }

            const quizAudio = document.getElementById('quizAudio')

            instance.offline.fetchChapterAsset(question, 'question_audio', (data) => {
                quizAudio.src = data.question_audio
            })

            buttonAudio.addEventListener('click', (event) => {
                instance.handleAudioPlay(event)
            })
        }

        if (answerButtons)
            answerButtons.forEach((button) => {
                button.addEventListener('click', (event) => {
                    instance.handleAnswer(event)
                    button.removeEventListener('click', instance.handleAnswer)
                })
            })
    }

    destroy() {
        document.querySelector('#true-false-quiz')?.remove()

        instance.experience.setAppView('chapter')
        instance.experience.navigation.next.innerHTML = ''

        instance.questionsAnsweredCorrectly = 0

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
