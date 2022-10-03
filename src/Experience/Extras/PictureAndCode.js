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
        document.querySelector('.picture-and-code').style.backgroundImage = 'url("' + url + '")'
    }

    togglePicture() {
        let pictureEl = document.createElement("div")
        pictureEl.classList.add('picture-and-code', 'container')
        pictureEl.innerHTML = `
            <div class="container__wrapper"></div>
            <div class="container__footer">
                <button id="back" class="button button__primary">${_s.journey.back}</button>
                <button id="continue" class="button button__secondary">${_s.task.next}</button>
            </div>    
        `
        document.body.appendChild(pictureEl)

        pictureEl.style.backgroundImage = "url('" + instance.data.picture + "')"
        pictureEl.style.backgroundRepeat = 'no-repeat'
        pictureEl.style.backgroundSize = 'cover'

        const back = document.getElementById("back")
        const next = document.getElementById('continue')

        back.style.display = 'block'
        next.style.display = 'block'

        back.addEventListener('click', (e) => {
            e.stopPropagation()
            document.querySelector('.picture-and-code').remove()
            instance.program.taskDescription.toggleTaskDescription()
        })

        next.addEventListener("click", () => {
            document.querySelector('.picture-and-code').remove()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code)
        })
    }
}