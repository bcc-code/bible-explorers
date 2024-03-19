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
        // instance.video = instance.program.video

        // const id = instance.world.selectedChapter.lobby_video_loop
        // instance.video.load('lobby-video-' + id)
        // instance.video.play()

        instance.video = document.createElement('video')
        instance.video.setAttribute('src', './textures/CR_Loop.mp4')
        instance.video.setAttribute('playsinline', '')
        instance.video.setAttribute('muted', '')
        instance.video.setAttribute('autoplay', '')
        instance.video.setAttribute('loop', '')
        instance.video.style.position = 'fixed'
        instance.video.style.top = '0'
        instance.video.style.left = '0'
        instance.video.style.width = '100%'
        instance.video.style.height = '100%'
        instance.video.style.objectFit = 'cover'
        instance.video.style.zIndex = '-1'

        if (document.querySelector('#childrenNames')) return

        const wrapper = _gl.elementFromHtml(`<div class="fixed inset-0 bg-black isolate" id="waitingScreen"></div>`)
        const form = _gl.elementFromHtml(
            `<form id="childrenNames" class="max-w-screen-sm absolute bottom-6 left-1/2 -translate-x-1/2">
                <input class="w-full h-12 bg-white text-bke-darkpurple outline-none text-lg px-4 mb-4"/>
                <button type="submit" class="button-normal w-full">Submit name</button>
            </form>`
        )

        const nameLabelContainer = _gl.elementFromHtml('<ul class="absolute w-full h-full pointer-events-none p-4" id="names-label"></ul>')

        wrapper.append(instance.video, form, nameLabelContainer)

        document.querySelector('#chapter-wrapper').append(wrapper)

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

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
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
        const form = document.querySelector('#childrenNames')
        form.querySelector('button').removeEventListener('click', instance.handleFormSubmission)
        form.querySelector('input').removeEventListener('keyup', instance.handleFormSubmission)

        const removeButtons = document.querySelector('#chapter-wrapper').querySelectorAll('span')
        removeButtons.forEach((removeButton) => {
            removeButton.removeEventListener('click', instance.handleRemoveName)
        })

        // Remove the video element
        if (instance.video) {
            instance.video.pause() // Pause the video
            instance.video.remove() // Remove the video element from the DOM
        }

        // Remove all elements appended to smallScreen
        document.querySelector('#waitingScreen').remove()
        instance.video?.defocus()
        instance.program.toggleStep()
    }
}
