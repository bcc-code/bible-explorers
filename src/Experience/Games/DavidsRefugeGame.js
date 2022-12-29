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

            instance.data.goats.forEach((goat, index) => {

                const removedStr = goat.replace('games/goat-', '')
                const color = removedStr.split('.')[0]

                const box = document.createElement('div')
                box.classList.add('davidRefuge_box')
                box.setAttribute('data-color', color)

                const tooltip = document.createElement('div')
                tooltip.innerHTML = `<span>${instance.data.hints[index]}</span>`
                tooltip.classList.add('davidRefuge_tooltip')

                // if (goat.includes('yellow'))
                //     box.setAttribute('data-color', 'yellow')

                const image = new Image(304, 341)
                image.src = goat
                box.append(tooltip, image)
                document.querySelector('.davidRefuge').append(box)
            });


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

        }
    }

}