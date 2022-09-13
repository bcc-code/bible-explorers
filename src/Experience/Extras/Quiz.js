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
            let world = this.experience.world
            let program = world.program
            let currentStep = program.currentStep
            let selectedChapter = world.selectedChapter

            const questions = selectedChapter.program[currentStep].quiz

            let html = `<div class="modal__content quiz">
                            <div class="quiz__header heading">
                                <h2>${_s.task.questions}</h2>
                            </div>
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
                                <textarea class="question__textarea" rows="8" placeholder="åpent spørsmål; ikke noe riktig eller feil"></textarea>
                            </div>`
                }

                html += `</div>`

                if (q.picture) {
                    html += `<div class="question__picture" ><img src="${q.picture}"></div>`
                }

                html += `</div>`
            })

            html += `</div></div>`
            html += `<div class="modal__footer ${questions.length == 1 ? "hide - nav" : ""}">
                        <div class="button button__prev button__round">
                            <span class="button__content">
                                <i class="icon icon-arrow-left-long-solid"></i>
                            </span>
                        </div>
                        <div id = "submit-task" class="button button__submit button__default">
                            <span>${_s.task.submit}</span>
                        </div>
                        <div class="button button__next button__round">
                            <span class="button__content">
                                <i class="icon icon-arrow-right-long-solid"></i>
                            </span>
                        </div>
                    </div>`

            quiz.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__quiz')

            const nextButton = document.querySelector('.button__next')
            const prevButton = document.querySelector('.button__prev')
            const submitButton = document.querySelector('.button__submit')

            const htmlQuestions = document.querySelectorAll('.question')

            htmlQuestions[0].classList.add('visible')
            nextButton.classList.add('hidden')
            prevButton.classList.add('hidden')
            submitButton.classList.add('hidden')

            nextButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                current.classList.remove('visible')
                current.nextElementSibling?.classList.add('visible')

                if (current.nextElementSibling.querySelector('input:checked')) {
                    nextButton.classList.remove('hidden')
                } else {
                    nextButton.classList.add('hidden')
                }

                prevButton.classList.remove('hidden')

                if (current.nextElementSibling.matches(':last-child')) {
                    submitButton.classList.remove('hidden')
                }
            })

            prevButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                current.classList.remove('visible')
                current.previousElementSibling?.classList.add('visible')

                console.log(current.previousElementSibling.querySelector('input:checked'));

                if (current.previousElementSibling.querySelector('input:checked')) {
                    nextButton.classList.remove('hidden')
                }

                if (current.getAttribute('data-index') == 2) {
                    console.log('has', current.getAttribute('data-index') == 2);
                    prevButton.classList.add('hidden')
                }

                if (current.previousElementSibling.matches(':last-child')) {
                    submitButton.classList.remove('hidden')
                } else {
                    submitButton.classList.add('hidden')
                }
            })

            submitButton.addEventListener("click", () => {
                quiz.modal.destroy()
                program.advance()
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
                        }

                        nextButton.classList.remove('hidden')
                    })
                })


            })
        }
    }
}