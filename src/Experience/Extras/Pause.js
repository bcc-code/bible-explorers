import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class Pause {
    constructor() {
        instance = this
        this.experience = new Experience()
        this.world = this.experience.world
        this.camera = this.experience.camera
        this.debug = this.experience.debug
    }

    togglePause() {
        let html = `
            <div class="modal__content congrats congrats__journey">
                <div class="congrats__sidebar">
                    <div class="congrats__container">
                        <div class="stars">
                            <i class="icon icon-star-solid"></i>
                            <i class="icon icon-star-solid"></i>
                            <i class="icon icon-star-solid"></i>
                        </div>
                        <h1 class="congrats__title">${_s.journey.pause.title}</h1>
                        <div class="congrats__chapter-completed">${_s.journey.pause.message}</div>
                    </div>
                </div>
            </div>
        `

        instance.modal = new Modal(html, 'modal__congrats')

        instance.animateOneAndAHalfStars(500)

        const next = document.getElementById('continue')
        next.innerText = _s.miniGames.continue
        next.style.display = 'block'
        next.addEventListener('click', () => {
            instance.modal.destroy()
            instance.world.program.nextStep()
        })
    }

    animateOneAndAHalfStars(timeout) {
        const stars = document.querySelectorAll(".congrats .stars .icon")
        
        stars[0].classList.add('filled')

        setTimeout(function () {
            stars[1].classList.add('filled')
        }, timeout)
    }
}