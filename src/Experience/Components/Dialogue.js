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

        const nextCta = _gl.elementFromHtml(
            `<button class="btn default bordered" aria-label="next step">${_s.task.next}</button>`
        )
        nextCta.addEventListener("click", () => {
            instance.program.nextStep()
        })

        const hudContainer = document.querySelector('.hud-container')
        hudContainer.append(dialogueBox)

        const ctaContainer = document.querySelector('.hud-container .cta')
        ctaContainer.append(nextCta)
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.data = instance.program.getCurrentStepData()
        instance.message = instance.data.message

        instance.init()
    }

    hide() {

    }
}