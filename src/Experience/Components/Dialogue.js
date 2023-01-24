import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Dialogue {
    constructor() {

        instance = this
        instance.experience = new Experience()
        instance.debug = this.experience.debug
    }

    toggle() {
        instance.program = instance.experience.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.dialog

        instance.init()
        instance.eventListeners()
    }

    init() {
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

    eventListeners() {
        const prevCTA = document.querySelector('[aria-label="prev page"]')
        prevCTA.disabled = false

        const nextCTA = document.querySelector('[aria-label="next page"]')
        nextCTA.addEventListener("click", () => {
            instance.program.nextStep()
        })

        const buttons = document.querySelectorAll('.dialogue .content button')
        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
            })
        })
    }
}