import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"

let instance = null

export default class Message {
    constructor() {
        instance = this
        instance.experience = new Experience()
    }

    init() {
        const dialogueBox = _gl.elementFromHtml(
            `<section class="message">
                <div class="container">
                    <header class="message-header">
                        <span>${instance.message.character}</span>
                    </header>
                    <div class="content">
                        ${instance.message.text}
                    </div>
                </div>
            </section>`
        )

        document.querySelector('.ui-container').append(dialogueBox)

    }

    toggle() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.data = instance.program.getCurrentStepData()
        instance.message = instance.data.message

        instance.init()
        instance.eventListeners()

    }


    eventListeners() {
        const prevCTA = document.querySelector('[aria-label="prev page"]')
        prevCTA.disabled = true

        const nextCTA = document.querySelector('[aria-label="next page"]')
        nextCTA.disabled = false
        nextCTA.addEventListener("click", () => {
            instance.program.nextStep()
        })
    }
}