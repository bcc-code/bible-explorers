import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Button from './Button.js'
import Frame from './Frame.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class TaskDescriptionScreen {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.task_description_screen

        instance.experience.setAppView('task-description')

        instance.setHtml()

        if (instance.data.td_image) {
            instance.useCorrectAssetsSrc()
        }

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHtml() {
        const tdBtn = new Button({
            content: instance.data.td_button,
        })
        const taskHeading = new Frame({
            content: instance.data.td_title !== '' ? instance.data.td_title : '',
        })
        const taskContainerFrame = new Frame({
            content: `<div class="task-content">
                    <h5 class="task-heading">
                        ${taskHeading.getHtml()}
                    </h5>
                    ${instance.data.td_description ? `<p class="task-prompts">${instance.data.td_description}</p>` : ''}
                    ${instance.data.td_image ? `<div class="task-tutorial">${instance.getDomElement(instance.data.td_image)}</div>` : ''}
                    ${
                        instance.data.td_button !== ''
                            ? `<div class="task-actions">
                                ${tdBtn.getHtml()}
                            </div>`
                            : ''
                    }
                </div>`,
        })
        const container = _gl.elementFromHtml(
            `<div class="task-container" id="task-container">
                ${taskContainerFrame.getHtml()}
            </div>`
        )

        const nextStep = container.querySelector('button')
        if (nextStep) nextStep.addEventListener('click', instance.program.nextStep)

        instance.experience.interface.tasksDescription.append(container)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'td_image', (data) => {
            const imageElement = document.querySelector('#task-image')
            if (imageElement) {
                // Check if the element exists
                imageElement.src = data.td_image
            }
        })
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()

        if (['mp4', 'mov', 'webm'].includes(ext))
            return `<video src="${url}" width="100%" height="100%" frameBorder="0" autoplay loop></video>`
        else return `<img src="${url}" id="task-image" />`
    }

    destroy() {
        document.querySelector('#task-container')?.remove()
        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
    }
}
