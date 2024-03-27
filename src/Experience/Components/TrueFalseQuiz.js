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

        this.handleAnswer = this.handleAnswer.bind(this)
        this.handleAudioPlay = this.handleAudioPlay.bind(this)
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
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.setHTML()
        instance.questionsAnsweredCorrectly = 0
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
            instance.currentQuestionIndex = 0 // Start with the first question
            instance.setHTMLForQuestion(instance.currentQuestionIndex)
        }
    }

    setHTMLForQuestion(index) {
        const question = instance.data.questions[index]
        const isValidMediaUrl = (url) => url && url !== 'false' && url.startsWith('http')
        const questionContent = question.type === 'image' && isValidMediaUrl(question.question_media) ? `<img src="${question.question_media}" alt="Question Image">` : `<p>${question.question_text}</p>`
        const audioButton = question.question_audio ? `<button class="audio-button button-cube-wider"><svg><use href="#volume-solid" fill="currentColor"></svg><span>Play Audio</span></button>` : ''

        const questionHTML = `
                <div class="question flex flex-col justify-center items-center gap-8" data-index="${index}" data-correct="${question.question_statement}">
                    ${audioButton}
                    <audio id="quizAudio" class="hidden sr-only" preload="auto" crossOrigin="anonymous"></audio>
                    ${questionContent}
                    <div class="flex gap-12 items-center">
                        <button class="answer-button" data-answer="false"></button>
                        <button class="answer-button" data-answer="true"></button>
                    </div>
                </div>`

        // Update only the dynamic part of the content
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

        // If there's an audio playing, stop it
        if (instance.quizAudio && !instance.quizAudio.paused) {
            instance.quizAudio.pause()
            instance.quizAudio.currentTime = 0 // Reset the audio playback to the start
            instance.audio.fadeInBgMusic()
        }

        const button = event.target
        const questionElement = button.closest('.question')
        const correctAnswer = questionElement.getAttribute('data-correct') === 'true'
        const userAnswer = button.getAttribute('data-answer') === 'true'

        if (userAnswer === correctAnswer) {
            // Correct answer logic here
            instance.audio.playSound('correct')
            instance.experience.celebrate({ particleCount: 100, spread: 160 })
            instance.questionsAnsweredCorrectly += 1
        } else {
            // Wrong answer logic here
            instance.audio.playSound('wrong')
        }

        // Immediately disable the answer buttons to prevent multiple answers
        questionElement.querySelectorAll('.answer-button').forEach((btn) => (btn.disabled = true))

        // Wait a bit before moving to the next question to allow for any feedback/display updates
        setTimeout(() => {
            instance.moveToNextQuestion()
        }, 500) // Adjust time as needed
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
            // quizAudio.pause()
            // quizAudio.currentTime = 0
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
        const gameContainer = instance.experience.interface.gameContainer

        gameContainer.addEventListener('click', (event) => {
            if (event.target.closest('.answer-button')) {
                this.handleAnswer(event)
            } else if (event.target.closest('.audio-button')) {
                this.handleAudioPlay(event)
            }
        })
    }

    destroy() {
        document.querySelector('#true-false-quiz')?.remove()

        instance.experience.setAppView('chapter')
        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button-arrow'

        // Reset any other states or data as needed
        instance.questionsAnsweredCorrectly = 0
    }
}
