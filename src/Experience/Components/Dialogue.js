import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

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
            const option = _gl.elementFromHtml(`
                <button class="question">
                    <p>${dialog.question}</p>
                </button>`
            )
            dialogue.querySelector('.content').append(option)
        })

        document.querySelector('.ui-container').append(dialogue)

        instance.experience.navigation.next.classList.remove('focused')

        if (instance.debug.developer || instance.debug.onPreviewMode()) {
            instance.experience.navigation.next.innerHTML = _s.miniGames.skip
            instance.experience.navigation.next.disabled = false
        } else {
            instance.experience.navigation.next.disabled = true
        }
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const buttons = document.querySelectorAll('.dialogue .content button')
        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                buttons.forEach(button => button.classList.remove('current'))

                // Remove previous message
                document.querySelector('.message-from-dialogue')?.remove()

                // Add visited class
                button.classList.add('visited')
                button.classList.add('current')

                // Check if all were visited
                if (document.querySelectorAll('.dialogue .content button.visited').length == buttons.length) {
                    instance.experience.navigation.next.disabled = false
                    instance.experience.navigation.next.classList.add('focused')
                    instance.experience.navigation.next.innerHTML = instance.experience.icons.next
                }

                instance.setMessageHtml(instance.data[index].answer)

                if (instance.data[index].audio) {
                    // Fetch audio from blob or url
                    instance.offline.fetchChapterAsset(instance.data[index], "audio", (data) => {
                        instance.answerAudio = data.audio
                        instance.audio.stopAllTaskDescriptions()
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
                        <div class="content">
                            <h2>Iris</h2>
                            ${text}
                        </div>
                    </div>
                </section>`
            )
        )
    }

    destroy() {
        document.querySelector('.dialogue')?.remove()
        document.querySelector('.message-from-dialogue')?.remove()

        instance.experience.navigation.next.classList.add('focused')
        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
    }
}