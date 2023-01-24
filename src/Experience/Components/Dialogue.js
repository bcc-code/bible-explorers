import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Dialogue {
    constructor() {
        instance = this
        instance.offline = new Offline()
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
    }

    toggle() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.message = instance.program.message
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.dialog

        instance.setHtml()
        instance.setEventListeners()
    }

    setHtml() {
        const dialogue = _gl.elementFromHtml(`
            <section class="dialogue">
                <div class="container">
                    <div class="content"></div>
                </div>
            </section>
        `)

        instance.data.forEach(dialog => {
            const option = _gl.elementFromHtml(`<button class="btn default bordered">${dialog.question}</button>`)
            dialogue.querySelector('.content').append(option)
        })

        document.querySelector('.ui-container').append(dialogue)
    }

    setEventListeners() {
        instance.experience.navigation.prev.addEventListener("click", instance.prevListeners)
        instance.experience.navigation.next.addEventListener("click", instance.nextListeners)

        const buttons = document.querySelectorAll('.dialogue .content button')
        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                instance.message.show(instance.data[index].answer)

                if (instance.data[index].audio) {
                    // Fetch audio from blob or url
                    instance.offline.fetchChapterAsset(instance.data[index], "audio", (data) => {
                        instance.answerAudio = data.audio
                        instance.audio.togglePlayTaskDescription(instance.answerAudio)
                    })
                }
            })
        })
    }

    prevListeners() {
        instance.destroy()
        instance.program.previousStep()
    }

    nextListeners() {
        instance.destroy()
        instance.program.nextStep()
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener("click", instance.prevListeners)
        instance.experience.navigation.next.removeEventListener("click", instance.nextListeners)
    }

    destroy() {
        instance.message.destroy()
        document.querySelector('.dialogue')?.remove()
        instance.removeEventListeners()
    }
}