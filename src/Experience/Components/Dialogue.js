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

    init() {
        const dialogue = _gl.elementFromHtml(`
            <section class="dialogue">
                <div class="container">
                    <div class="content"></div>
                </div>
            </section>
        `)

        const optionsLength = instance.data.dialog.length

        for (let i = 0; i < optionsLength; i++) {
            const option = _gl.elementFromHtml(`<button class="btn default bordered">Option label</button>`)
            dialogue.querySelector('.content').append(option)
        }

        document.querySelector('.ui-container').append(dialogue)
    }

    toggle() {
        instance.program = instance.experience.world.program
        instance.data = instance.program.getCurrentStepData()

        instance.init()
        instance.eventListeners()
    }

    eventListeners() {
        const prevCTA = document.querySelector('[aria-label="prev page"]')
        prevCTA.disabled = false

        const nextCTA = document.querySelector('[aria-label="next page"]')
        nextCTA.addEventListener("click", () => {
            instance.program.nextStep()
        })
    }
}