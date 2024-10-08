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
                            <div class="content">${instance.data.td_title !== '' ? instance.data.td_title : ''}</div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </h5>
                        ${instance.data.td_description ? `<p class="task-prompts">${instance.data.td_description}</p>` : ''}
                        ${instance.data.td_image ? `<div class="task-tutorial" id="task-image"><img src="${instance.data.td_image}" /></div>` : ''}
                        ${instance.data.td_button !== '' ? `
                            <div class="task-actions">
                                <button class="button-grid">
                                    <div class="corner top-left"></div>
                                    <div class="edge top"></div>
                                    <div class="corner top-right"></div>
                                    <div class="edge left"></div>
                                    <div class="content">${instance.data.td_button}</div>
                                    <div class="edge right"></div>
                                    <div class="corner bottom-left"></div>
                                    <div class="edge bottom"></div>
                                    <div class="corner bottom-right"></div>
                                </button>
                            </div>` : ''}
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
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
