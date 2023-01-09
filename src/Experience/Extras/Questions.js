import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class Questions {
    constructor() {
        instance = this
        this.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug
    }

    toggleQuestions() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.program = instance.world.program
            instance.stepData = instance.program.getCurrentStepData()
            instance.data = instance.stepData.questions

            let html = `<div class="modal__content task questions">
                <div class="task__content">`
                    instance.data.forEach((question, index) => {
                        html += `<div class="question">
                            <span class="question__label"> Question ${index + 1} / ${instance.data.length}</span>
                            <div class="question__title">${question.title}</div>
                            <textarea class="question__textarea" rows="8" placeholder="${question.placeholder}"></textarea>
                        </div>`
                    })
                html += `</div>
            </div>

            <div class="modal__footer ${instance.data.length == 1 ? "hide-nav" : ""}">
                <div class="button button__prev button__round"><div class="button__content"><i class="icon icon-arrow-left-long-solid"></i></div></div>
                <div id="submit-task" class="button button__submit button__default"><span>${_s.task.submit}</span></div>
                <div class="button button__next button__round"><div class="button__content"><i class="icon icon-arrow-right-long-solid"></i></div></div>
            </div>`

            instance.modal = new Modal(html, 'modal__questions')

            const nextButton = document.querySelector('.button__next')
            const prevButton = document.querySelector('.button__prev')
            const submitButton = document.querySelector('.button__submit')

            document.querySelectorAll('.question')[0].classList.add('visible')

            prevButton.classList.add('disabled')

            if (instance.data.length > 1) {
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

                allAnswersFromTheme[currentCheckpoint] = thisThemeAnswers
                localStorage.setItem(localStorageId, JSON.stringify(allAnswersFromTheme))
                instance.modal.destroy()
                program.nextStep()
            })
        }
    }
}