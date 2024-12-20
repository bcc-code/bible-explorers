import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Frame from './Frame.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class MessageWithSupportingScreens {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.offline = new Offline()
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
        instance.useCorrectAssetsSrc()

        instance.setEventListeners()

        if (instance.data.character_audio) {
            instance.audio.togglePlayTaskDescription(instance.data.character_audio)
        }

        if (instance.data.video) {
            instance.video.load('texture-' + instance.data.video)
        }
    }

    setHtml(caption, character) {
        const captionFrame = new Frame({
            edgeTop: `<div class="cc-character">${character}</div>`,
            content: `<div id="iris-cc">
                    <div class="cc-text scroller">${caption}</div>
                </div>`,
        })
        const closedCaption = _gl.elementFromHtml(
            `<div class="cc-container">
                ${captionFrame.getHtml()}
            </div>`
        )

        instance.experience.interface.closedCaption.append(closedCaption)

        if (instance.data.character == 'glitch') {
            const glitch = _gl.elementFromHtml(
                '<video id="glitch-idle" src="textures/glitch_idle_v2.mp4" muted autoplay loop></video>'
            )
            document.querySelector('#closed-caption').append(glitch)
            instance.audio.playSound('glitch-bzz')
        }

        if (instance.data.with_lever) {
            instance.experience.interface.helperScreen.innerHTML = ''

            const rightScreenEl = _gl.elementFromHtml(
                `<video id="interactive-lever" src="textures/switch_action_ANIM.mp4" autoplay loop></video>`
            )
            rightScreenEl.addEventListener('click', this.leverClickEvent)

            instance.experience.interface.helperScreen.append(rightScreenEl)
        } else if (instance.data.right_screen) {
            instance.experience.interface.helperScreen.innerHTML = ''
            instance.experience.interface.helperScreen.append(
                _gl.elementFromHtml(this.getDomElement(instance.data.right_screen))
            )
        }
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()

        if (['mp4', 'mov', 'webm'].includes(ext))
            return `<video src="${url}" id="message-video" width="100%" height="100%" frameBorder="0" autoplay loop></video>`
        else return `<img src="${url}" id="message-image" />`
    }

    useCorrectAssetsSrc() {
        if (instance.data.right_screen) {
            const ext = instance.data.right_screen.split('.').pop().toLowerCase()
            const elId = ['mp4', 'mov', 'webm'].includes(ext) ? '#message-video' : '#message-image'

            instance.offline.fetchChapterAsset(instance.data, 'right_screen', (data) => {
                const domEl = document.querySelector(elId)
                if (domEl) {
                    // Check if the element exists
                    domEl.src = data.right_screen
                }
            })
        }
    }

    leverClickEvent = () => {
        const interactiveLever = document.getElementById('interactive-lever')
        interactiveLever.loop = false
        interactiveLever.src = 'textures/switch_activate_ANIM_V002.mp4'

        interactiveLever.removeEventListener('click', this.leverClickEvent)

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
            interactiveImage.remove()
            instance.experience.interface.helperScreen.setAttribute('data-view', 'map')
        }

        instance.video?.defocus()
        document.querySelector('.cc-container')?.remove()
        instance.audio.stopSound('glitch-bzz')

        instance.experience.interface.helperScreen.innerHTML = ''

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
