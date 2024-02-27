'use strict'

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

        instance.calculator.show()
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'cs_image', (data) => {
            document.querySelector('#task-image img').src = data.td_image
        })
    }

    setHtml() {
        console.log(instance.data)
        const container = _gl.elementFromHtml(
            `<div class="absolute inset-0 bg-bke-darkpurple grid place-content-center" id="task-container">
                <div class="relative mx-auto max-w-[1980px] px-4 pb-4 pt-24 tv:gap-8 tv:px-8 tv:pt-32">
                    <h1 class="text-2xl tv:text-3xl font-bold text-center mb-4">${instance.data.td_title !== '' ? instance.data.td_title : ''}</h1>
                    ${instance.data.td_description ? `<p class="text-xl text-center">${instance.data.td_description}</p>` : ''}
                    ${instance.data.td_image ? `<div class="aspect-video max-w-[600px] mt-8 mx-auto" id="task-image"><img src="${instance.data.td_image}" width="100%" height="100%" class="h-full" /></div>` : ''}
                    ${instance.data.td_button !== '' ? `<div class="flex justify-center mt-8"><button class="button-normal">${instance.data.td_button}</button></div>` : ''}
                </div>
            </div>`
        )

        const nextStep = container.querySelector('button')

        if (nextStep) nextStep.addEventListener('click', instance.program.nextStep)

        instance.experience.interface.tasksDescription.append(container)

        instance.experience.navigation.next.innerHTML = _s.miniGames.skip
        instance.experience.navigation.next.className = 'button-normal less-focused'
    }

    destroy() {
        document.querySelector('#task-container')?.remove()
        instance.experience.setAppView('chapter')
        instance.calculator.remove()

        instance.experience.navigation.next.className = 'button-normal shadow-border'
        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
    }
}
