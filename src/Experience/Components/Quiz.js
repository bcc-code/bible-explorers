import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Quiz {
    constructor() {
        instance = this
        instance.experience = new Experience()
    }

    toggleQuiz() {

        instance.correctAnswers = 0

        instance.world = instance.experience.world
        instance.debug = instance.experience.debug
        instance.program = instance.world.program

        instance.quizHTML()
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

            const quizStep = _gl.elementFromHtml(`<li class="quiz-step btn rounded ${qIdx === 0 ? 'visible' : ''}" data-index="${qIdx + 1}"><span>${qIdx + 1}</span></li>`)

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

            const quizAnswers = _gl.elementFromHtml(`
                <ul class="quiz-answers"></ul>
            `)

            quizItem.append(quizAnswers)

            if (q.answers.length) {
                q.answers.forEach((a, aIdx) => {
                    const quizAnswer = _gl.elementFromHtml(`
                        <li class="quiz-answer">
                            <label for="question-${qIdx}_answer-${aIdx}">
                                <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}"/>
                                <span>${a.answer}</span>
                            </label>
                        </li>
                    `)

                    quizAnswers.append(quizAnswer)

                })
            } else {
                const quizAnswer = _gl.elementFromHtml(`
                    <li class="quiz-answer quiz-textarea">
                        <textarea rows="8" placeholder="${q.placeholder}"></textarea>
                    </li>
                `)

                quizAnswers.append(quizAnswer)
            }

            if (q.picture) {
                const picture = _gl.elementFromHtml(`<div class="question__picture" ><img src="${q.picture}"></div>`)
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
            const currentCheckpoint = quiz.querySelector('.quiz-step.visible')

            current.classList.remove('visible')
            currentCheckpoint.classList.remove('visible')
            current.previousElementSibling.classList.add('visible')
            currentCheckpoint.previousElementSibling?.classList.add('visible')

            if (current.previousElementSibling.querySelector('input:checked')) {
                next.disabled = false
            }

            if (current.getAttribute('data-index') == 2) {
                prev.disabled = true
            }

        })

        next.disabled = true
        next.addEventListener("click", () => {
            const current = quiz.querySelector('.quiz-item.visible')
            const currentCheckpoint = quiz.querySelector('.quiz-step.visible')

            current.classList.remove('visible')
            currentCheckpoint.classList.remove('visible')

            current.nextElementSibling.classList.add('visible')
            currentCheckpoint.nextElementSibling.classList.add('visible')


            if (questionsAnswered < questions.length - 1) {
                questionsAnswered++
                quizUpdateProgress(questionsAnswered)
            }

            if (current.nextElementSibling.querySelector('input:checked')) {
                next.disabled = false
            } else {
                next.disabled = true
            }

            prev.disabled = false

            if (current.nextElementSibling.getAttribute('data-index') == questions.length) {
                next.disabled = true
            }

        })

        let quizUpdateProgress = (answers) => {
            quizProgress = quizStepWidth * answers

            const quizProgressBar = quiz.querySelector('.quiz-progress-bar div')
            quizProgressBar.style.width = quizProgress + '%'
        }

        quiz.querySelectorAll('.quiz-item').forEach((q, i) => {

            const htmlAnswers = q.querySelectorAll('label')
            const objAnswers = questions[i].answers

            htmlAnswers.forEach((a, i) => {
                a.addEventListener('click', () => {
                    htmlAnswers.forEach(a => {
                        a.parentNode.classList.remove('wrong')
                        a.style.pointerEvents = 'none'
                    })

                    const correctIndex = objAnswers.findIndex(a => a.correct_wrong)
                    htmlAnswers[correctIndex].parentNode.classList.add('correct')

                    if (!objAnswers[i].correct_wrong) {
                        a.parentNode.classList.add('wrong')
                    } else {
                        instance.correctAnswers++
                    }

                    if (q.getAttribute('data-index') !== questions.length) {
                        next.disabled = false
                    }

                })
            })
        })

        const submitQuiz = _gl.elementFromHtml(`<button type="submit" class="btn default next pulsate">submit</button>`)

        quiz.querySelector('.quiz-textarea').addEventListener('input', (e) => {
            if (e.target.value.length > 1) return

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

            instance.experience.world.audio.playSound('task-completed')

            const summaryHTML = _gl.elementFromHtml(`
                <div class="summary">
                    <div class="summary-content">
                        <header>
                            <h2>${_s.miniGames.completed.title}</h2>
                        </header>
                        <div>${instance.correctAnswers + ' / ' + questions.length + ' '}!</div>
                    </div>
                </div>
            `)

            quiz.querySelector('.container').style.display = 'none'
            quiz.classList.add('popup-visible')
            quiz.append(summaryHTML)
            document.querySelector('.cta').style.display = 'flex'
        })

        instance.experience.navigation.next.addEventListener('click', instance.destroy)
        instance.experience.navigation.prev.addEventListener('click', instance.destroy)
    }

    destroy() {
        document.querySelector('.quiz')?.remove()
        instance.correctAnswers = 0
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
    }
}