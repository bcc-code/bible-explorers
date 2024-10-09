import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Message {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.resources = instance.experience.resources
        instance.audio = instance.world.audio
        instance.navigation = instance.experience.navigation
    }

    show(caption = '', character = '') {
        instance.destroy()
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.video = instance.program.video
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.message

        if (!caption) caption = instance.data.text
        if (!character) character = instance.data ? instance.data.character : 'iris'

        instance.setHtml(caption, character)
        instance.setEventListeners()

        if (instance.data.audio) {
            instance.audio.togglePlayTaskDescription(instance.data.audio)
        }

        if (instance.data.video) {
            instance.video.load('texture-' + instance.data.video)
        } else {
            instance.video.setNoVideoPlaying()
        }
    }

    setHtml(caption, character) {
        if (instance.data.character == 'glitch') {
            const glitch = _gl.elementFromHtml(
                '<video id="glitch-idle" src="textures/Glitch_WEB_Recap_v003.webm" muted autoplay loop></video>'
            )
            document.querySelector('#chapter-wrapper').append(glitch)
        }

        const message = _gl.elementFromHtml(
            `<div class="cc-container">
                <div class="corner top-left"></div>
                <div class="edge top">
                    <div class="cc-character">${character}</div>
                </div>
                <div class="corner top-right"></div>
                <div class="edge left"></div>
                <div class="content">
                    <div id="iris-cc">
                        <div class="cc-text">${caption}</div>
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>`
        )
        instance.experience.interface.closedCaption.append(message)

        if (instance.data.open_question === true) {
            // instance.experience.navigation.next.disabled = true
            const openQuestion = _gl.elementFromHtml(
                `<section class="dialogue">
                        <div class="content">
                            <div id="open-question">
                                <textarea class="question-textarea" rows="8" placeholder="${_s.task.openQuestion}"></textarea>
                            </div
                        </div>
                </section>`
            )

            instance.experience.interface.helperScreen.append(openQuestion)

            const textarea = openQuestion.querySelector('textarea')
            textarea.addEventListener('input', (e) => {
                instance.experience.navigation.next.disabled = e.target.value.length <= 2
            })
        }
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        instance.video?.defocus()
        document.querySelector('#glitch-idle')?.remove()
        document.querySelector('.cc-container')?.remove()
        instance.experience.interface.helperScreen.innerHTML = ''
    }
}
