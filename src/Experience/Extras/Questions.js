import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let questions = null

export default class Questions {
    constructor() {
        this.experience = new Experience()
        questions = this
    }

    toggleQuestions() {
        if (document.querySelector('.modal')) {
            questions.modal.destroy()
        }
        else {
            let world = this.experience.world
            let program = world.program
            let currentStep = program.currentStep
            let selectedChapter = world.selectedChapter
            let localStorageId = 'answers-theme-' + selectedChapter.id
            let allAnswersFromTheme = JSON.parse(localStorage.getItem(localStorageId)) || {}

            const questions = selectedChapter.program[currentStep].questions

            let html = `
                <div class="modal__content questions ">
                    <div class="questions__header heading"><i class="icon icon-question-solid"></i><span>${_s.task.questions}</span></div>
                    <div class="questions__content">`

            questions.forEach((question, index) => {
                html += `<div class="question">
                                <span class="question__label"> Question ${index + 1} / ${questions.length}</span>
                                <div class="question__title">${question.title}</div>
                                <textarea class="question__textarea" rows="8" placeholder="${question.placeholder}">${allAnswersFromTheme.hasOwnProperty(currentStep) ? allAnswersFromTheme[currentStep][index] : ''}</textarea>
                            </div>`
            })

            html += `</div>
                </div>

                <div class="modal__footer ${questions.length == 1 ? "hide-nav" : ""}">
                    <div class="button button__prev button__round"><i class="icon icon-arrow-left-long-solid"></i></div>
                    <div id="submit-task" class="button button__submit button__default"><span>${_s.task.submit}</span></div>
                    <div class="button button__next button__round"><i class="icon icon-arrow-right-long-solid"></i></div>
                </div>
            `;

            questions.modal = new Modal(html)

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
                // Save answers to Local Storage
                let thisThemeAnswers = []

                document.querySelectorAll('.questions textarea').forEach((answer) => {
                    thisThemeAnswers.push(answer.value)
                })

                allAnswersFromTheme[currentStep] = thisThemeAnswers
                localStorage.setItem(localStorageId, JSON.stringify(allAnswersFromTheme))
                questions.modal.destroy()
                program.advance()
            })


        }
    }
}