import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"

let instance = null

export default class Dialogue {
    constructor() {
        instance = this
        instance.experience = new Experience()
    }

    init() {
        const dialogueBox = _gl.elementFromHtml(
            `<section class="dialogue">
                <header class="dialogue-header">
                    <span>${instance.message.character}</span>
                </header>
                <div class="dialogue-box">
                    ${instance.message.text}
                </div>
            </section>`
        )

        const container = document.querySelector('.ui-container')
        container.append(dialogueBox)

    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.data = instance.program.getCurrentStepData()
        instance.message = instance.data.message

        instance.init()

        const nextCTA = document.querySelector('[aria-label="next page"]')
        nextCTA.style.display = 'block'
        nextCTA.addEventListener("click", () => {
            instance.program.nextStep()
            console.log('click');
        })
    }
}