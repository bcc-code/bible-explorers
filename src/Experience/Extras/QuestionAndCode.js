import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'

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
            instance.currentStep = instance.program.currentStep
            instance.selectedChapter = instance.world.selectedChapter
            instance.data = instance.selectedChapter.program[instance.currentStep].questionAndCode
            instance.currentStepData = instance.selectedChapter.program[instance.currentStep]
            instance.toggleQuestion()
        }
    }

    toggleQuestion() {
        const localStorageId = 'answers-theme-' + instance.selectedChapter.id
        let allAnswersFromTheme = JSON.parse(localStorage.getItem(localStorageId)) || {}

        const answersWrapper = `
        <div class="answers__wrapper">
            <div class="answers__field"><input type="text" class="answers__input" /></div>
            <div class="answers__field"><input type="text" class="answers__input" /></div>
            <div class="answers__field"><input type="text" class="answers__input" /></div>
            <div class="answers__field"><input type="text" class="answers__input" /></div>
        </div>`
        const html = instance.program.taskDescription.getModalHtml('question-and-code', instance.data.question, answersWrapper)
        instance.modal = new Modal(html, 'modal__task')

        if (!instance.currentStepData.audio)
            document.getElementById("play").remove()

        const back = document.getElementById("back")
        back.innerText = _s.journey.back
        back.style.display = 'block'
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.taskDescription.toggleTaskDescription()
        })

        const next = document.getElementById('continue')
        next.innerText = _s.task.next
        next.style.display = 'block'
        next.addEventListener("click", () => {
            const initialAnswers = allAnswersFromTheme[instance.currentStep]

            // Save answers to Local Storage
            let thisTaskAnswers = []
            inputs.forEach((input) => {
                thisTaskAnswers.push(input.value)
            })

            allAnswersFromTheme[instance.currentStep] = thisTaskAnswers
            localStorage.setItem(localStorageId, JSON.stringify(allAnswersFromTheme))

            if (JSON.stringify(initialAnswers) != JSON.stringify(thisTaskAnswers)) {
                fetch(_api.saveAnswer(), {
                    method: "POST",
                    body: JSON.stringify({
                        answer: thisTaskAnswers,
                        chapterId: instance.selectedChapter.id,
                        chapterTitle: instance.selectedChapter.title,
                        language: _lang.getLanguageCode()
                    })
                })
            }

            instance.modal.destroy()
            instance.toggleSubmitMessage()
        })

        let allInputsEmpty = true

        const inputs = document.querySelectorAll('.answers__input')
        inputs.forEach((input, index) => {
            input.value = allAnswersFromTheme.hasOwnProperty(instance.currentStep) ? allAnswersFromTheme[instance.currentStep][index] : ''

            if (index == 0) input.focus()
            if (input.value.length != 0) allInputsEmpty = false

            input.addEventListener("input", () => {
                [...inputs].filter(input => input.value.length == 0).length == 0
                    ? next.classList.remove('disabled')
                    : next.classList.add('disabled')
            })
        })

        if (allInputsEmpty) {
            next.classList.add('disabled')
        }
    }

    toggleSubmitMessage() {
        const html = instance.program.taskDescription.getModalHtml('question-and-code', instance.data.submit_message)
        instance.modal = new Modal(html, 'modal__task')

        if (!instance.currentStepData.audio)
            document.getElementById("play").remove()

        const back = document.getElementById("back")
        back.innerText = _s.journey.back
        back.style.display = 'block'
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.toggleQuestion()
        })

        const next = document.getElementById('continue')
        next.innerText = _s.task.next
        next.style.display = 'block'
        next.addEventListener("click", () => {
            instance.modal.destroy()
            instance.toggleCodeDescription()
        })
    }

    toggleCodeDescription() {
        const html = instance.program.taskDescription.getModalHtml('question-and-code', instance.data.code_description)
        instance.modal = new Modal(html, 'modal__task')

        if (!instance.currentStepData.audio)
            document.getElementById("play").remove()

        const back = document.getElementById("back")
        back.innerText = _s.journey.back
        back.style.display = 'block'
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.toggleSubmitMessage()
        })

        const next = document.getElementById('continue')
        next.innerText = _s.task.next
        next.style.display = 'block'
        next.addEventListener("click", () => {
            instance.modal.destroy()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code)

            const back = document.getElementById("back")
            back.addEventListener('click', (e) => {
                instance.modal.destroy()
                instance.toggleCodeDescription()
            })
        })
    }
}