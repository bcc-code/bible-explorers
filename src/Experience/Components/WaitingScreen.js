import Experience from '../Experience'
import Button from './Button.js'
import Frame from './Frame.js'
import _s from '../Utils/Strings.js'
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

        instance.program.message.destroy()

        const id = instance.world.selectedChapter.lobby_video_loop
        instance.video.load('texture-' + id)

        document.querySelector('.screens').classList.add('waiting-screen-visible')
        document.querySelector('#closed-caption').classList.add('waiting-screen-visible')

        instance.videoBG = document.createElement('video')
        instance.videoBG.setAttribute('src', './textures/Waitingscreen_V003.mp4')
        instance.videoBG.setAttribute('playsinline', '')
        // instance.videoBG.setAttribute('muted', '')
        instance.videoBG.setAttribute('autoplay', '')
        instance.videoBG.setAttribute('loop', '')
        instance.videoBG.style.position = 'fixed'
        instance.videoBG.style.top = '0'
        instance.videoBG.style.left = '0'
        instance.videoBG.style.width = '100%'
        instance.videoBG.style.height = '100%'
        instance.videoBG.style.objectFit = 'cover'
        instance.videoBG.style.zIndex = '-1'

        if (document.querySelector('#childrenNames')) return

        const wrapper = _gl.elementFromHtml(
            `<div class="fixed inset-0 bg-black isolate" id="waitingScreen"></div>`
        )
        const waitingScreenSubmitBtn = new Button({
            content: _s.waitingScreen.submit,
            type: 'submit',
        })
        const inputContentFrame = new Frame({
            content: `<input placeholder="${_s.waitingScreen.inputPlaceholder}" />`,
        })
        const childrenNamesFrame = new Frame({
            content: `<div class="input input-grid mr-2">
                    ${inputContentFrame.getHtml()}
                </div>
                ${waitingScreenSubmitBtn.getHtml()}`,
        })
        const form = _gl.elementFromHtml(
            `<form id="childrenNames" class="childrenNames">
                ${childrenNamesFrame.getHtml()}
            </form>`
        )

        const nameLabelContainer = _gl.elementFromHtml(
            '<ul class="bg-black/50 overflow-y-auto h-full p-[13%]" id="names-label"></ul>'
        )

        wrapper.append(instance.videoBG)
        document.querySelector('#closed-caption').append(form)
        instance.experience.interface.helperScreen.append(nameLabelContainer)
        document.querySelector('#chapter-wrapper').prepend(wrapper)

        // Input field

        const inputField = form.querySelector('input')
        inputField.addEventListener('keyup', (e) => {
            e.preventDefault()
            if (e.key === 'Enter') {
                instance.handleFormSubmission(form, nameLabelContainer)
            }
        })

        inputField.focus()

        // Submit button

        const submitBtn = form.querySelector('button')
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault()
            instance.handleFormSubmission(form, nameLabelContainer)
            inputField.focus()
        })

        // Add initial names

        instance.names.forEach((name) => {
            nameLabelContainer.append(instance.generateNameLabel(name))
        })

        instance.setEventListeners()
    }

    handleFormSubmission(form, container) {
        let inputVal = form.querySelector('input').value.trim()

        // Check if input value is not empty
        if (!inputVal) return

        inputVal = inputVal[0].toUpperCase() + inputVal.substr(1)

        // Check if input value is not already in the names array before appending
        if (!instance.names.includes(inputVal)) {
            instance.names.push(inputVal)
            container.append(instance.generateNameLabel(inputVal))
        }

        form.querySelector('input').value = '' // Reset input field regardless of whether name was added or not
    }

    generateNameLabel(inputVal) {
        const nameLabel = _gl.elementFromHtml(
            `<li class="name-item group relative flex items-center justify-center">${inputVal}<span class="cursor-pointer hidden group-hover:block">×</span></li>`
        )

        const removeButton = nameLabel.querySelector('span')
        removeButton.addEventListener('click', () => {
            instance.handleRemoveName(nameLabel, inputVal)
        })

        return nameLabel
    }

    handleRemoveName(nameLabel, name) {
        nameLabel.remove()
        const index = instance.names.indexOf(name)
        if (index !== -1) {
            instance.names.splice(index, 1)
        }
    }

    setEventListeners() {
        instance.experience.navigation.next.removeEventListener('click', instance.program.nextStep)
        instance.experience.navigation.next.addEventListener('click', instance.goToFirstCheckpoint)

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
        document.addEventListener(_e.ACTIONS.GO_HOME, instance.destroy)
    }

    removeEventListeners() {
        instance.experience.navigation.next.removeEventListener('click', instance.goToFirstCheckpoint)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
        document.removeEventListener(_e.ACTIONS.GO_HOME, instance.destroy)
    }

    goToFirstCheckpoint() {
        instance.destroy()
        instance.program.toggleStep()
    }

    destroy() {
        const form = document.querySelector('#childrenNames')
        form.querySelector('button').removeEventListener('click', instance.handleFormSubmission)
        form.querySelector('input').removeEventListener('keyup', instance.handleFormSubmission)

        const removeButtons = document.querySelector('#chapter-wrapper').querySelectorAll('span')
        removeButtons.forEach((removeButton) => {
            removeButton.removeEventListener('click', instance.handleRemoveName)
        })

        instance.removeEventListeners()

        // Remove names from the helper screen
        instance.experience.interface.helperScreen.innerHTML = ''

        // Remove the video element
        if (instance.videoBG) {
            instance.videoBG.pause()
            instance.videoBG.remove()
        }
        instance.video?.defocus()

        // Remove all elements appended to smallScreen
        document.querySelector('#waitingScreen').remove()
        document.querySelector('.screens').classList.remove('waiting-screen-visible')
        document.querySelector('#closed-caption').classList.remove('waiting-screen-visible')

        form.remove()
    }
}
