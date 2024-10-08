import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Quiz {
    constructor() {
        if (instance) return instance

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
        this.getCurrentQuestion = () => this.questions[this.questionIdx]

        this.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        this.experience.navigation.next.className = `button button-arrow-skip`
        this.experience.setAppView('game')

        this.quizHTML()

        this.nextQuestion = document.getElementById('next-question')
        this.submitQuiz = document.getElementById('submit-quiz')
        this.taskActionsWrapper = document.querySelector('.task-actions')

        this.toggleQuestion()

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    quizHTML() {
        instance.quizContainer = _gl.elementFromHtml(`
        <div class="task-container" id="quiz-game">
            <div class="corner top-left"></div>
            <div class="edge top"></div>
            <div class="corner top-right"></div>
            <div class="edge left"></div>
            <div class="content">
                <div class="task-content group/quiz">
                    ${
                        instance.questions.length > 1
                            ? `<div class="progress-bar-container">
                            <div class="progress-bar-background">
                                <div class="progress-bar-foreground" id="progress-bar-quiz"></div>
                            </div>
                            <ul id="progress-steps" class="progress-steps">${instance.questions
                                .map(
                                    (_, index) => `
                                    <li class="progress-step button button-circle ${index === 0 ? 'current-step' : ''}" id="progress-step-${index}">
                                        <span class="step-number">${index + 1}</span>
                                    </li>`
                                )
                                .join('')}
                                </ul>
                        </div>`
                            : ''
                    }
                    <div id="quiz-wrapper"></div>
                    <div class="task-actions ${instance.questions.length == 1 ? 'hidden' : ''}">
                        <button id="next-question" class="button-grid" type="button">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">${_s.task.next}</div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </button>
                        <button id="submit-quiz" class="button-grid" type="submit">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">${_s.task.submit}</div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </button>
                    </div>
                </div>
            </div>
            <div class="edge right"></div>
            <div class="corner bottom-left"></div>
            <div class="edge bottom"></div>
            <div class="corner bottom-right"></div>
        </div>`)

        instance.experience.interface.gameContainer.append(instance.quizContainer)
    }

    toggleQuestion() {
        instance.quizContainer.querySelector('#quiz-wrapper').innerHTML = ''

        const container = _gl.elementFromHtml(
            `<div class="quiz-item data-index="${instance.questionIdx}"></div>`
        )
        const question = _gl.elementFromHtml(
            `<h5 class="task-prompts text-center font-bold mb-[4%]">${instance.getCurrentQuestion().question}</h5>`
        )

        container.append(question)

        if (instance.getCurrentQuestion().answers.length) {
            if (instance.getCurrentQuestion().answers.filter((a) => a.correct_wrong).length > 1) {
                // Multiple Choice
                instance.getCurrentQuestion().answers.forEach((a, aIdx) => {
                    const answer = _gl.elementFromHtml(`
                        <div>
                            <input type="checkbox" id="question-${instance.questionIdx}_answer-${aIdx}" name="question-${instance.questionIdx}" class="sr-only"/>
                            <label for="question-${instance.questionIdx}_answer-${aIdx}" class="question-label">
                                <div class="font-bold button button-circle">${aIdx + 1}</div>
                                <h6 class="">${a.answer}</h6>
                            </label>
                        </div>
                    `)

                    container.append(answer)
                })
            } else {
                // Single Choice
                instance.getCurrentQuestion().answers.forEach((a, aIdx) => {
                    const answer = _gl.elementFromHtml(`
                        <div>
                            <input type="radio" id="question-${instance.questionIdx}_answer-${aIdx}" name="question-${instance.questionIdx}" class="sr-only"/>
                            <label for="question-${instance.questionIdx}_answer-${aIdx}" class="question-label">
                                <div class="font-bold button button-circle">${aIdx + 1}</div>
                                <h6 class="">${a.answer}</h6>
                            </label>
                        </div>
                    `)

                    container.append(answer)
                })
            }
        } else {
            this.openQuestions++
            const selfAnswer = _gl.elementFromHtml(
                `<div class="textarea-box"><textarea class="scroller" placeholder="${instance.getCurrentQuestion().placeholder}" class=""></textarea></div>`
            )
            container.append(selfAnswer)
        }

        instance.quizContainer.querySelector('#quiz-wrapper').append(container)
        instance.questionItem = document.querySelector('.quiz-item')

        instance.addNextQuestionButtonLabel()
        instance.setEventListeners()
    }

    addNextQuestionButtonLabel() {
        instance.nextQuestion.querySelector('.content').innerHTML =
            instance.getCurrentQuestion().answers &&
            instance.getCurrentQuestion().answers.filter((a) => a.correct_wrong).length > 1
                ? 'Check answer' // Multiple choice question
                : `<span>${_s.task.next}</span>` // Single choice question
    }

    setEventListeners() {
        instance.nextQuestion.disabled = true
        instance.taskActionsWrapper.classList.add('disabled')
        instance.submitQuiz.style.display = 'none'

        const answerLabels = instance.questionItem.querySelectorAll('label')
        const textarea = instance.questionItem.querySelector('textarea')
        const isLastQuestion = instance.questionIdx === instance.totalQuestions - 1

        answerLabels.forEach((answer, idx) => {
            answer.addEventListener('click', (e) => {
                if (instance.getCurrentQuestion().answers.filter((a) => a.correct_wrong).length == 1) {
                    // Single choice question
                    const correctAnswerIdx = instance
                        .getCurrentQuestion()
                        .answers.findIndex((item) => item.correct_wrong === true)

                    if (idx === correctAnswerIdx) {
                        e.target.closest('div').classList.add('correct')
                        instance.audio.playSound('correct')
                        instance.correctAnswers++
                        instance.experience.celebrate({ particleCount: 100, spread: 160 })

                        if (instance.questionIdx !== instance.totalQuestions - 1) {
                            instance.nextQuestion.disabled = false
                            instance.taskActionsWrapper.classList.remove('disabled')
                        } else {
                            instance.experience.navigation.next.innerHTML = ''
                            instance.experience.navigation.next.className = 'button button-arrow'
                        }

                        answerLabels.forEach((disableOption) => {
                            disableOption.style.pointerEvents = 'none'
                        })
                    } else {
                        instance.audio.playSound('wrong')
                        e.target.closest('div').classList.add('wrong')

                        setTimeout(() => {
                            e.target.closest('div').classList.remove('wrong')
                        }, 800)
                    }
                } else {
                    // Multiple choice question
                    setTimeout(() => {
                        // Disable or Enable the Check answer button
                        instance.nextQuestion.disabled =
                            document.querySelectorAll('.quiz-item input:checked').length == 0
                    }, 100)
                }
            })
        })

        if (textarea) {
            textarea.addEventListener('input', (e) => {
                const inputLength = e.target.value.length

                if (inputLength > 0) {
                    if (isLastQuestion) {
                        instance.submitQuiz.style.display = 'flex'
                        instance.submitQuiz.disabled = false
                        instance.nextQuestion.style.display = 'none'
                        instance.taskActionsWrapper.classList.remove('disabled')
                    } else {
                        instance.nextQuestion.disabled = false
                        instance.taskActionsWrapper.classList.remove('disabled')
                    }
                } else {
                    if (isLastQuestion) {
                        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
                        instance.experience.navigation.next.className = `button button-arrow-skip`
                        instance.submitQuiz.disabled = true
                        instance.nextQuestion.style.display = 'none'
                        instance.taskActionsWrapper.classList.add('disabled')
                    } else {
                        instance.nextQuestion.disabled = true
                        instance.taskActionsWrapper.classList.add('disabled')
                    }
                }
            })
        }

        if (
            instance.getCurrentQuestion().answers &&
            instance.getCurrentQuestion().answers.filter((a) => a.correct_wrong).length > 1
        ) {
            // Multiple choice question
            instance.nextQuestion.removeEventListener('click', instance.moveToNextQuestion)
            instance.nextQuestion.addEventListener('click', instance.checkMcQuestion)
        } else {
            // Single choice OR open question
            instance.nextQuestion.removeEventListener('click', instance.checkMcQuestion)
            instance.nextQuestion.addEventListener('click', instance.moveToNextQuestion)
        }

        if (!isLastQuestion) return

        instance.submitQuiz.addEventListener('click', async () => {
            const wasSuccessful = await instance.saveAnswers()

            if (wasSuccessful) {
                instance.experience.celebrate({ particleCount: 100, spread: 160 })
                instance.world.audio.playSound('task-completed')
                instance.submitQuiz.style.display = 'none'

                setTimeout(() => {
                    instance.program.nextStep()
                    instance.destroy()
                }, 500)
            }
        })
    }

    checkMcQuestion() {
        let allAnswersCorrect = true

        instance.getCurrentQuestion().answers.forEach((answer, index) => {
            if (
                (answer.correct_wrong == true &&
                    document.querySelector(`#question-${instance.questionIdx}_answer-${index}`).checked ==
                        false) ||
                (answer.correct_wrong == false &&
                    document.querySelector(`#question-${instance.questionIdx}_answer-${index}`).checked ==
                        true)
            ) {
                allAnswersCorrect = false
            }
        })

        if (allAnswersCorrect) {
            instance.questionItem.querySelectorAll('input:checked').forEach((answer) => {
                answer.parentNode.classList.add('correct')
            })
            instance.questionItem.querySelectorAll('input').forEach((answer) => {
                answer.parentNode.querySelector('label').style.pointerEvents = 'none'
            })

            instance.audio.playSound('correct')
            instance.correctAnswers++
            instance.experience.celebrate({ particleCount: 100, spread: 160 })

            if (instance.questionIdx !== instance.totalQuestions - 1) {
                instance.nextQuestion.disabled = false
                instance.taskActionsWrapper.classList.remove('disabled')
            } else {
                instance.experience.navigation.next.innerHTML = ''
                instance.experience.navigation.next.className = 'button button-arrow'
            }

            instance.nextQuestion.innerHTML =
                '<svg class="icon"><use href="#arrow-right-long-solid" fill="currentColor"></use></svg>'

            instance.nextQuestion.removeEventListener('click', instance.checkMcQuestion)
            instance.nextQuestion.addEventListener('click', instance.moveToNextQuestion)
        } else {
            instance.audio.playSound('wrong')
            instance.questionItem.classList.add('wrong')
            setTimeout(() => {
                instance.questionItem.classList.remove('wrong')
            }, 800)
        }
    }

    moveToNextQuestion() {
        instance.questionIdx++

        instance.nextQuestion.disabled = true
        instance.taskActionsWrapper.classList.add('disabled')

        instance.updateProgressBar()
        instance.toggleQuestion()
        instance.addNextQuestionButtonLabel()
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

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button button-arrow'
    }
}
