import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Pause {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
    }

    togglePause() {
        instance.setHtml()
        instance.audio.playSound('task-completed')
        instance.experience.celebrate({
            particleCount: 100,
            spread: 160,
        })
        instance.setEventListeners()
    }

    setHtml() {
        const pauseHTML = _gl.elementFromHtml(`
            <aside class="pause">
                <div class="container">
                    <div class="chapter-progress">
                        <progress max="3" value="1"></progress>
                        <ul>
                            <li class="filled">
                                <svg viewBox="0 0 29 29">
                                    <use href="#star"></use>
                                </svg>
                            </li>
                            <li>
                                <svg viewBox="0 0 29 29">
                                    <use href="#star"></use>
                                </svg>
                            </li>
                            <li>
                                <svg viewBox="0 0 29 29">
                                    <use href="#star"></use>
                                </svg>
                            </li>
                        </ul>
                    </div>
                    <span>${_s.journey.pause.title}</span>
                    <p>${_s.journey.pause.message}</p>
                </div>
                <div class="overlay"></div>
            </aside>
        `)

        document.getElementById('chapter-wrapper').append(pauseHTML)
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.querySelector('.pause')?.remove()
    }
}
