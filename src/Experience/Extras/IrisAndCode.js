import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'

let instance = null

export default class IrisAndCode {
    constructor() {
        this.experience = new Experience()
        instance = this
    }

    toggleIrisAndCode() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.world = instance.experience.world
            instance.program = instance.world.program
            instance.currentStep = instance.program.currentStep
            instance.selectedChapter = instance.world.selectedChapter
            instance.data = instance.selectedChapter.program[instance.currentStep].irisAndCode
            instance.currentStepData = instance.selectedChapter.program[instance.currentStep]
            instance.toggleIris()
        }
    }

    toggleIris() {
        const html = instance.program.taskDescription.getModalHtml('iris-and-code', instance.data.iris)
        instance.modal = new Modal(html)
        document.querySelector('.modal').classList.add('modal__task')

        const backBtn = document.getElementById("backBTN")
        const getTaskBtn = document.getElementById('get-task')

        if (!instance.currentStepData.audio)
            playBTN.remove()

        backBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.taskDescription.toggleTaskDescription()
        })

        getTaskBtn.addEventListener("click", () => {
            instance.modal.destroy()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code)

            const backBtn = document.getElementById("backBTN")
            backBtn.addEventListener('click', (e) => {
                instance.modal.destroy()
                instance.toggleIris()
            })
        })
    }
}