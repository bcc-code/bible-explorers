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
                'games/goat-1.png',
                'games/goat-2.png',
                'games/goat-3.png'
            ],
            hints: [
                'Hule 1 er ikke riktig',
                'Hule 3 er riktig',
                'Det er ikke hule 3',
            ],
            extraHints: [
                'Husk at bare ett dyr sier sannheten, det betyr at det de andre to sier ikke stemmer!',
                'Skorpionen kan ikke si sannheten, fordi det hadde betydd at kamelen juger og da kan de være både hule 1 eller 3 some er riktig',
                'Det er reven som sier sannheten',
                'Hvis reven sier sannheten, da juger kamelen'
            ]
        }


        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {

            const section = document.createElement('section')
            section.classList.add('davidRefuge')

            instance.modal = new Modal(section.outerHTML, 'modal_davids')

            const close = document.querySelector('.modal__close')
            close.style.display = 'none'

            const title = document.querySelector('.modal__heading--minigame')
            title.innerHTML = `<h3>${instance.data.title}</h3>`

            const next = document.getElementById('continue')
            next.style.display = 'block'
            next.innerText = _s.task.next
            next.addEventListener('click', instance.finishGame)

            const back = document.getElementById('back')
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', instance.backOneStep)

            for (let i = 0; i < instance.data.goats.length; i++) {

                const box = document.createElement('div')
                box.classList.add('davidRefuge_box')
                const tooltip = document.createElement('div')
                tooltip.innerHTML = `<span>${instance.data.hints[i]}</span>`
                tooltip.classList.add('davidRefuge_tooltip')

                const image = new Image(304, 341)
                image.src = instance.data.goats[i]
                box.append(tooltip, image)
                document.querySelector('.davidRefuge').append(box)
            }

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

            const hintVisible = document.querySelector('li')
            hintVisible.innerText = instance.data.extraHints[0]
            hintsList.append(hintVisible)

            hints.append(hintsHeader, hintsList, getHints)
            document.querySelector('.modal_davids').append(hints)

            const listContainer = document.querySelector('.hints_list')
            const getHint = document.querySelector('.hints_get')

            let clicks = 0

            getHint.addEventListener('click', () => {
                clicks += 1

                if (clicks < instance.data.extraHints.length) {
                    const item = document.querySelector('li')
                    item.innerText = instance.data.extraHints[clicks]
                    listContainer.appendChild(item)
                }

                if (clicks == instance.data.extraHints.length - 1) {
                    getHint.remove()
                }

            })









            // gsap.set('.davidRefuge_tooltip', { autoAlpha: 0, scale: 0, transformOrigin: 'left center' })

            // gsap.utils.toArray('.davidRefuge_box').forEach(item => {
            //     let tooltip = item.querySelector('.davidRefuge_tooltip'),
            //         tl = gsap.timeline({ paused: true })

            //     tl
            //         .to(tooltip, { duration: 0.2, autoAlpha: 1, scale: 1.1 })
            //         .to(tooltip, { duration: 0.3, scale: 1 })

            //     item.addEventListener('mouseenter', () => tl.play())
            //     item.addEventListener('mouseleave', () => tl.reverse())

            // })

        }
    }

}