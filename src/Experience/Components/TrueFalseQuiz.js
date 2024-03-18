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

        console.log('true false quiz')
        console.log(instance.data)

        instance.experience.setAppView('game')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.setHTML()
        instance.attachEventListeners()

        instance.questionsAnsweredCorrectly = 0
    }

    setHTML() {
        if (!document.querySelector('#quiz-content')) {
            const staticHTML = `
            <div class="absolute inset-0 bg-bke-darkpurple grid place-content-center" id="true-false-quiz">
                <div class="relative mx-auto max-w-[1980px] px-4 pb-4 pt-24 tv:gap-8 tv:px-8 tv:pt-32">
                    ${instance.data.title ? `<h1 class="text-2xl tv:text-3xl font-bold text-center mb-4">${instance.data.title}</h1>` : ''}
                    ${instance.data.description ? `<p class="text-xl text-center">${instance.data.description}</p>` : ''}
                    <div id="quiz-content" class="mt-24"></div> <!-- Container for dynamic question content -->
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
        const questionContent = question.type === 'image' && isValidMediaUrl(question.question_media) ? `<img src="${question.question_media}" alt="Question Image">` : `<p class="text-4xl">${question.question_text}</p>`
        const audioButton = question.question_audio ? `<button class="audio-button button-normal" data-audio="${question.question_audio.url}">Play Audio</button>` : ''

        const questionHTML = `
                <div class="question flex flex-col justify-center items-center gap-8" data-index="${index}" data-correct="${question.question_statement}">
                    ${audioButton}
                    ${questionContent}
                    <div class="flex gap-12 items-center">
                        <button class="answer-button h-24 w-24 bg-red-600" data-answer="false">No</button>
                        <button class="answer-button h-24 w-24 bg-green-600" data-answer="true">Yes</button>
                    </div>
                </div>`

        // Update only the dynamic part of the content
        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = questionHTML
        instance.attachEventListeners() // Reattach event listeners for the new content
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

        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
    }

    handleAudioPlay(event) {
        const button = event.target
        const audioUrl = button.getAttribute('data-audio')

        // Fade out background music
        instance.audio.fadeOutBgMusic()

        // If there's already an audio playing, pause it and reset the current time
        if (instance.quizAudio && !instance.quizAudio.paused) {
            instance.quizAudio.pause()
            instance.quizAudio.currentTime = 0 // Reset the audio playback to the start
        }

        // Initialize the quiz audio with the new URL
        instance.quizAudio = new Audio(audioUrl)
        instance.quizAudio.play()

        // Once the quiz audio ends, fade in the background music
        instance.quizAudio.onended = () => {
            instance.audio.fadeInBgMusic()
        }
    }

    attachEventListeners() {
        instance.answerListeners = []
        instance.audioListeners = []

        const answerButtons = document.querySelectorAll('.answer-button')
        answerButtons.forEach((button) => {
            button.removeEventListener('click', this.handleAnswer)
            button.addEventListener('click', this.handleAnswer)
        })

        const audioButtons = document.querySelectorAll('.audio-button')
        audioButtons.forEach((button) => {
            button.removeEventListener('click', this.handleAudioPlay)
            button.addEventListener('click', this.handleAudioPlay)
        })
    }

    destroy() {
        instance.answerListeners.forEach(({ button, listener }) => {
            button.removeEventListener('click', listener)
        })

        instance.audioListeners.forEach(({ button, listener }) => {
            button.removeEventListener('click', listener)
        })

        // Clear references to prevent memory leaks
        instance.answerListeners = []
        instance.audioListeners = []

        document.querySelector('#true-false-quiz')?.remove()

        instance.experience.setAppView('chapter')
        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'

        // Reset any other states or data as needed
        instance.questionsAnsweredCorrectly = 0
    }
}
