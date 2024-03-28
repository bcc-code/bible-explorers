import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Quiz {
    constructor() {
        if (instance) {
            return instance
        }
        this.experience = new Experience()
        instance = this
    }

    toggleQuiz() {
        this.world = this.experience.world
        this.selectedChapter = this.world.selectedChapter
        this.debug = this.experience.debug
        this.program = this.world.program
        this.audio = this.world.audio
        this.questions = this.program.getCurrentStepData().quiz
        this.totalQuestions = this.questions.length

        this.correctAnswers = 0
        this.openQuestions = 0
        this.questionIdx = 0

        this.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        this.experience.navigation.next.className = 'button-arrow'
        this.experience.setAppView('game')

        this.quizHTML()
        this.setEventListeners()
    }

    quizHTML() {
        instance.quizContainer = _gl.elementFromHtml(`
        <div class="absolute inset-0 task-container grid place-content-center" id="quiz-game">
            <div class="relative mx-auto task-container_box group/quiz flex flex-col">
                <div class="progress-bar-container">
                    <div class="progress-bar-background">
                        <div class="progress-bar-foreground" id="progress-bar-quiz"></div>
                    </div>
                    <ul id="progress-steps" class="progress-steps">${instance.questions.map((_, index) => `<li class="progress-step button-circle ${index === 0 ? 'current-step' : ''}" id="progress-step-${index}"><span class="step-number">${index + 1}</span></li>`).join('')}</ul>
                </div>
                <div class="overlay" id="overlay" style="display:none;"></div>
                <div id="quiz-wrapper"><div id="loader" class="loader" style="display:none;"></div></div>
                ${
                    instance.questions.length > 0
                        ? `
                    <div id="quiz-navigation" class="flex justify-center mt-auto">
                        <button class="button-cube" id="next-question">
                            <svg><use href="#arrow-right-long-solid" fill="currentColor"></use></svg>
                        </button>
                        <button class="button-cube-wider" id="submit-quiz" type="submit">
                            ${_s.task.submit}
                        </button>
                    </div>`
                        : ''
                }
            </div>
        </div>`)

        instance.quizContainer.querySelector('#quiz-wrapper').setAttribute('data-question', 0)

        instance.questions.forEach((q, qIdx) => {
            const container = _gl.elementFromHtml(`<div class="quiz-item ${qIdx === 0 ? 'block' : 'hidden'}" data-index="${qIdx}"></div>`)
            const question = _gl.elementFromHtml(`<h1 class="task-container_prompts text-center font-bold mb-[4%]">${q.question}</h1>`)

            container.append(question)

            if (q.answers.length) {
                q.answers.forEach((a, aIdx) => {
                    const answer = _gl.elementFromHtml(`
                        <div>
                            <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}" class="sr-only"/>
                            <label for="question-${qIdx}_answer-${aIdx}" class="question-label">
                                <div class="font-bold button-circle">${aIdx + 1}</div>
                                <p class="">${a.answer}</p>
                            </label>
                        </div>
                    `)

                    container.append(answer)
                })
            } else {
                this.openQuestions++
                const selfAnswer = _gl.elementFromHtml(`<div><textarea rows="8" placeholder="${q.placeholder}" class="w-full bg-transparent px-3 py-2 rounded-md outline-none my-4 xl:my-6 tv:my-8 text-xl tv:text-2xl"></textarea></div>`)
                container.append(selfAnswer)
            }

            instance.quizContainer.querySelector('#quiz-wrapper').append(container)
        })

        instance.experience.interface.gameContainer.append(instance.quizContainer)
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const questionItems = document.querySelectorAll('.quiz-item')
        const totalQuestions = questionItems.length

        const nextQuestion = document.querySelector('#next-question')
        const submitQuiz = document.querySelector('#submit-quiz')

        nextQuestion.style.display = 'none'
        submitQuiz.style.display = 'none'

        questionItems.forEach((item, index) => {
            const options = item.querySelectorAll('label')
            const textarea = item.querySelector('textarea')

            options.forEach((option, idx) => {
                option.addEventListener('click', (e) => {
                    const currentQuestionIdx = parseInt(e.target.closest('.quiz-item').getAttribute('data-index'))
                    const correctAnswerIdx = instance.questions[currentQuestionIdx].answers.findIndex((item) => item.correct_wrong === true)

                    if (idx === correctAnswerIdx) {
                        e.target.closest('div').classList.add('correct')
                        instance.audio.playSound('correct')
                        instance.correctAnswers++
                        instance.experience.celebrate({ particleCount: 100, spread: 160 })

                        nextQuestion.style.display = 'grid'
                    } else {
                        instance.audio.playSound('wrong')
                        e.target.closest('div').classList.add('wrong')
                        setTimeout(() => {
                            e.target.closest('div').classList.remove('wrong')
                        }, 800)
                    }
                })
            })

            if (textarea) {
                textarea.addEventListener('input', (e) => {
                    const inputLength = e.target.value.length
                    submitQuiz.style.display = inputLength > 0 ? 'grid' : 'none'
                })
            }
        })

        nextQuestion.addEventListener('click', () => instance.moveToNextQuestion())

        submitQuiz.addEventListener('click', async () => {
            const wasSuccessful = await instance.saveAnswers()
            if (wasSuccessful) {
                instance.destroy()
                instance.program.congrats.toggleSummary()
            }
        })
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar-quiz')
        const progressSteps = document.querySelectorAll('.progress-step')
        const progressPercentage = (instance.questionIdx / (instance.totalQuestions - 1)) * 100

        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`

            // Update the step highlights
            progressSteps.forEach((step, index) => {
                if (index <= instance.questionIdx) {
                    step.classList.add('current-step')
                } else {
                    step.classList.remove('current-step')
                }
            })
        }
    }

    moveToNextQuestion() {
        const nextQuestion = document.querySelector('#next-question')

        const questionItems = document.querySelectorAll('.quiz-item')
        questionItems[instance.questionIdx].classList.add('hidden')
        questionItems[instance.questionIdx].classList.remove('block')

        instance.questionIdx++

        if (instance.questionIdx < questionItems.length) {
            questionItems[instance.questionIdx].classList.remove('hidden')
            questionItems[instance.questionIdx].classList.add('block')
        }

        nextQuestion.style.display = 'none'
        instance.updateProgressBar()
    }

    async saveAnswers() {
        document.getElementById('loader').style.display = 'block'
        document.getElementById('overlay').style.display = 'block'

        let answers = []
        let allQuestionsAnswered = true // Flag to track if all questions are answered

        document.querySelectorAll('.quiz-item').forEach((question, index) => {
            let answer
            const textarea = question.querySelector('textarea')
            if (textarea) {
                answer = textarea.value.trim()
                if (!answer) allQuestionsAnswered = false // Mark as unanswered if textarea is empty
            } else {
                const selectedOption = question.querySelector('input[type="radio"]:checked')
                if (selectedOption) {
                    answer = selectedOption.nextElementSibling.textContent.trim()
                } else {
                    allQuestionsAnswered = false // Mark as unanswered if no option is selected
                }
            }

            if (answer) {
                answers.push({
                    questionIndex: index,
                    answer: answer,
                })
            }
        })

        if (!allQuestionsAnswered) {
            // Show modal or alert for incomplete answers
            alert('Please answer all questions before submitting.')
            return false // Indicate that the save operation was not successful
        }

        const data = {
            taskTitle: 'Quiz',
            answers: answers.map((a) => a.answer),
            chapterId: instance.selectedChapter.id,
            chapterTitle: instance.selectedChapter.title,
            language: _lang.getLanguageCode(),
        }

        try {
            const response = await fetch(_api.saveAnswer(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error('Network response was not ok')
            }

            // Hide the loader on success
            document.getElementById('loader').style.display = 'none'

            const responseData = await response.json()
            return true
        } catch (error) {
            console.error('Error:', error)

            // Hide the loader on failure
            document.getElementById('loader').style.display = 'none'
            return false
        }
    }

    destroy() {
        document.querySelector('#quiz-game')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button-arrow'
    }
}
