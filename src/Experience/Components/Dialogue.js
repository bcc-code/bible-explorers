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
        instance.experience.navigation.prev.addEventListener("click", instance.destroy)
        instance.experience.navigation.next.addEventListener("click", instance.destroy)

        const buttons = document.querySelectorAll('.dialogue .content button')
        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                instance.setMessageHtml(instance.data[index].answer)

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

    setMessageHtml(text) {
        document.querySelector('.ui-container').append(
            _gl.elementFromHtml(
                `<section class="message-from-dialogue">
                    <div class="container">
                        <header class="message-header">
                            <span>Iris</span>
                        </header>
                        <div class="content">
                            ${text}
                        </div>
                    </div>
                </section>`
            )
        )
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener("click", instance.destroy)
        instance.experience.navigation.next.removeEventListener("click", instance.destroy)
    }

    destroy() {
        document.querySelector('.dialogue')?.remove()
        document.querySelector('.message-from-dialogue')?.remove()
        instance.removeEventListeners()
    }
}