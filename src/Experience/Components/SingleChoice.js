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

        instance.experience.setAppView('task-description')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`

        instance.setHTML()
        instance.useCorrectAssetsSrc()

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHTML() {
        const optionsHtml = instance.data.options
            .map(
                (o, index) =>
                    `<li class="single-choice-option cursor-pointer hover:bg-white/10 rounded-xl p-[5%]" data-index="${index}">
                <img src="${o.option_media}"/>
                <p class="text-center">${o.option_text}</p>
            </li>`
            )
            .join('')

        const container = _gl.elementFromHtml(
            `<div class="task-container" id="single-choice">
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
                            <div class="content">${instance.data.title}</div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </h5>
                         ${instance.data.description ? `<p class="task-prompts">${instance.data.description}</p>` : ''}
                        ${optionsHtml ? `<ul class="flex gap-8 mt-8">${optionsHtml}</ul>` : ''}
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>`
        )

        instance.experience.interface.tasksDescription.append(container)

        document.querySelectorAll('.single-choice-option').forEach((option) => {
            option.addEventListener('click', instance.handleOptionSelect)
        })
    }

    useCorrectAssetsSrc() {
        instance.data.options.forEach((option, index) => {
            instance.offline.fetchChapterAsset(option, 'option_media', (data) => {
                document.querySelector('.single-choice-option[data-index="' + index + '"] img').src = data.option_media
            })
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

            selectedOptionElement.classList.add('bg-white/10')
            instance.experience.navigation.next.innerHTML = ``
            instance.experience.navigation.next.className = 'button button-arrow active'

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
    }
}
