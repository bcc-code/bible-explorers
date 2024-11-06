import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class GlitchHelp {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.glitch_help

        instance.experience.setAppView('task-description')

        instance.setHtml()
        instance.setEventListeners()
    }

    setHtml() {
        const container = _gl.elementFromHtml(
            `<div class="task-container glitch-help-task" id="task-container">
                <div class="corner top-left"></div>
                <div class="edge top"></div>
                <div class="corner top-right"></div>
                <div class="edge left"></div>
                <div class="content">
                    <div class="task-content">
                        <h5 class="task-heading">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">
                                ${instance.data.title !== '' ? instance.data.title : ''}
                            </div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </h5>
                        ${instance.data.description ? `<p class="task-prompts text-center whitespace-pre-wrap">${instance.data.description}</p>` : ''}
                        ${
                            instance.data.confirmation_button !== ''
                                ? `
                        <div class="task-actions">
                            <button class="button-grid">
                                <div class="corner top-left"></div>
                                <div class="edge top"></div>
                                <div class="corner top-right"></div>
                                <div class="edge left"></div>
                                <div class="content">${instance.data.confirmation_button}</div>
                                <div class="edge right"></div>
                                <div class="corner bottom-left"></div>
                                <div class="edge bottom"></div>
                                <div class="corner bottom-right"></div>
                            </button>
                        </div>
                        `
                                : ''
                        }
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>`
        )

        const glitchCharacter = _gl.elementFromHtml(
            `<div class="glitch-help">
                <div id="glitch-character">
                    <video id="glitch-character-idle" src="games/glitch-help/Glitch_WEB_Oppgave3_Loop_v003.webm" muted autoplay loop></video>
                    <video id="glitch-character-popup" src="games/glitch-help/Glitch_WEB_Oppgave3_Start_v003.webm" muted></video>
                </div>
                <div id="open-guide" class="cursor-pointer">${instance.data.get_hint_button}</div>
                <div id="glitch-guide">${instance.data.hint}</div>
            </div>`
        )

        const nextStep = container.querySelector('button')
        if (nextStep) nextStep.addEventListener('click', instance.program.nextStep)

        instance.experience.interface.tasksDescription.append(container)
        instance.experience.interface.tasksDescription.append(glitchCharacter)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
    }

    setEventListeners() {
        const glitchCharacter = document.querySelector('#glitch-character')
        glitchCharacter.addEventListener('mouseover', () => {
            if (
                glitchCharacter.classList.contains('hovering') ||
                glitchCharacter.classList.contains('active')
            ) {
                return
            }

            glitchCharacter.classList.add('hovering')

            const characterPopup = document.querySelector('#glitch-character-popup')
            const characterIdle = document.querySelector('#glitch-character-idle')

            characterIdle.style.opacity = 0
            characterPopup.style.opacity = 1
            characterPopup.currentTime = 0
            characterPopup.play()
        })
        document.querySelector('#glitch-character-popup').addEventListener('ended', () => {
            const characterPopup = document.querySelector('#glitch-character-popup')
            const characterIdle = document.querySelector('#glitch-character-idle')

            var fadeEffect = setInterval(function () {
                if (characterPopup.style.opacity > 0) {
                    characterPopup.style.opacity = parseFloat(characterPopup.style.opacity) - 0.1
                    characterIdle.style.opacity = parseFloat(characterIdle.style.opacity) + 0.1
                } else {
                    characterPopup.style.opacity = 0
                    characterIdle.style.opacity = 1
                    clearInterval(fadeEffect)
                }
            }, 10)
        })
        glitchCharacter.addEventListener('mouseleave', () => {
            glitchCharacter.classList.remove('hovering')
        })

        // Get age category
        instance.ageCategory = instance.world.selectedChapter.category

        if (instance.ageCategory === '6-8') {
            setTimeout(() => {
                instance.showOpenGuide()
            }, 500)
        } else {
            // Show guide after 60 seconds otherwise
            setTimeout(() => {
                instance.showOpenGuide()
            }, 60 * 1000)
        }

        document.querySelector('#glitch-character').addEventListener('click', instance.showOpenGuide)
        document.querySelector('#open-guide').addEventListener('click', instance.popGlitchGuide)

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    showOpenGuide() {
        document.querySelector('#glitch-character').classList.add('active')
        document.querySelector('#open-guide').style.display = 'block'
    }

    popGlitchGuide() {
        document.querySelector('#open-guide').style.display = 'none'
        document.querySelector('#glitch-guide').style.display = 'block'
    }

    destroy() {
        document.querySelector('#task-container')?.remove()
        document.querySelector('.glitch-help')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
    }
}
