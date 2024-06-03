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
        this.experience.navigation.next.className = `button button-arrow-skip`
        this.experience.setAppView('game')

        this.quizHTML()
        this.setEventListeners()
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    quizHTML() {
        instance.quizContainer = _gl.elementFromHtml(`
        <div class="absolute inset-0 task-container" id="quiz-game">
            <div class="task-container_box group/quiz flex flex-col">
                <div class="progress-bar-container">
                    <div class="progress-bar-background">
                        <div class="progress-bar-foreground" id="progress-bar-quiz"></div>
                    </div>
                    <ul id="progress-steps" class="progress-steps">${instance.questions.map((_, index) => `<li class="progress-step button button-circle ${index === 0 ? 'current-step' : ''}" id="progress-step-${index}"><span class="step-number">${index + 1}</span></li>`).join('')}</ul>
                </div>
                <div id="quiz-wrapper"></div>
                ${
                    instance.questions.length > 0
                        ? `
                    <div class="task-container_actions">
                        <button id="next-question" class="button button-task_action"><svg class="icon"><use href="#arrow-right-long-solid" fill="currentColor"></use></svg></button>
                        <button id="submit-quiz" class="button button-task_action" type="submit"><span>${_s.task.submit}</span></button>
                    </div>`
                        : ''
                }
            </div>
        </div>`)

        instance.quizContainer.querySelector('#quiz-wrapper').setAttribute('data-question', 0)

        instance.questions.forEach((q, qIdx) => {
            const container = _gl.elementFromHtml(
                `<div class="quiz-item ${qIdx === 0 ? 'block' : 'hidden'}" data-index="${qIdx}"></div>`
            )
            const question = _gl.elementFromHtml(
                `<h5 class="task-container_prompts text-center font-bold mb-[4%]">${q.question}</h5>`
            )

            container.append(question)

            if (q.answers.length) {
                q.answers.forEach((a, aIdx) => {
                    const answer = _gl.elementFromHtml(`
                        <div>
                            <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}" class="sr-only"/>
                            <label for="question-${qIdx}_answer-${aIdx}" class="question-label">
                                <div class="font-bold button button-circle">${aIdx + 1}</div>
                                <h6 class="">${a.answer}</h6>
                            </label>
                        </div>
                    `)

                    container.append(answer)
                })
            } else {
                this.openQuestions++
                const selfAnswer = _gl.elementFromHtml(
                    `<div class="textarea-box"><textarea class="scroller" placeholder="${q.placeholder}" class=""></textarea></div>`
                )
                container.append(selfAnswer)
            }

            instance.quizContainer.querySelector('#quiz-wrapper').append(container)
        })

        instance.experience.interface.gameContainer.append(instance.quizContainer)
    }

    setEventListeners() {
        const questionItems = document.querySelectorAll('.quiz-item')
        const totalQuestions = questionItems.length

        const nextQuestion = document.querySelector('#next-question')
        const submitQuiz = document.querySelector('#submit-quiz')

        instance.taskActionsWrapper = document.querySelector('.task-container_actions')

        nextQuestion.disabled = true
        instance.taskActionsWrapper.classList.add('disabled')
        submitQuiz.style.display = 'none'

        questionItems.forEach((item, index) => {
            const options = item.querySelectorAll('label')
            const textarea = item.querySelector('textarea')

            options.forEach((option, idx) => {
                option.addEventListener('click', (e) => {
                    const currentQuestionIdx = parseInt(
                        e.target.closest('.quiz-item').getAttribute('data-index')
                    )
                    const correctAnswerIdx = instance.questions[currentQuestionIdx].answers.findIndex(
                        (item) => item.correct_wrong === true
                    )

                    if (idx === correctAnswerIdx) {
                        console.log()
                        e.target.closest('div').classList.add('correct')
                        instance.audio.playSound('correct')
                        instance.correctAnswers++
                        instance.experience.celebrate({ particleCount: 100, spread: 160 })

                        if (instance.questionIdx !== totalQuestions - 1) {
                            nextQuestion.disabled = false
                            instance.taskActionsWrapper.classList.remove('disabled')
                        } else {
                            instance.experience.navigation.next.innerHTML = ''
                            instance.experience.navigation.next.className = 'button button-arrow'
                        }

                        options.forEach((disableOption) => {
                            disableOption.style.pointerEvents = 'none'
                        })
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
                    const isLastQuestion = index === totalQuestions - 1
                    if (inputLength > 0) {
                        if (isLastQuestion) {
                            submitQuiz.style.display = 'flex'
                            submitQuiz.disabled = false
                            nextQuestion.style.display = 'none'
                            instance.taskActionsWrapper.classList.remove('disabled')
                        } else {
                            nextQuestion.disabled = false
                            instance.taskActionsWrapper.classList.remove('disabled')
                        }
                    } else {
                        if (isLastQuestion) {
                            instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
                            instance.experience.navigation.next.className = `button button-arrow-skip`
                            submitQuiz.disabled = true
                            nextQuestion.style.display = 'none'
                            instance.taskActionsWrapper.classList.add('disabled')
                        } else {
                            nextQuestion.disabled = true
                            instance.taskActionsWrapper.classList.add('disabled')
                        }
                    }
                })
            }
        })

        nextQuestion.addEventListener('click', () => instance.moveToNextQuestion())

        submitQuiz.addEventListener('click', async () => {
            const wasSuccessful = await instance.saveAnswers()

            if (wasSuccessful) {
                instance.experience.celebrate({ particleCount: 100, spread: 160 })
                instance.world.audio.playSound('task-completed')
                submitQuiz.style.display = 'none'

                setTimeout(() => {
                    instance.program.nextStep()
                    instance.destroy()
                }, 500)
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

        nextQuestion.disabled = true
        instance.taskActionsWrapper.classList.add('disabled')
        instance.updateProgressBar()
    }

    async saveAnswers() {
        const textareas = document.querySelectorAll('#quiz-game textarea')
        let answers = []

        textareas.forEach((textarea) => {
            const answer = textarea.value.trim()
            if (answer) {
                answers.push(answer)
            }
        })

        if (answers.length === 0) {
            alert('Please fill in at least one answer before submitting.')
            return
        }

        const data = {
            taskTitle: 'Quiz',
            answer: answers,
            chapterId: instance.selectedChapter.id,
            chapterTitle: instance.selectedChapter.title,
            language: _lang.getLanguageCode(),
        }

        try {
            fetch(_api.saveAnswer(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            return true
        } catch (error) {
            console.error('Error:', error)
            return true // If the request failed (e.g. connection was offline) we still want to continue
        }
    }

    destroy() {
        document.querySelector('#quiz-game')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button button-arrow'
    }
}
