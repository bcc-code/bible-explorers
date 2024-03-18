import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Quiz {
    constructor() {
        instance = this
        instance.experience = new Experience()
    }

    toggleQuiz() {
        instance.world = instance.experience.world
        instance.selectedChapter = instance.world.selectedChapter
        instance.debug = instance.experience.debug
        instance.program = instance.world.program
        instance.audio = instance.world.audio

        instance.correctAnswers = 0
        instance.openQuestions = 0
        instance.questions = instance.program.getCurrentStepData().quiz

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'

        instance.experience.setAppView('game')

        instance.quizHTML()
        instance.setEventListeners()
    }

    quizHTML() {
        instance.quizContainer = _gl.elementFromHtml(
            `<div class="absolute inset-0 bg-bke-darkpurple grid place-content-center" id="quiz-game">
                <div class="overlay" id="overlay" style="display:none;"></div>
                <div class="relative mx-auto max-w-[1980px] px-4 pb-4 pt-24 tv:gap-8 tv:px-8 tv:pt-32 group/quiz">
                    <div id="quiz-wrapper" class="max-w-prose"><div id="loader" class="loader" style="display:none;"></div></div>
                    ${
                        instance.questions.length > 0
                            ? `<div id="quiz-navigation" class="flex gap-4 xl:gap-6 tv:gap-8 mt-8">
                                    <button class="button-normal" disabled id="prev-question">
                                        <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#arrow-left-long-solid" fill="currentColor"></use></svg>
                                    </button>
                                    <button class="button-normal" disabled id="next-question">
                                        <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#arrow-right-long-solid" fill="currentColor"></use></svg>
                                    </button>
                                    <button type="submit" id="submit-quiz" class="button-normal shadow-border pointer-events-auto ml-auto" disabled>
                                        ${_s.task.submit}
                                    </button>
                                </div>`
                            : ''
                    }
                </div>
            </div>`
        )

        instance.quizContainer.querySelector('#quiz-wrapper').setAttribute('data-question', 0)

        instance.questions.forEach((q, qIdx) => {
            const container = _gl.elementFromHtml(`<div class="quiz-item ${qIdx === 0 ? 'block' : 'hidden'}" data-index="${qIdx}"></div>`)
            const question = _gl.elementFromHtml(`<h1 class="text-2xl tv:text-3xl font-bold">${q.question}</h1>`)

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
                instance.openQuestions++

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
        let questionIdx = 0 // Start index at 0 for the first question
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

        nextQuestion.addEventListener('click', () => {
            if (questionIdx < totalQuestions - 1) {
                moveToNextQuestion()
            }
            handleQuizNavigation()
        })

        prevQuestion.addEventListener('click', () => {
            if (questionIdx > 0) {
                moveToPreviousQuestion()
            }
            handleQuizNavigation()
        })

        function moveToNextQuestion() {
            questionItems[questionIdx].className = 'quiz-item hidden'
            questionItems[questionIdx + 1].className = 'quiz-item block'
            questionIdx++
            nextQuestion.disabled = true // Disable next button until a new answer is selected
            prevQuestion.disabled = questionIdx === 0
        }

        function moveToPreviousQuestion() {
            questionItems[questionIdx].className = 'quiz-item hidden'
            questionItems[questionIdx - 1].className = 'quiz-item block'
            questionIdx--
            nextQuestion.disabled = false // Assume previous question was answered
            prevQuestion.disabled = questionIdx === 0
        }

        function disableInteraction(questionIndex) {
            const currentQuestion = questionItems[questionIndex]
            const options = currentQuestion.querySelectorAll('label')
            options.forEach((option) => {
                option.style.pointerEvents = 'none'
            })
        }

        function handleQuizNavigation() {
            if (questionIdx === totalQuestions - 1) {
                submitQuiz.style.display = 'flex'
                nextQuestion.style.display = 'none'
                // Adjusted to check textarea input for the last question as well
                const textarea = questionItems[questionIdx].querySelector('textarea')
                if (textarea) {
                    const isTextareaFilled = textarea.value.length > 0
                    lastQuestionAnsweredCorrectly = isTextareaFilled
                }
                submitQuiz.disabled = !lastQuestionAnsweredCorrectly // Only enable 'Submit' if last question was answered correctly
            } else {
                // When not on the last question
                submitQuiz.style.display = 'none'
                nextQuestion.style.display = 'flex'
                // Ensure 'Submit' is disabled if navigating away from the last question
                lastQuestionAnsweredCorrectly = false
                submitQuiz.disabled = true
            }
        }

        // Initial call to handle navigation
        handleQuizNavigation()

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
