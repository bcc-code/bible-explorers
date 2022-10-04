import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
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
            instance.offline = instance.world.offline
            instance.program = instance.world.program
            instance.currentStep = instance.program.currentStep
            instance.selectedChapter = instance.world.selectedChapter
            instance.data = instance.selectedChapter.program[instance.currentStep].pictureAndCode

            instance.offline.fetchChapterAsset(instance.data, "picture", (data) => this.setPicture(data.picture))

            instance.currentStepData = instance.selectedChapter.program[instance.currentStep]
            instance.togglePicture()
        }
    }

    setPicture(url) {
        instance.data.picture = url
        document.querySelector('.picture-and-code img').setAttribute('src', instance.data.picture)
    }

    togglePicture() {
        let html = `<div class="modal__content picture-and-code">
            <div class="picture-and-code__content">
                <img src="">
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__picture-and-code')

        const back = document.getElementById("back")
        back.style.display = 'block'
        back.innerText = _s.journey.back
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.taskDescription.toggleTaskDescription()
        })

        const next = document.getElementById("continue")
        next.style.display = 'block'
        next.innerText = _s.task.next
        next.addEventListener("click", () => {
            instance.modal.destroy()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code)
        })
    }
}