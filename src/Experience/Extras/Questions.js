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

            let html = `
                <div class="modal__content questions">
                    <div class="questions__header"><i></i><h1>${ _s.questions }</h1></div>
                    <div class="questions__content">`

                        selectedEpisode.program[currentStep].questions.forEach((question, index) => {
                            html += `<div class="question">
                                <div class="title">${ question.title }</div>
                                <textarea rows="8" placeholder="${ question.placeholder }">${ allAnswersFromTheme.hasOwnProperty(currentStep) ? allAnswersFromTheme[currentStep][index] : '' }</textarea>
                            </div>`
                        })

                    html += `</div>
                </div>

                <div id="submit-task" class="btn">${ _s.submit }</div>
            `;

            questions.modal = new Modal(html)
            document.getElementById("submit-task").addEventListener("mousedown", () => {
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