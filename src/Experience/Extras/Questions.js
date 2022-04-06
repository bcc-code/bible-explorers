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
            let selectedEpisode = world.selectedEpisode
            let localStorageId = 'answers-theme-' + selectedEpisode.id
            let allAnswersFromTheme = JSON.parse(localStorage.getItem(localStorageId)) || {}

            const questions = selectedEpisode.program[currentStep].questions

            let html = `
                <div class="modal__content questions ">
                    <div class="questions__header"><i></i><h1>${_s.questions}</h1></div>
                    <div class="questions__content">`

            questions.forEach((question, index) => {
                html += `<div class="question >
                                <span class="question__label"> Question ${index + 1} / ${questions.length}</span>
                                <div class="question__title">${question.title}</div>
                                <textarea class="question__textarea" rows="8" placeholder="${question.placeholder}">${allAnswersFromTheme.hasOwnProperty(currentStep) ? allAnswersFromTheme[currentStep][index] : ''}</textarea>
                            </div>`
            })

            html += `</div>
                </div>

                <div class="modal__footer ${questions.length == 1 ? "hide-nav" : ""}">
                    <div class="btn btn__prev"></div>
                    <div id="submit-task" class="btn btn__submit">${_s.submit}</div>
                    <div class="btn btn__next"></div>
                </div>
            `;

            questions.modal = new Modal(html)

            const nextButton = document.querySelector('.btn__next')
            const prevButton = document.querySelector('.btn__prev')
            const submitButton = document.querySelector('.btn__submit')

            document.querySelectorAll('.question')[0].classList.add('visible')

            prevButton.classList.add('disabled')

            if (questions.length > 1) {
                submitButton.classList.add('disabled')
            } 

            nextButton.addEventListener("mousedown", () => {
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

            prevButton.addEventListener("mousedown", () => {
                const current = document.querySelector('.question.visible')
                current.classList.remove('visible')
                current.previousElementSibling?.classList.add('visible')

                if (current.previousElementSibling.matches(':first-child')) {
                    prevButton.classList.add('disabled')
                } else {
                    nextButton.classList.remove('disabled')
                }
            })

            submitButton.addEventListener("mousedown", () => {
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


    toggleVisibleQuestion() {

    }
}