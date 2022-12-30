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
        instance.init()
    }


    backOneStep() {
        instance.modal.destroy()
        instance.program.previousStep()
    }

    finishGame() {
        instance.modal.destroy()
        instance.program.nextStep()
    }

    init() {

        instance.program = instance.world.program
        instance.dataNew = instance.program.getCurrentStepData()

        instance.data = {
            title: `Davids's Refuge`,
            goats: [
                'games/goat-yellow.png',
                'games/goat-blue.png',
                'games/goat-pink.png'
            ],
            hints: [
                'Hule 1 er ikke riktig.',
                'Hule 3 er riktig.',
                'Den rosa geiten lyver.',
            ],
            extraHints: [
                'Husk at bare én geit sier sannheten, det betyr at det de andre to sier ikke stemmer! ',
                'Den rosa geiten kan ikke si sannheten, fordi det hadde betydd at den blåe geiten lyver og da kan det være både hule 1 eller 3 som er riktig.',
                'Det er den gule geiten som sier sannheten.',
                'Hvis den gule geiten sier sannheten, da lyver den blåe geiten.'
            ]
        }


        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {

            instance.modalHtml()
            instance.hintsHtml()
            gsap.set('#overlay', { filter: 'blur(50px)' })

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
        sectionButton.innerText = 'Velg geiten'

        sectionFooter.append(sectionButton)
        section.append(sectionContent, sectionFooter)

        instance.modal = new Modal(section.outerHTML, 'modal_davids')


        const close = document.querySelector('.modal__close')
        close.style.display = 'none'

        const title = document.querySelector('.modal__heading--minigame')
        title.innerHTML = `<h3>${instance.data.title}</h3>`

        instance.data.goats.forEach((goat, index) => {

            const removedStr = goat.replace('games/goat-', '')
            const color = removedStr.split('.')[0]

            const box = document.createElement('div')
            box.classList.add('davidRefuge_box')
            box.setAttribute('data-color', color)

            const tooltip = document.createElement('div')
            tooltip.innerHTML = `<span>${instance.data.hints[index]}</span>`
            tooltip.classList.add('davidRefuge_tooltip')

            const circle = document.createElement('div')
            circle.classList.add('davidRefuge_circle')

            const image = new Image(304, 341)
            image.src = goat
            box.append(tooltip, image, circle)
            document.querySelector('.davidRefuge_content').append(box)
        });

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

        let clicks = 0

        getHint.addEventListener('click', () => {
            if (clicks < instance.data.extraHints.length) {
                const item = document.querySelector('li')
                item.innerText = instance.data.extraHints[clicks]
                listContainer.appendChild(item)
            }

            clicks += 1

            if (clicks == instance.data.extraHints.length) {
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

        const message = this.messageModal('Har dere funnet kartet? Trykk neste')
        document.body.append(overlay, message)

        gsap.to('#dialogue', { y: 0, autoAlpha: 1, onComplete: () => { /* instance.audio.togglePlayTaskDescription(instance.data.davids_refuge.geiten_voice.audio)*/ } })

    }

    toggleMessage() {
        const message = this.messageModal('Kan kanskje kartet hjelpe dere å finne ut hvilken hule dere skal gå inn i?')
        document.body.append(message)

        gsap.to('#dialogue', { y: 0, autoAlpha: 1, onComplete: () => {/* instance.audio.togglePlayTaskDescription(instance.data.davids_refuge.geiten_voice.audio)*/ } })
    }

}