import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'
import Calculator from '../Extras/Calculator.js'

let instance = null

export default class TaskDescriptionWithCalculatorScreen {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.offline = new Offline()
        instance.calculator = new Calculator()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.calculator_screen
        instance.experience.setAppView('task-description')

        instance.setHtml()
        if (instance.data.cs_image) instance.useCorrectAssetsSrc()

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'cs_image', (data) => {
            document.querySelector('#task-image img').src = data.td_image
        })
    }

    setHtml() {
        const container = _gl.elementFromHtml(
            `<div class="absolute inset-0 task-container" id="task-container">
                <div class="task-container_box">
                    <h5 class="task-container_heading">${instance.data.td_title !== '' ? instance.data.td_title : ''}</h1>
                    ${instance.data.td_description ? `<p class="task-container_prompts">${instance.data.td_description}</p>` : ''}
                    ${instance.data.td_image ? `<div class="task-container_tutorial" id="task-image"><img src="${instance.data.td_image}" /></div>` : ''}
                    ${instance.data.td_button !== '' ? `<div class="task-container_actions"><button class="button button-task_action">${instance.data.td_button}</button></div>` : ''}
                </div>
            </div>`
        )

        const nextStep = container.querySelector('button')
        if (nextStep) nextStep.addEventListener('click', instance.program.nextStep)

        instance.experience.interface.tasksDescription.append(container)

        instance.calculator.show(container.querySelector('.task-container_box'))

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = `button button-arrow-skip`
    }

    destroy() {
        document.querySelector('#task-container')?.remove()
        instance.experience.setAppView('chapter')
        instance.calculator.remove()

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button button-arrow'
    }
}
