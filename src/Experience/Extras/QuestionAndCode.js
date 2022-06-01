import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class QuestionAndCode {
    constructor() {
        this.experience = new Experience()
        instance = this
    }

    toggleQuestionAndCode() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.world = instance.experience.world
            instance.program = instance.world.program

            const currentStep = instance.program.currentStep
            const selectedChapter = instance.world.selectedChapter

            instance.data = selectedChapter.program[currentStep].question_and_code

            instance.toggleQuestion()
        }
    }

    toggleQuestion() {
        const currentStep = instance.program.currentStep
        const selectedChapter = instance.world.selectedChapter
        const localStorageId = 'answers-theme-' + selectedChapter.id
        let allAnswersFromTheme = JSON.parse(localStorage.getItem(localStorageId)) || {}

        const questionTextarea = `<textarea class="question__textarea" rows="2"></textarea>`
        const html = instance.program.taskDescription.getModalHtml(instance.data.question, questionTextarea)
        instance.modal = new Modal(html)
        document.querySelector('.modal').classList.add('modal__task')

        const input = document.querySelector('.question__textarea')
        const backBtn = document.getElementById("backBTN")
        const getTaskBtn = document.getElementById('get-task')

        backBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.taskDescription.toggleTaskDescription()
        })

        input.value = allAnswersFromTheme.hasOwnProperty(currentStep) ? allAnswersFromTheme[currentStep] : ''
        input.focus()
        if (input.textLength == 0) {
            getTaskBtn.classList.add('disabled')
        }
        input.addEventListener("input", () => {
            input.textLength == 0
                ? getTaskBtn.classList.add('disabled')
                : getTaskBtn.classList.remove('disabled')
        })

        getTaskBtn.addEventListener("click", () => {
            // Save answers to Local Storage
            allAnswersFromTheme[currentStep] = input.value
            localStorage.setItem(localStorageId, JSON.stringify(allAnswersFromTheme))

            instance.modal.destroy()
            instance.toggleSubmitMessage()
        })
    }

    toggleSubmitMessage() {
        const html = instance.program.taskDescription.getModalHtml(instance.data.submit_message)
        instance.modal = new Modal(html)
        document.querySelector('.modal').classList.add('modal__task')

        const backBtn = document.getElementById("backBTN")
        const getTaskBtn = document.getElementById('get-task')

        backBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.toggleQuestion()
        })

        getTaskBtn.addEventListener("click", () => {
            instance.modal.destroy()
            instance.toggleCodeDescription()
        })
    }

    toggleCodeDescription() {
        const html = instance.program.taskDescription.getModalHtml(instance.data.code_description)
        instance.modal = new Modal(html)
        document.querySelector('.modal').classList.add('modal__task')

        const backBtn = document.getElementById("backBTN")
        const getTaskBtn = document.getElementById('get-task')

        backBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.toggleSubmitMessage()
        })

        getTaskBtn.addEventListener("click", () => {
            instance.modal.destroy()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code)

            const backBtn = document.getElementById("backBTN")
            backBtn.addEventListener('click', (e) => {
                instance.modal.destroy()
                instance.toggleCodeDescription()
            })
        })
    }
}