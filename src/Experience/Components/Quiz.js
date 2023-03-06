import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

let instance = null

export default class Quiz {
    constructor() {
        instance = this
        instance.experience = new Experience()
    }

    toggleQuiz() {
        instance.world = instance.experience.world
        instance.debug = instance.experience.debug
        instance.program = instance.world.program

        instance.correctAnswers = 0
        instance.openQuestions = 0
        instance.quizHTML()
        instance.setEventListeners()
    }

    quizHTML() {
        const questions = instance.program.getCurrentStepData().quiz

        const quiz = _gl.elementFromHtml(`
            <section class="quiz">
                <div class="container">
                    <div class="quiz-progress">
                        <div class="quiz-progress-bar">
                            <div></div>
                        </div>   
                        <ul class="quiz-steps"></ul>
                    </div>
                    <ul class="quiz-items"></ul>
                    <div class="quiz-nav ${questions.length == 1 ? "hide - nav" : ""}"></div>
                </div>
                <div class="overlay"></div>
            </section>
        `)

        const prev = _gl.elementFromHtml(`
            <button class="btn rounded" aria-label="prev question">
                <svg class="prev-icon icon" width="25" height="16" viewBox="0 0 25 16">
                    <use href="#arrow-left"></use>
                </svg>
            </button>
        `)

        const next = _gl.elementFromHtml(`
            <button class="btn rounded" aria-label="next question">
                <svg class="next-icon icon" width="25" height="16" viewBox="0 0 25 16">
                    <use href="#arrow-right"></use>
                </svg>
            </button>
        `)

        questions.forEach((q, qIdx) => {
            const quizStep = _gl.elementFromHtml(`<li class="quiz-step btn rounded ${qIdx === 0 ? 'current' : ''}" data-index="${qIdx + 1}"><span>${qIdx + 1}</span></li>`)
            const quizItem = _gl.elementFromHtml(`
                <li class="quiz-item ${qIdx === 0 ? 'visible' : ''}" data-index="${qIdx + 1}">
                    <div class="quiz-question">
                        <svg class="question-mark-icon" viewBox="0 0 15 22">
                            <use href="#question-mark"></use>
                        </svg>
                        <h2>${q.question}</h2>
                    </div>
                </li>
            `)

            const quizAnswers = _gl.elementFromHtml(`<ul class="quiz-answers"></ul>`)
            quizItem.append(quizAnswers)

            if (q.answers.length) {
                q.answers.forEach((a, aIdx) => {
                    const quizAnswer = _gl.elementFromHtml(`
                        <li class="quiz-answer">
                            <div class="label">
                                <label for="question-${qIdx}_answer-${aIdx}"></label>
                                <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}"/>
                                <span>${a.answer}</span>
                            </div>
                        </li>
                    `)

                    quizAnswers.append(quizAnswer)
                })
            }
            else {
                // Add a textarea when there are no answers
                instance.openQuestions++

                const quizAnswer = _gl.elementFromHtml(`
                    <li class="quiz-answer">
                        <textarea rows="8" placeholder="${q.placeholder}" class="quiz-textarea"></textarea>
                    </li>
                `)

                quizAnswers.append(quizAnswer)
            }

            quiz.querySelector('.quiz-steps').append(quizStep)
            quiz.querySelector('.quiz-items').append(quizItem)
        })

        quiz.querySelector('.quiz-nav').append(prev, next)
        document.querySelector('.ui-container').append(quiz)
        document.querySelector('.cta').style.display = 'none'

        let questionsAnswered = 0
        let quizProgress = 0
        const quizStepWidth = 100 / (questions.length - 1)

        prev.disabled = true
        prev.addEventListener("click", () => {
            const current = quiz.querySelector('.quiz-item.visible')
            const currentCheckpoint = quiz.querySelector('.quiz-step.current')

            current.classList.remove('visible')
            currentCheckpoint.classList.remove('current')
            current.previousElementSibling.classList.add('visible')
            currentCheckpoint.previousElementSibling?.classList.add('current')

            next.disabled = !current.previousElementSibling.classList.contains('done')

            if (current.getAttribute('data-index') == 2)
                prev.disabled = true

        })

        next.disabled = true
        next.addEventListener("click", () => {
            const current = quiz.querySelector('.quiz-item.visible')
            const currentCheckpoint = quiz.querySelector('.quiz-step.current')

            current.classList.remove('visible')
            currentCheckpoint.classList.remove('current')
            current.nextElementSibling.classList.add('visible')
            currentCheckpoint.nextElementSibling.classList.add('current')

            if (questionsAnswered < questions.length)
                quizUpdateProgress(questionsAnswered)

            prev.disabled = false
            next.disabled = !current.nextElementSibling.classList.contains('done')

            if (current.nextElementSibling.getAttribute('data-index') == questions.length)
                next.disabled = true

        })

        let quizUpdateProgress = (answers) => {
            quizProgress = quizStepWidth * answers

            const quizProgressBar = quiz.querySelector('.quiz-progress-bar div')
            quizProgressBar.style.width = quizProgress + '%'
        }

        quiz.querySelectorAll('.quiz-item').forEach((q, i) => {
            const htmlAnswers = q.querySelectorAll('.label')
            const objAnswers = questions[i].answers


            htmlAnswers.forEach((a, i) => {
                a.addEventListener('click', () => {
                    htmlAnswers.forEach(answer => {
                        answer.parentNode.classList.remove('wrong')
                        answer.style.pointerEvents = 'none'
                    })

                    const correctIndex = objAnswers.findIndex(a => a.correct_wrong)
                    htmlAnswers[correctIndex].parentNode.classList.add('correct')

                    if (!objAnswers[i].correct_wrong) {
                        a.parentNode.classList.add('wrong')
                    } else {
                        instance.correctAnswers++
                    }

                    if (q.getAttribute('data-index') !== questions.length)
                        next.disabled = false

                    const currentCheckpoint = quiz.querySelector('.quiz-step.current')
                    const current = quiz.querySelector('.quiz-item.visible')
                    currentCheckpoint.classList.add('done')
                    current.classList.add('done')
                    questionsAnswered++
                })
            })
        })

        const submitQuiz = _gl.elementFromHtml(`<button type="submit" class="btn default next pulsate">${_s.task.submit}</button>`)

        quiz.querySelector('.quiz-textarea').addEventListener('input', (e) => {

            if (e.target.value.length > 0) {
                questionsAnswered = questions.length

                quiz.classList.add('completed')
                quiz.querySelector('.quiz-nav').appendChild(submitQuiz)
            }
            else {
                questionsAnswered = questions.length - 1
            }
        })

        submitQuiz.addEventListener('click', () => {
            instance.destroy()
            instance.program.congrats.toggleSummary()
            document.querySelector('.cta').style.display = 'flex'

            const message = _gl.elementFromHtml(`<p>${(instance.correctAnswers + instance.openQuestions) + ' / ' + questions.length + ' '}!</p>`)
            document.querySelector('.modal .summary').append(message)
        })


        const skipBTN = _gl.elementFromHtml(`
            <button class="btn default" aria-label="skip-button">${_s.miniGames.skip}</button>
        `)

        if (instance.debug.developer || instance.debug.onQuickLook())
            quiz.querySelector('.container').append(skipBTN)

        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.querySelector('.quiz')?.remove()
    }
}