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

            console.log(selectedChapter.program[currentStep])
            const questions = selectedChapter.program[currentStep].quiz

            let html = `<div class="modal__content quiz">
                <div class="quiz__header heading"><h2>${_s.task.questions}</h2></div>
                <div class="quiz__content">`
                    questions.forEach((q, qIdx) => {
                        html += `<div class="question">
                            <span class="question__label">Question ${qIdx + 1} / ${questions.length}</span>
                            <div class="question__title">${q.question}</div>`

                            if (q.answers.length) {
                                q.answers.forEach((a, aIdx) => {
                                    html += `<input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}" data-correct="${a.correct_wrong}" />
                                    <label for="question-${qIdx}_answer-${aIdx}">${a.answer}</label>`
                                })
                            }
                            else {
                                html += `<textarea class="question__textarea" rows="8" placeholder="åpent spørsmål; ikke noe riktig eller feil"></textarea>`
                            }
                        html += `</div>`
                    })
                html += `</div>
            </div>

            <div class="modal__footer ${questions.length == 1 ? "hide-nav" : ""}">
                <div class="button button__prev button__round"><div class="button__content"><i class="icon icon-arrow-left-long-solid"></i></div></div>
                <div id="submit-task" class="button button__submit button__default"><span>${_s.task.submit}</span></div>
                <div class="button button__next button__round"><div class="button__content"><i class="icon icon-arrow-right-long-solid"></i></div></div>
            </div>`

            quiz.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__quiz')

            const nextButton = document.querySelector('.button__next')
            const prevButton = document.querySelector('.button__prev')
            const submitButton = document.querySelector('.button__submit')

            document.querySelectorAll('.question')[0].classList.add('visible')

            prevButton.classList.add('disabled')

            if (questions.length > 1) {
                submitButton.classList.add('disabled')
            }

            nextButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                current.classList.remove('visible')
                current.nextElementSibling?.classList.add('visible')

                if (current.nextElementSibling.matches(':last-child')) {
                    nextButton.classList.add('disabled')
                    submitButton.classList.remove('disabled')
                } else {
                    prevButton.classList.remove('disabled')
                }
            })

            prevButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                current.classList.remove('visible')
                current.previousElementSibling?.classList.add('visible')

                if (current.previousElementSibling.matches(':first-child')) {
                    prevButton.classList.add('disabled')
                } else {
                    nextButton.classList.remove('disabled')
                }
            })

            submitButton.addEventListener("click", () => {
                quiz.modal.destroy()
                program.advance()
            })
        }
    }
}