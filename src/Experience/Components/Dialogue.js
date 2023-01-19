import Experience from "../Experience"
import _s from "../Utils/Strings.js"

let instance = null

export default class Dialogue {
    constructor() {

        instance = this
        instance.experience = new Experience()
        instance.program = instance.experience.world.program

    }

    elementFromHtml(html) {
        const template = document.createElement('template')

        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    init() {
        const dialogueBox = instance.elementFromHtml(
            `<section class="dialogue">
                <header class="dialogue-header">
                    <span>Iris</span>
                </header>
                <div class="dialogue-box">
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis, placeat nostrum? Laborum totam laboriosam incidunt beatae, delectus consequuntur enim accusamus?</p>
                </div>
            </section>`
        )

        const nextCta = instance.elementFromHtml(
            `<button class="btn default bordered" aria-label="next step">Next</button>`
        )

        const hudContainer = document.querySelector('.hud-container')
        hudContainer.append(dialogueBox)

        const ctaContainer = document.querySelector('.hud-container .cta')
        ctaContainer.append(nextCta)
    }

    show() {
        // instance.currentStepData = instance.program.getCurrentStepData()
        // console.log(instance.program);
        instance.init()
    }

    hide() {

    }
}