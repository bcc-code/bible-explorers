import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"

let instance = null

export default class Message {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.navigation = instance.experience.navigation
    }

    show(text = '', character = '') {
        instance.destroy()
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.message

        if (!text) text = instance.data.text
        if (!character) character = instance.data ? instance.data.character : 'iris'

        instance.setHtml(text, character)
        instance.setEventListeners()
    }

    setHtml(text, character) {
        document.querySelector('.ui-container').append(
            _gl.elementFromHtml(
                `<section class="message">
                    <div class="container">
                        <header class="message-header">
                            <span>${character}</span>
                        </header>
                        <div class="content">
                            ${text}
                        </div>
                    </div>
                </section>`
            )
        )
    }

    setEventListeners() {
        instance.experience.navigation.prev.addEventListener("click", instance.destroy)
        instance.experience.navigation.next.addEventListener("click", instance.destroy)
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener("click", instance.destroy)
        instance.experience.navigation.next.removeEventListener("click", instance.destroy)
    }

    destroy() {
        document.querySelector('section.message')?.remove()
        instance.removeEventListeners()
    }
}