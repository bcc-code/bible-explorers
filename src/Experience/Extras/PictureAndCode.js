import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'

let instance = null

export default class PictureAndCode {
    constructor() {
        this.experience = new Experience()
        instance = this
    }

    togglePictureAndCode() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.world = instance.experience.world
            instance.program = instance.world.program
            instance.currentStep = instance.program.currentStep
            instance.selectedChapter = instance.world.selectedChapter
            instance.data = instance.selectedChapter.program[instance.currentStep].pictureAndCode
            instance.currentStepData = instance.selectedChapter.program[instance.currentStep]
            instance.togglePicture()
        }
    }

    togglePicture() {
        let pictureEl = document.createElement("div")
        pictureEl.className = "picture-and-code"
        pictureEl.innerHTML = `
            <img src='${instance.data.picture}' />
            <div class="modal__actions">
                <div id="backBTN" class="button button__default"><span>${_s.journey.back}</span></div>
                <div id="get-task" class="button button__continue"><div class="button__content"><span>${_s.task.next}</span></div></div>
            </div>    
        `
        document.body.appendChild(pictureEl)

        const backBtn = document.getElementById("backBTN")
        const getTaskBtn = document.getElementById('get-task')

        backBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            document.querySelector('.picture-and-code').remove()
            instance.program.taskDescription.toggleTaskDescription()
        })

        getTaskBtn.addEventListener("click", () => {
            document.querySelector('.picture-and-code').remove()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code)
        })
    }
}