import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class MessageWithSupportingScreens {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.resources = instance.experience.resources
        instance.audio = instance.world.audio
        instance.navigation = instance.experience.navigation
    }

    show(caption = '', character = '') {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.video = instance.program.video
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.message_with_supporting_screens

        if (!caption) caption = instance.data.closed_caption
        if (!character) character = instance.data ? instance.data.character : 'iris'

        instance.setHtml(caption, character)
        instance.setEventListeners()

        if (instance.data.character_audio) instance.audio.togglePlayTaskDescription(instance.data.character_audio)

        if (instance.data.video) {
            instance.video.load('texture-' + instance.data.video)
            instance.video.play()
        }
    }

    setHtml(caption, character) {
        const closedCaption = _gl.elementFromHtml(`<div id="iris-cc"><h1 class="text-bke-orange uppercase">${character} </h1><div>${caption}</div></div>`)

        instance.experience.interface.closedCaption.append(closedCaption)

        if (instance.data.character == 'glitch') {
            const glitch = _gl.elementFromHtml('<video id="glitch-idle" src="textures/glitch_idle_v2.mp4" muted autoplay loop></video>')
            document.querySelector('#closed-caption').append(glitch)
        }

        if (instance.data.right_screen) {
            instance.experience.interface.helperScreen.innerHTML = ''

            instance.experience.interface.helperScreen.append(_gl.elementFromHtml(`<img src="${instance.data.right_screen}" />`))
        } else if (instance.data.with_lever) {
            instance.experience.interface.helperScreen.innerHTML = ''

            const rightScreenEl = _gl.elementFromHtml(`<video id="interactive-lever" src="textures/switch_action_ANIM.mp4" autoplay loop></video>`)
            rightScreenEl.addEventListener('click', this.leverClickEvent)

            instance.experience.interface.helperScreen.append(rightScreenEl)
        }
    }

    leverClickEvent = () => {
        const interactiveLever = document.getElementById('interactive-lever')
        interactiveLever.loop = false
        interactiveLever.src = 'textures/switch_activate_ANIM.mp4'

        interactiveLever.addEventListener('ended', function () {
            instance.program.nextStep()
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        const interactiveImage = document.getElementById('interactive-lever')
        if (interactiveImage) {
            interactiveImage.removeEventListener('click', this.leverClickEvent)
            interactiveImage.remove()
            instance.experience.interface.helperScreen.setAttribute('data-view', 'map')
        }

        instance.video?.defocus()
        document.querySelector('#iris-cc')?.remove()

        instance.experience.interface.helperScreen.innerHTML = ''

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
