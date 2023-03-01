import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

let instance = null

export default class Pause {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
    }

    togglePause() {
        instance.program = instance.world.program

        const pauseHTML = _gl.elementFromHtml(`
            <aside class="pause">
                <div class="container">
                    <span>${_s.journey.pause.title}</span>
                    <p>${_s.journey.pause.message}</p>
                </div>
                <div class="overlay"></div>
            </aside>
        `)

        document.body.append(pauseHTML)
        instance.setEventListeners()
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.querySelector('.pause')?.remove()
    }
}