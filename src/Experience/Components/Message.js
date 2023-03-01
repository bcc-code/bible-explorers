import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"
import _e from "../Utils/Events.js"

let instance = null

export default class Message {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
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

        if (instance.data.audio)
            instance.audio.togglePlayTaskDescription(instance.data.audio)
    }

    setHtml(text, character) {
        document.querySelector('.ui-container').append(
            _gl.elementFromHtml(
                `<section class="message">
                    <div class="container">
                        <div class="content">
                            <h2>${character}</h2>
                            ${text}
                        </div>
                    </div>
                </section>`
            )
        )

        if (instance.data.character == 'glitch') {
            document.querySelector('section.message .container').append(
                _gl.elementFromHtml('<video id="glitch-idle" src="textures/BIEX_Glitch_Idle_HD_v2.mp4" muted autoplay loop></video>')
            )
        }

        if (instance.data.open_question === true) {
            document.querySelector('.ui-container').append(
                _gl.elementFromHtml(
                    `<section class="open-question">
                        <div class="container">
                            <div class="content">
                                <textarea class="question-textarea" rows="8" placeholder="${_s.task.openQuestion}"></textarea>
                            </div>
                        </div>
                    </section>`
                )
            )
        }
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.querySelector('section.message')?.remove()
        document.querySelector('section.open-question')?.remove()
    }
}