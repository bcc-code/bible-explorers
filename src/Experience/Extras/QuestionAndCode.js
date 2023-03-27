import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

let instance = null

export default class QuestionAndCode {
    constructor() {
        this.experience = new Experience()
        instance = this
    }

    toggleQuestionAndCode() {
        instance.world = instance.experience.world
        instance.debug = instance.experience.debug
        instance.program = instance.world.program
        instance.currentCheckpoint = instance.program.currentCheckpoint
        instance.selectedChapter = instance.world.selectedChapter
        instance.currentStepData = instance.program.getCurrentStepData()
        instance.question = instance.currentStepData.question_and_code
        instance.localStorageId = 'answers-theme-' + instance.selectedChapter.id
        instance.toggleQuestion()
    }

    toggleQuestion() {
        instance.allAnswersFromTheme = JSON.parse(localStorage.getItem(instance.localStorageId)) || {}

        const answersWrapper = _gl.elementFromHtml(`
        <div class="game answers">
            <div class="container">
                <button class="btn default" aria-label="skip-button" style="display: none">${_s.miniGames.skip}</button>
                <form>
                    <label for="answer1">1</label>
                    <input type="text" id="answer1" />
                    <label for="answer2">2</label>
                    <input type="text" id="answer2" />
                    <label for="answer3">3</label>
                    <input type="text" id="answer3" />
                    <label for="answer4">4</label>
                    <input type="text" id="answer4" />
                </form>
            </div>
            <div class="overlay"></div>
        </div>`)

        document.querySelector('.ui-container').append(answersWrapper)


        const skipBTN = document.querySelector('[aria-label="skip-button"]')
        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })

        if (instance.debug.developer || instance.debug.onPreviewMode())
            skipBTN.style.display = 'flex'

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        let allInputsEmpty = true

        instance.el = {}
        instance.el.inputs = document.querySelectorAll('.answers input')
        instance.el.inputs.forEach((input, index) => {
            input.value = instance.allAnswersFromTheme.hasOwnProperty(instance.currentCheckpoint) ? instance.allAnswersFromTheme[instance.currentCheckpoint][index] : ''

            if (index == 0) input.focus()
            if (input.value.length != 0) allInputsEmpty = false

            input.addEventListener("input", () => {
                [...instance.el.inputs].filter(input => input.value.length == 0).length == 0
                    ? instance.experience.navigation.next.disabled = false
                    : instance.experience.navigation.next.disabled = true

            })
        })

        if (allInputsEmpty)
            instance.experience.navigation.next.disabled = true


        instance.experience.navigation.next.addEventListener('click', () => {
            instance.saveAnswers()
        })

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

    destroy() {
        document.removeEventListener('click', instance.saveAnswers)
        document.querySelector('.game')?.remove()
    }
}