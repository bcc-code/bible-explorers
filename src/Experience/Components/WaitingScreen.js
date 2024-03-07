import Experience from '../Experience'
import _gl from '../Utils/Globals'
import _e from '../Utils/Events.js'

let instance = null

export default class WaitingScreen {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.names = [] // Moved names array initialization here
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.video = instance.program.video

        const id = instance.world.selectedChapter.lobby_video_loop
        instance.video.load('lobby-video-' + id)
        instance.video.play()

        if (instance.experience.interface.smallScreen.querySelector('#add-names-form')) return

        const wrapper = _gl.elementFromHtml(`<div class="p-2 xl:p-4 tv:p-8 flex flex-col h-full" id="names-form"></div>`)
        const form = _gl.elementFromHtml(
            `<form id="add-names-form">
                <input class="w-full h-12 bg-white text-bke-darkpurple outline-none text-lg px-4 mb-4"/>
                <button type="submit" class="button-normal w-full">Submit name</button>
            </form>`
        )

        const nameLabelContainer = _gl.elementFromHtml('<ul class="mt-4 flex-1 overflow-y-auto" id="names-label"></ul>')

        wrapper.append(form, nameLabelContainer)
        instance.experience.interface.smallScreen.setAttribute('data-view', '')
        instance.experience.interface.smallScreen.append(wrapper)

        form.querySelector('button').addEventListener('click', (e) => {
            e.preventDefault()
            instance.handleFormSubmission(form, nameLabelContainer)
        })

        form.querySelector('input').addEventListener('keyup', (e) => {
            e.preventDefault()
            if (e.key === 'Enter') {
                instance.handleFormSubmission(form, nameLabelContainer)
            }
        })

        instance.experience.navigation.next.removeEventListener('click', instance.program.nextStep)
        instance.experience.navigation.next.addEventListener('click', instance.destroy)
    }

    handleFormSubmission(form, container) {
        const inputVal = form.querySelector('input').value.trim() // Trim input value to remove leading/trailing spaces

        // Check if input value is not empty and not already in the names array before appending
        if (inputVal && !instance.names.includes(inputVal)) {
            instance.names.push(inputVal)
            const nameLabel = _gl.elementFromHtml(`<li class="relative bg-white text-bke-darkpurple text-lg px-6 py-3 mb-4 mr-4 inline-block">${inputVal}<span class="absolute top-0 right-0 px-2 cursor-pointer">×</span></li>`)
            container.append(nameLabel)
            console.log(instance.names)

            const removeButton = nameLabel.querySelector('span')
            removeButton.addEventListener('click', () => {
                instance.handleRemoveName(nameLabel, inputVal)

                console.log(instance.names)
            })
        }

        form.querySelector('input').value = '' // Reset input field regardless of whether name was added or not
    }

    handleRemoveName(nameLabel, name) {
        nameLabel.remove()
        const index = instance.names.indexOf(name)
        if (index !== -1) {
            instance.names.splice(index, 1)
        }
    }

    destroy() {
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)

        instance.video?.defocus()

        // Remove form event listeners
        const form = instance.experience.interface.smallScreen.querySelector('#add-names-form')
        form.querySelector('button').removeEventListener('click', instance.handleFormSubmission)
        form.querySelector('input').removeEventListener('keyup', instance.handleFormSubmission)

        // Remove all nameLabel event listeners
        const removeButtons = instance.experience.interface.smallScreen.querySelectorAll('span')
        removeButtons.forEach((removeButton) => {
            removeButton.removeEventListener('click', instance.handleRemoveName)
        })

        // Remove all elements appended to smallScreen
        instance.experience.interface.smallScreen.querySelector('#names-form').remove()
        instance.experience.interface.smallScreen.setAttribute('data-view', 'map')

        instance.program.toggleStep()
    }
}
