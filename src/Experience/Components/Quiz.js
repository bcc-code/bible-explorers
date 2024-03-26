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
        this.experience.navigation.next.className = 'button-arrow button-arrow-default'
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
                    <ul id="progress-steps" class="progress-steps">
                        ${instance.questions
                            .map(
                                (_, index) => `
                            <li class="progress-step button-circle" id="progress-step-${index}">
                                <span class="step-number">${index + 1}</span>
                            </li>
                        `
                            )
                            .join('')}
                    </ul>
                </div>
                <div class="overlay" id="overlay" style="display:none;"></div>
                <div id="quiz-wrapper"><div id="loader" class="loader" style="display:none;"></div></div>
                ${
                    instance.questions.length > 0
                        ? `
                    <div id="quiz-navigation" class="flex gap-[1%] mt-auto">
                        <button class="button-cube" id="prev-question" disabled>
                            <svg><use href="#arrow-left-long-solid" fill="currentColor"></use></svg>
                        </button>
                        <button class="button-cube" id="next-question" disabled>
                            <svg><use href="#arrow-right-long-solid" fill="currentColor"></use></svg>
                        </button>
                        <button type="submit" id="submit-quiz" class="button-normal shadow-border pointer-events-auto ml-auto" disabled>
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
                            <label for="question-${qIdx}_answer-${aIdx}" class="bg-bke-purple flex items-center gap-2 px-3 py-2 xl:gap-4 xl:px-4 tv:gap-8 tv:px-8 tv:py-4 mt-4 cursor-pointer transition xl:hover:shadow-hover">
                                <div class="text-lg tv:text-2xl font-bold border-2 border-bke-orange flex-shrink-0 rounded-full w-8 h-8 tv:w-12 tv:h-12 grid place-items-center">${aIdx + 1}</div>
                                <p class="text-lg tv:text-2xl">${a.answer}</p>
                            </label>
                        </div>
                    `)

                    container.append(answer)
                })
            } else {
                // Add a textarea when there are no answers
                this.openQuestions++

                const selfAnswer = _gl.elementFromHtml(`
                    <div>
                        <textarea rows="8" placeholder="${q.placeholder}" class="w-full text-bke-purple px-3 py-2 rounded-md outline-none my-4 xl:my-6 tv:my-8 text-xl tv:text-2xl"></textarea>
                    </div>
                `)

                container.append(selfAnswer)
            }

            instance.quizContainer.querySelector('#quiz-wrapper').append(container)
        })

        instance.experience.interface.gameContainer.append(instance.quizContainer)
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const questionItems = document.querySelectorAll('.quiz-item')
        const totalQuestions = questionItems.length // Total number of questions

        const nextQuestion = document.querySelector('#next-question')
        const prevQuestion = document.querySelector('#prev-question')
        const submitQuiz = document.querySelector('#submit-quiz')

        // Track whether the last question has been correctly answered
        let lastQuestionAnsweredCorrectly = false

        // Initially hide the 'Submit' button and disable the 'Next' button
        submitQuiz.style.display = 'none'
        nextQuestion.disabled = true

        questionItems.forEach((item, index) => {
            const options = item.querySelectorAll('label')
            const textarea = item.querySelector('textarea')

            options.forEach((option, idx) => {
                option.addEventListener('click', (e) => {
                    const currentQuestionIdx = parseInt(e.target.closest('.quiz-item').getAttribute('data-index'))
                    const correctAnswerIdx = instance.questions[currentQuestionIdx].answers.findIndex((item) => item.correct_wrong === true)

                    if (idx === correctAnswerIdx) {
                        e.target.closest('div').classList.add('shadow-correct')
                        instance.audio.playSound('correct')
                        instance.correctAnswers++
                        instance.experience.celebrate({ particleCount: 100, spread: 160 })

                        if (currentQuestionIdx === totalQuestions - 1) {
                            lastQuestionAnsweredCorrectly = true // Mark last question as correctly answered
                            submitQuiz.disabled = false // Enable 'Submit' if correct answer on last question
                        }

                        disableInteraction(currentQuestionIdx)
                        nextQuestion.disabled = currentQuestionIdx >= totalQuestions - 1
                    } else {
                        instance.audio.playSound('wrong')
                        e.target.closest('div').classList.add('shadow-wrong')
                        setTimeout(() => {
                            e.target.closest('div').classList.remove('shadow-wrong')
                        }, 800)
                    }

                    // Enable Next button if not the last question
                    nextQuestion.disabled = currentQuestionIdx >= totalQuestions - 1
                })
            })

            if (textarea) {
                textarea.addEventListener('input', (e) => {
                    const inputLength = e.target.value.length
                    // Update flag based on input presence for the last question
                    if (index === totalQuestions - 1) {
                        lastQuestionAnsweredCorrectly = inputLength > 0
                        submitQuiz.disabled = !lastQuestionAnsweredCorrectly
                    }
                })
            }
        })

        nextQuestion.addEventListener('click', () => instance.moveToNextQuestion())
        prevQuestion.addEventListener('click', () => instance.moveToPreviousQuestion())

        function disableInteraction(questionIndex) {
            const currentQuestion = questionItems[questionIndex]
            const options = currentQuestion.querySelectorAll('label')
            options.forEach((option) => {
                option.style.pointerEvents = 'none'
            })
        }

        instance.handleQuizNavigation()

        submitQuiz.addEventListener('click', async () => {
            const wasSuccessful = await instance.saveAnswers()
            if (wasSuccessful) {
                // Proceed with whatever should happen after a successful save
                instance.destroy()
                instance.program.congrats.toggleSummary()
            } else {
                // Handle the case where saving was not successful
                // This could include showing an error message to the user
            }
        })
    }

    handleQuizNavigation() {
        const nextQuestion = document.querySelector('#next-question')
        const prevQuestion = document.querySelector('#prev-question')
        const submitQuiz = document.querySelector('#submit-quiz')

        if (instance.questionIdx === instance.totalQuestions - 1) {
            submitQuiz.style.display = 'grid'
            nextQuestion.style.display = 'none'
            const textarea = document.querySelectorAll('.quiz-item')[instance.questionIdx].querySelector('textarea')
            if (textarea) {
                const isTextareaFilled = textarea.value.length > 0
                instance.lastQuestionAnsweredCorrectly = isTextareaFilled
            }
            submitQuiz.disabled = !instance.lastQuestionAnsweredCorrectly // Only enable 'Submit' if last question was answered correctly
        } else {
            submitQuiz.style.display = 'none'
            nextQuestion.style.display = 'grid'
            instance.lastQuestionAnsweredCorrectly = false
            submitQuiz.disabled = true
        }

        prevQuestion.disabled = instance.questionIdx === 0
        nextQuestion.disabled = instance.questionIdx >= instance.totalQuestions - 1
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
        const questionItems = document.querySelectorAll('.quiz-item')
        // Hide current question
        questionItems[instance.questionIdx].classList.add('hidden')
        questionItems[instance.questionIdx].classList.remove('block')

        // Increment the question index
        instance.questionIdx++

        // Show next question
        if (instance.questionIdx < questionItems.length) {
            questionItems[instance.questionIdx].classList.remove('hidden')
            questionItems[instance.questionIdx].classList.add('block')
        }

        instance.updateNavigationButtons()
        instance.updateProgressBar()
    }

    moveToPreviousQuestion() {
        const questionItems = document.querySelectorAll('.quiz-item')
        // Hide current question
        questionItems[instance.questionIdx].classList.add('hidden')
        questionItems[instance.questionIdx].classList.remove('block')

        // Decrement the question index
        instance.questionIdx--

        // Show previous question
        if (instance.questionIdx >= 0) {
            questionItems[instance.questionIdx].classList.remove('hidden')
            questionItems[instance.questionIdx].classList.add('block')
        }

        instance.updateNavigationButtons()
        instance.updateProgressBar()
    }

    updateNavigationButtons() {
        const nextQuestion = document.querySelector('#next-question')
        const prevQuestion = document.querySelector('#prev-question')
        const submitQuiz = document.querySelector('#submit-quiz')

        if (instance.questionIdx === 0) {
            prevQuestion.disabled = true
        } else {
            prevQuestion.disabled = false
        }

        if (instance.questionIdx === instance.totalQuestions - 1) {
            nextQuestion.disabled = true
            submitQuiz.style.display = 'grid'
        } else {
            nextQuestion.disabled = false
            submitQuiz.style.display = 'none'
        }
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
            console.log('Success:', responseData)
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
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
    }
}
