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

        console.log(instance.dataNew);

        instance.data = {
            title: `Davids's Refuge`,
            animals: [
                'games/goat-1.png',
                'games/goat-2.png',
                'games/goat-3.png'
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


            instance.data.animals.forEach(src => {

                const box = document.createElement('div')
                box.classList.add('davidRefuge_box')
                const tooltip = document.createElement('div')
                tooltip.innerHTML = '<span>Content here</span>'
                tooltip.classList.add('davidRefuge_tooltip')

                const image = new Image(304, 341)
                image.src = src

                box.append(tooltip, image)
                document.querySelector('.davidRefuge').append(box)

            });

            gsap.set('.davidRefuge_tooltip', { autoAlpha: 0, scale: 0, transformOrigin: 'left center' })

            gsap.utils.toArray('.davidRefuge_box').forEach(item => {
                let tooltip = item.querySelector('.davidRefuge_tooltip'),
                    tl = gsap.timeline({ paused: true })

                tl
                    .to(tooltip, { duration: 0.2, autoAlpha: 1, scale: 1.1 })
                    .to(tooltip, { duration: 0.3, scale: 1 })

                item.addEventListener('mouseenter', () => tl.play())
                item.addEventListener('mouseleave', () => tl.reverse())

            })

        }
    }

}