import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Dialogue {
    constructor() {
        instance = this
        instance.offline = new Offline()
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
    }

    toggle() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.message = instance.program.message
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.dialog

        instance.setHtml()
        instance.setEventListeners()
    }

    setHtml() {
        const dialogue = _gl.elementFromHtml(`
            <section class="dialogue">
                <div class="content">
                    ${instance.data
                        .map(
                            (dialog) => `
                        <div class="question">
                            <p>${dialog.question}</p>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </section>
        `)

        instance.experience.interface.helperScreen.append(dialogue)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = `button button-arrow-skip`
        instance.experience.navigation.next.disabled = false
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const buttons = document.querySelectorAll('.dialogue .question')
        buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
                buttons.forEach((button) => button.classList.remove('current'))

                // Remove previous message
                document.querySelector('.message-from-dialogue')?.remove()

                // Add visited class
                button.classList.add('visited')
                button.classList.add('current')

                // Check if all were visited
                if (document.querySelectorAll('.dialogue .question.visited').length == buttons.length) {
                    instance.experience.navigation.next.disabled = false
                    instance.experience.navigation.next.className = 'button button-arrow'
                    instance.experience.navigation.next.innerHTML = ''
                }

                instance.setMessageHtml(instance.data[index].answer)

                if (instance.data[index].audio) {
                    // Fetch audio from blob or url
                    instance.offline.fetchChapterAsset(instance.data[index], 'audio', (data) => {
                        instance.answerAudio = data.audio
                        instance.audio.stopAllTaskDescriptions()
                        instance.audio.togglePlayTaskDescription(instance.answerAudio)
                    })
                }
            })
        })
    }

    setMessageHtml(caption) {
        document.getElementById('iris-cc')?.remove()

        const message = _gl.elementFromHtml(
            `<div id="iris-cc"><span>Iris</span><div class="flex-1 scroller flex items-center justify-center max-h-[65%]"><div class="overflow-y-auto max-h-full max-w-full">${caption}</div></div></div>`
        )
        instance.experience.interface.closedCaption.append(message)
    }

    destroy() {
        document.querySelector('.dialogue')?.remove()
        document.querySelector('.message-from-dialogue')?.remove()

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button button-arrow'
    }
}
