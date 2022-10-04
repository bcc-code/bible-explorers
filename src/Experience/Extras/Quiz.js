import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let quiz = null

export default class Quiz {
    constructor() {
        this.experience = new Experience()

        quiz = this
    }

    toggleQuiz() {
        if (document.querySelector('.modal')) {
            quiz.modal.destroy()
        }
        else {

            let correctAnswers = 0

            let world = this.experience.world
            let debug = this.experience.debug
            let program = world.program
            let currentStep = program.currentStep
            let selectedChapter = world.selectedChapter

            const questions = selectedChapter.program[currentStep].quiz

            let html = `<div class="modal__content quiz">
                            <div class="quiz__content">`

            questions.forEach((q, qIdx) => {
                html += `<div class="question" data-index="${qIdx + 1}">
                            <div class="question__heading">
                                <span class="question__label">Question ${qIdx + 1} / ${questions.length}</span>
                                <p class="question__title">${q.question}</p>
                            </div>
                            <div class="question__form">`

                if (q.answers.length) {
                    q.answers.forEach((a, aIdx) => {
                        html += `<div class="question__input">
                                    <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}"/>
                                    <label for="question-${qIdx}_answer-${aIdx}">
                                        <span></span>
                                        ${a.answer}
                                        <div></div>
                                    </label>
                                </div>`
                    })
                }
                else {
                    html += `<div class="question__input">
                                <textarea class="question__textarea" rows="8" placeholder="${q.placeholder}"></textarea>
                            </div>`
                }

                html += `</div>`

                if (q.picture) {
                    html += `<div class="question__picture" ><img src="${q.picture}"></div>`
                }

                html += `</div>`
            })

            html += `</div>
                        <div class="quiz__footer ${questions.length == 1 ? "hide - nav" : ""}">
                            <button id="prev" class="button button__round | icon-arrow-left-long-solid"></button>
                            <button id="next" class="button button__round | icon-arrow-right-long-solid"></button>
                        </div>
                    </div>`

            quiz.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__quiz')

            const htmlQuestions = document.querySelectorAll('.question')
            htmlQuestions[0].classList.add('visible')

            if (debug.developer || debug.onQuickLook()) {
                const skip = document.getElementById('skip')
                skip.style.display = 'block'
                skip.innerText = _s.miniGames.skip
                skip.addEventListener("click", () => {
                    quiz.modal.destroy()
                    program.advance()
                })
            }

            const back = document.getElementById("back")
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', (e) => {
                quiz.modal.destroy()
                world.program.taskDescription.toggleTaskDescription()
            })

            const nextButton = document.getElementById('next')
            const prevButton = document.getElementById('prev')
            prevButton.setAttribute('disabled', '')
            nextButton.setAttribute('disabled', '')

            const submitButton = document.getElementById('continue')
            submitButton.innerText = _s.task.submit

            nextButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')

                current.classList.remove('visible')
                current.nextElementSibling?.classList.add('visible')

                if (current.nextElementSibling.querySelector('input:checked')) {
                    nextButton.removeAttribute('disabled')
                } else {
                    nextButton.setAttribute('disabled', '')
                }

                prevButton.removeAttribute('disabled')

                if (current.nextElementSibling.matches(':last-child')) {
                    submitButton.style.display = "block"
                    skip.style.display = "none"
                }
            })

            prevButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                current.classList.remove('visible')
                current.previousElementSibling?.classList.add('visible')

                if (current.previousElementSibling.querySelector('input:checked')) {
                    nextButton.removeAttribute('disabled')
                }

                if (current.getAttribute('data-index') == 2) {
                    prevButton.setAttribute('disabled', '')
                }

                if (current.previousElementSibling.matches(':last-child')) {
                    submitButton.style.display = "block"
                    skip.style.display = "none"
                } else {
                    submitButton.style.display = "none"
                    skip.style.display = "block"
                }
            })

            submitButton.addEventListener("click", () => {
                document.querySelector('.quiz__content').style.display = 'none'
                document.querySelector('.quiz__footer').style.display = 'none'
                document.querySelector('.modal__actions').style.display = 'none'
                skip.style.display = 'none'

                htmlQuestions.forEach(q => {
                    q.classList.add('hidden')
                })

                this.summary(program, correctAnswers+1, htmlQuestions.length)
            })

            htmlQuestions.forEach((q, i) => {
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
                            correctAnswers += 1
                        }

                        nextButton.removeAttribute('disabled')
                    })
                })
            })
        }
    }

    summary(program, correctAnswers, numberOfQuestions) {
        const parent = document.querySelector('.quiz')
        const container = document.createElement('div')
        container.classList.add('quiz__summary')

        const heading = document.createElement('h2')
        heading.innerText = _s.miniGames.completed.title

        const phrase = document.createElement('p')
        phrase.innerHTML = correctAnswers + ' / ' + numberOfQuestions

        const continueButton = document.createElement('button')
        continueButton.classList.add('button', 'button__secondary')
        continueButton.innerText = _s.miniGames.continue

        continueButton.addEventListener('click', () => {
            quiz.modal.destroy()
            program.advance()
        })

        container.appendChild(heading)
        container.appendChild(phrase)
        container.appendChild(continueButton)
        parent.appendChild(container)
    }
}