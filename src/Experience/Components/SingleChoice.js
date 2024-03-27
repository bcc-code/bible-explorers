import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class SingleChoice {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.single_choice

        instance.experience.setAppView('game')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button-arrow'
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.setHTML()
    }

    setHTML() {
        const optionsHtml = instance.data.options.map((o, index) => `<li class="single-choice-option cursor-pointer hover:bg-white/10 rounded-xl p-[5%]" data-index="${index}"><img src="${o.option_media}"/> <h2 class="text-center">${o.option_text}</h2></li>`).join('')

        const container = _gl.elementFromHtml(
            `<div class="absolute inset-0 grid place-content-center task-container" id="single-choice">
                <div class="relative mx-auto task-container_box grid place-content-center text-center">
                    ${instance.data.title ? `<h1 class="task-container_heading">${instance.data.title}</h1>` : ''}
                    ${instance.data.description ? `<p class="task-container_prompts">${instance.data.description}</p>` : ''}
                    ${optionsHtml ? `<ul class="flex gap-8 mt-8">${optionsHtml}</ul>` : ''}
                </div>
            </div>`
        )

        instance.experience.interface.gameContainer.append(container)

        document.querySelectorAll('.single-choice-option').forEach((option) => {
            option.addEventListener('click', instance.handleOptionSelect)
        })
    }

    handleOptionSelect = (event) => {
        const selectedIndex = event.currentTarget.dataset.index
        const selectedOptionElement = event.currentTarget
        const selectedOption = instance.data.options[selectedIndex]

        if (selectedOption.option_statement) {
            // If the option is correct
            instance.audio.playSound('correct')
            instance.experience.celebrate({ particleCount: 100, spread: 160 })
            instance.experience.navigation.next.className = 'button-arrow'

            selectedOptionElement.classList.add('bg-white/10')

            // Disable further clicks on options
            document.querySelectorAll('.single-choice-option').forEach((option) => {
                option.removeEventListener('click', instance.handleOptionSelect)
                // Optionally add a class to visually indicate the options are disabled
                option.classList.add('pointer-events-none')
            })
        } else {
            // If the option is incorrect
            instance.audio.playSound('wrong')
        }
    }

    destroy() {
        document.querySelectorAll('.single-choice-option').forEach((option) => {
            option.removeEventListener('click', instance.handleOptionSelect)
        })

        document.querySelector('#single-choice')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button-arrow'
    }
}
