import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class ConfirmationScreen {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.confirmation_screen

        instance.experience.setAppView('task-description')

        instance.setHtml()
        if (instance.data.cs_image) instance.useCorrectAssetsSrc()

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'cs_image', (data) => {
            document.querySelector('#task-image img').src = data.cs_image
        })
    }

    setHtml() {
        const container = _gl.elementFromHtml(
            `<div class="absolute inset-0 bg-bke-darkpurple grid place-content-center" id="task-container">
                <div class="relative mx-auto max-w-[1980px] px-4 pb-4 pt-24 tv:gap-8 tv:px-8 tv:pt-32">
                    <h1 class="text-2xl tv:text-3xl font-bold text-center mb-4">${instance.stepData.details.title}</h1>
                    ${instance.stepData.details.prompts ? `<p>${instance.stepData.details.prompts[0].prompt}</p>` : ''}
                    ${instance.data.cs_image ? `<div class="aspect-video max-w-[600px] mt-8 mx-auto" id="task-image"><img src="${instance.data.cs_image}" width="100%" height="100%" class="h-full" /></div>` : ''}
                    ${instance.data.cs_button !== '' ? `<div class="flex justify-center mt-8"><button class="button-normal">${instance.data.cs_button}</button></div>` : ''}
                </div>
            </div>`
        )

        const nextStep = container.querySelector('button')

        if (nextStep) nextStep.addEventListener('click', instance.program.nextStep)

        instance.experience.interface.tasksDescription.append(container)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
    }

    destroy() {
        document.querySelector('#task-container')?.remove()
        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
    }
}
