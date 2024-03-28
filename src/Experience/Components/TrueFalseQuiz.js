import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class TrueFalsQuiz {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.truefalse_quiz

        instance.experience.setAppView('game')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button-arrow'

        instance.setHTML()
        instance.questionsAnsweredCorrectly = 0

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHTML() {
        if (!document.querySelector('#quiz-content')) {
            const staticHTML = `
            <div class="absolute inset-0 grid place-content-center task-container" id="true-false-quiz">
                <div class="relative mx-auto task-container_box text-center">
                    ${instance.data.title ? `<h1 class="task-container_heading">${instance.data.title}</h1>` : ''}
                    ${instance.data.description ? `<p class="task-container_prompts">${instance.data.description}</p>` : ''}
                    <div id="quiz-content"></div> <!-- Container for dynamic question content -->
                </div>
            </div>`

            instance.experience.interface.gameContainer.innerHTML = staticHTML
        }

        if (instance.data.questions.length > 0) {
            instance.currentQuestionIndex = 0
            instance.setHTMLForQuestion(instance.currentQuestionIndex)
        }
    }

    setHTMLForQuestion(index) {
        const question = instance.data.questions[index]
        const isValidMediaUrl = (url) => url && url !== 'false' && url.startsWith('http')
        const questionContent = question.type === 'image' && isValidMediaUrl(question.question_media) ? `<img src="${question.question_media}" alt="Question Image">` : `<p>${question.question_text}</p>`
        const audioButton = question.question_audio ? `<button class="button-cube-wider" id="button-audio"><svg><use href="#volume-solid" fill="currentColor"></svg><span>Play Audio</span></button>` : ''

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
        instance.attachEventListeners()
    }

    moveToNextQuestion() {
        instance.currentQuestionIndex += 1

        if (instance.currentQuestionIndex < instance.data.questions.length) {
            instance.setHTMLForQuestion(instance.currentQuestionIndex)
        } else {
            instance.handleQuizCompletion()
        }
    }

    handleQuizCompletion() {
        const completionHTML = `<div class="quiz-completion-message">Quiz completed! You answered ${instance.questionsAnsweredCorrectly} out of ${instance.data.questions.length} questions correctly.</div>`
        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = completionHTML

        instance.experience.navigation.next.className = 'button-arrow'
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
        } else {
            instance.audio.playSound('wrong')
        }

        setTimeout(() => {
            instance.moveToNextQuestion()
        }, 500)
    }

    handleAudioPlay(event) {
        const questionIndex = event.target.closest('.question').getAttribute('data-index')
        const question = instance.data.questions[questionIndex]

        if (!question.question_audio) {
            console.error('No audio URL found for this question')
            return
        }

        const audioUrl = question.question_audio.url
        const button = event.target
        const quizAudio = document.getElementById('quizAudio')

        instance.audio.fadeOutBgMusic()

        if (quizAudio && !quizAudio.paused) {
            return
        }

        quizAudio.src = audioUrl

        button.disabled = true

        quizAudio.onplay = () => {
            button.disabled = false
        }

        quizAudio.onpause = () => {
            button.disabled = false
        }

        quizAudio.play().catch((e) => {
            console.error('Error playing audio:', e)
        })

        quizAudio.onended = () => {
            button.disabled = false
            instance.audio.fadeInBgMusic()
        }
    }

    attachEventListeners() {
        const answerButtons = document.querySelectorAll('.answer-button')
        const buttonAudio = document.getElementById('button-audio')

        buttonAudio.addEventListener('click', (event) => {
            instance.handleAudioPlay(event)
        })

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
        instance.experience.navigation.next.className = 'button-arrow'

        instance.questionsAnsweredCorrectly = 0
    }
}
