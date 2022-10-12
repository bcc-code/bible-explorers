import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'

let instance = null

export default class CodeAndIris {
    constructor() {
        this.experience = new Experience()
        instance = this
    }

    toggleCodeAndIris() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.world = instance.experience.world
            instance.program = instance.world.program
            instance.currentStep = instance.program.currentStep
            instance.selectedChapter = instance.world.selectedChapter
            instance.data = instance.selectedChapter.program[instance.currentStep].codeAndIris
            instance.currentStepData = instance.selectedChapter.program[instance.currentStep]

            instance.toggleIris()
        }
    }

    toggleIris() {
        const html = instance.program.taskDescription.getModalHtml('iris-and-code', instance.data.iris)
        instance.modal = new Modal(html)
        document.querySelector('.modal').classList.add('modal__task')

        if (!instance.currentStepData.audio)
            document.getElementById("play").remove()

        const back = document.getElementById("back")
        back.style.display = 'block'
        back.innerText = _s.journey.back
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code, true)
        })

        const next = document.getElementById('continue')
        next.style.display = 'block'
        next.innerText = _s.task.next
        next.addEventListener("click", () => {
            instance.modal.destroy()
            instance.world.program.advance()
        })
    }
}