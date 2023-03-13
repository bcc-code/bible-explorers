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
            instance.currentCheckpoint = instance.program.currentCheckpoint
            instance.selectedChapter = instance.world.selectedChapter
            instance.currentStepData = instance.program.getCurrentStepData()
            instance.question = instance.currentStepData.question_and_code
            instance.localStorageId = 'answers-theme-' + instance.selectedChapter.id
            instance.toggleQuestion()
        }
    }

    toggleQuestion() {
        instance.allAnswersFromTheme = JSON.parse(localStorage.getItem(instance.localStorageId)) || {}

        const answersWrapper = `
        <div class="answers__wrapper">
            <div class="answers__field"><input type="text" class="answers__input" /></div>
            <div class="answers__field"><input type="text" class="answers__input" /></div>
            <div class="answers__field"><input type="text" class="answers__input" /></div>
            <div class="answers__field"><input type="text" class="answers__input" /></div>
        </div>`
        const html = instance.program.taskDescription.getModalHtml('question-and-code', instance.question, answersWrapper)
        instance.modal = new Modal(html, 'modal__task')

        if (!instance.currentStepData.audio)
            document.getElementById("play").remove()

        const back = document.getElementById("back")
        back.innerText = _s.journey.back
        back.style.display = 'block'
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.previousStep()
        })

        const next = document.getElementById('continue')
        next.innerText = _s.task.next
        next.style.display = 'block'
        next.addEventListener("click", () => {
            instance.saveAnswers()
            instance.modal.destroy()
            instance.program.nextStep()
        })

        let allInputsEmpty = true
        instance.el = {}

        instance.el.inputs = document.querySelectorAll('.answers__input')
        instance.el.inputs.forEach((input, index) => {
            input.value = instance.allAnswersFromTheme.hasOwnProperty(instance.currentCheckpoint) ? instance.allAnswersFromTheme[instance.currentCheckpoint][index] : ''

            if (index == 0) input.focus()
            if (input.value.length != 0) allInputsEmpty = false

            input.addEventListener("input", () => {
                [...instance.el.inputs].filter(input => input.value.length == 0).length == 0
                    ? next.classList.remove('disabled')
                    : next.classList.add('disabled')
            })
        })

        if (allInputsEmpty) {
            next.classList.add('disabled')
        }
    }

    saveAnswers() {
        const initialAnswers = instance.allAnswersFromTheme[instance.currentCheckpoint]

        // Save answers to Local Storage
        let thisTaskAnswers = []
        instance.el.inputs.forEach((input) => {
            thisTaskAnswers.push(input.value)
        })

        instance.allAnswersFromTheme[instance.currentCheckpoint] = thisTaskAnswers
        localStorage.setItem(instance.localStorageId, JSON.stringify(instance.allAnswersFromTheme))

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
    }
}