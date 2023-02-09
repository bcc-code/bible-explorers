import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

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
        instance.experience.navigation.prev.addEventListener("click", instance.destroy)
        instance.experience.navigation.next.addEventListener("click", instance.destroy)
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener("click", instance.destroy)
        instance.experience.navigation.next.removeEventListener("click", instance.destroy)
    }

    destroy() {
        document.querySelector('.pause')?.remove()
        instance.removeEventListeners()
    }
}