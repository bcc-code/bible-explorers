import Experience from '../Experience.js'
import Frame from './Frame.js'
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
            instance.audio.playSound('glitch-bzz')
        }

        const irisFrame = new Frame({
            edgeTop: `<div class="cc-character">${character}</div>`,
            content: `<div id="iris-cc">
                <div class="cc-text scroller">${caption}</div>
            </div>`,
        })
        const message = _gl.elementFromHtml(
            `<div class="cc-container">
                ${irisFrame.getHtml()}
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
        instance.audio.stopSound('glitch-bzz')
        instance.experience.interface.helperScreen.innerHTML = ''
    }
}
