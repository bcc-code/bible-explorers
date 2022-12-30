import gsap from 'gsap'
import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class DavidsRefuge {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug
    }

    toggleGame() {
        instance.program = instance.world.program
        instance.data = instance.program.getCurrentStepData().davids_refuge

        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            instance.modalHtml()
            instance.hintsHtml()

            instance.toggleQuestion()
            instance.eventListeners()
        }
    }

    modalHtml() {
        const section = document.createElement('section')
        section.classList.add('davidRefuge')

        const sectionContent = document.createElement('article')
        sectionContent.classList.add('davidRefuge_content')

        const sectionFooter = document.createElement('footer')
        sectionFooter.classList.add('davidRefuge_footer')

        const sectionButton = document.createElement('button')
        sectionButton.className = 'button button bg--secondary border--5 border--solid border--transparent height px rounded--full'
        sectionButton.setAttribute('id', 'selectGoat')
        sectionButton.innerText = _s.miniGames.davidsRefuge.chooseGoat

        sectionFooter.append(sectionButton)
        section.append(sectionContent, sectionFooter)

        instance.modal = new Modal(section.outerHTML, 'modal_davids')

        const close = document.querySelector('.modal__close')
        close.style.display = 'none'

        const title = document.querySelector('.modal__heading--minigame')
        title.innerHTML = `<h3>${instance.program.getCurrentStepData().details.title}</h3>`

        instance.data.characters.forEach(goat => {
            const url = goat.image.split('/')
            const fileName = url[url.length - 1].replace('goat-', '')
            const color = fileName.split('.')[0]

            const box = document.createElement('div')
            box.classList.add('davidRefuge_box')
            box.setAttribute('data-color', color)

            const tooltip = document.createElement('div')
            tooltip.innerHTML = `<span>${goat.text}</span>`
            tooltip.classList.add('davidRefuge_tooltip')

            const circle = document.createElement('div')
            circle.classList.add('davidRefuge_circle')

            const image = new Image(304, 341)
            image.src = goat.image
            box.append(tooltip, image, circle)
            document.querySelector('.davidRefuge_content').append(box)
        })
    }

    hintsHtml() {
        const hints = document.createElement('section')
        hints.classList.add('hints')

        const hintsHeader = document.createElement('h4')
        hintsHeader.classList.add('hints_header')
        hintsHeader.innerText = 'Hints'

        const hintsList = document.createElement('ul')
        hintsList.classList.add('hints_list')

        const getHints = document.createElement('button')
        getHints.classList.add('hints_get')
        getHints.innerText = 'Get more hints'

        hints.append(hintsHeader, hintsList, getHints)
        document.querySelector('.modal_davids').append(hints)
    }

    eventListeners() {
        const next = document.getElementById('continue')
        next.style.display = 'block'
        next.innerText = _s.task.next
        next.addEventListener('click', instance.finishGame)
        next.disabled = true

        const back = document.getElementById('back')
        back.style.display = 'block'
        back.innerText = _s.journey.back
        back.addEventListener('click', instance.backOneStep)

        // Goat selection
        const selectGoat = document.getElementById('selectGoat')
        selectGoat.disabled = true

        gsap.utils.toArray('.davidRefuge_box').forEach(item => {
            const q = gsap.utils.selector(item)
            const img = q('img')
            const circle = q('.davidRefuge_circle')
            const tooltip = q('.davidRefuge_tooltip')

            item.addEventListener('click', () => {
                selectGoat.disabled = false

                if (item.hasAttribute('data-selected')) return

                document.querySelectorAll('.davidRefuge_box').forEach(goat => {
                    if (!goat.hasAttribute('data-selected')) return

                    const selectedImage = goat.querySelector('img')
                    const selectedTooltip = goat.querySelector('.davidRefuge_circle')
                    const selectedCircle = goat.querySelector('.davidRefuge_tooltip')

                    gsap.to(selectedImage, { x: 0 })
                    gsap.to(selectedTooltip, { y: 0, backgroundColor: '' })
                    gsap.to(selectedCircle, { x: 0, y: 0 })

                    goat.removeAttribute('data-selected')
                })

                item.setAttribute('data-selected', '')

                gsap.to(img, { x: 10 })
                gsap.to(circle, { y: 10, backgroundColor: '#fff' })
                gsap.to(tooltip, { x: 10, y: 10 })
            })
        })

        selectGoat.addEventListener('click', () => {
            if (selectGoat.disabled) return

            document.querySelectorAll('.davidRefuge_box').forEach(goat => {
                if (goat.hasAttribute('data-selected')) return
                gsap.to(goat, { filter: 'grayscale(0.5)', pointerEvents: 'none' })
            })

            selectGoat.disabled = true
            next.disabled = false
            instance.toggleMessage()
        })

        // Hints
        const listContainer = document.querySelector('.hints_list')
        const getHint = document.querySelector('.hints_get')

        // First hint is visible by default
        const item = document.querySelector('li')
        item.innerText = instance.data.hints[0].text
        listContainer.appendChild(item)

        let index = 1

        getHint.addEventListener('click', () => {
            if (index < instance.data.hints.length) {
                const item = document.querySelector('li')
                item.innerText = instance.data.hints[index].text
                listContainer.appendChild(item)
            }

            if (++index == instance.data.hints.length) {
                getHint.remove()
            }
        })

        // Message event
        const overlay = document.getElementById('overlay')
        const dialogue = document.getElementById('dialogue')

        overlay.addEventListener('click', () => {
            gsap.to(dialogue, { y: '100%', autoAlpha: 0, onComplete: () => { dialogue.remove() } })
            gsap.to(overlay, { autoAlpha: 0, onComplete: () => { overlay.remove() } })
        })
    }

    messageModal(text) {
        const messageBox = document.createElement('div')
        messageBox.classList.add('dialogue')
        messageBox.setAttribute('id', 'dialogue')

        const messageContent = document.createElement('div')
        messageContent.classList.add('dialogue-content')
        messageContent.innerHTML = `<p>${text}</p>`

        messageBox.append(messageContent)

        return messageBox
    }

    toggleQuestion() {
        const overlay = document.createElement('div')
        overlay.setAttribute('id', 'overlay')
        overlay.innerHTML = `<p>Click anywhere to continue</p>`

        const message = this.messageModal(instance.data.start_message)
        document.body.append(overlay, message)

        gsap.to('#dialogue', { y: 0, autoAlpha: 1 })
    }

    toggleMessage() {
        const message = this.messageModal(instance.data.end_message)
        document.body.append(message)

        gsap.to('#dialogue', { y: 0, autoAlpha: 1 })
    }

    removeDialogue() {
        if (document.getElementById('dialogue'))
            document.getElementById('dialogue').remove()
    }

    backOneStep() {
        instance.removeDialogue()
        instance.modal.destroy()
        instance.program.previousStep()
    }

    finishGame() {
        instance.removeDialogue()
        instance.modal.destroy()
        instance.program.nextStep()
    }
}