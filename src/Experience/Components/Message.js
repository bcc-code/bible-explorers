import Experience from '../Experience'
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

        if (instance.data.audio) instance.audio.togglePlayTaskDescription(instance.data.audio)

        if (instance.data.video) {
            instance.video.load('texture-' + instance.data.video)
            instance.video.play()
        }
    }

    setHtml(caption, character) {
        const message = _gl.elementFromHtml(`<div id="iris-cc"><h1 class="text-bke-orange uppercase">${character} </h1><div>${caption}</div></div>`)
        instance.experience.interface.closedCaption.append(message)

        if (instance.data.character == 'glitch') {
            const glitch = _gl.elementFromHtml('<video id="glitch-idle" src="textures/glitch_idle_v2.mp4" muted autoplay loop></video>')
            document.querySelector('#closed-caption').append(glitch)
        }

        if (instance.data.open_question === true) {
            // instance.experience.navigation.next.disabled = true
            const openQuestion = _gl.elementFromHtml(
                `<div id="open-question">
                    <textarea class="question-textarea" rows="8" placeholder="${_s.task.openQuestion}"></textarea>
                </div`
            )
            document.querySelector('#closed-caption').append(openQuestion)

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
        document.querySelector('#iris-cc')?.remove()
        document.querySelector('#open-question')?.remove()
    }
}
