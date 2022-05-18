import Experience from "../Experience.js";
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class Congrats {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.camera = this.experience.camera

        instance = this
    }

    toggleCongrats() {
        let html = `
            <div class="modal__content congrats congrats__journey">
                <div class="congrats__sidebar">
                    <div class="splash splash__left"></div>
                    <div class="congrats__container">
                        <div class="stars">
                            <i class="icon icon-star-solid"></i>
                            <i class="icon icon-star-solid"></i>
                            <i class="icon icon-star-solid"></i>
                        </div>
                        <div class="congrats__title">${ _s.journey.congrats }</div>
                        <div class="congrats__chapter-completed">${ _s.journey.completed } <strong>${ instance.world.selectedChapter.title }</strong>!</div>
                    </div>
                    <div class="splash splash__right"></div>
                </div>
            </div>
        `;

        instance.modal = new Modal(html, instance.world.finishJourney)

        instance.world.audio.playCodeUnlockedSound()
        instance.animateStars(500)
    }

    animateStars(timeout) {
        const stars = document.querySelectorAll(".congrats .stars .icon")
        stars.forEach((star, index) => {
            setTimeout(function() {
                star.classList.add('filled')
            }, timeout * index)
        })
    }
}