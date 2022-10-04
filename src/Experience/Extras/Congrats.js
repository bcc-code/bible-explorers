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

    toggleBibleCardsReminder() {
        let html = `
            <div class="modal__content congrats congrats__journey">
                <div class="congrats__sidebar">
                    <div class="congrats__container">
                        <h1 class="congrats__title">${_s.journey.bibleCards.title}</h1>
                        <video id="bibleCards" src="games/bible_cards.webm" muted autoplay loop></video>
                        <div class="congrats__chapter-completed">${_s.journey.bibleCards.message}</div>
                        <div id="homescreen" class="button button__continue">
                            <div class="button__content"><span>${_s.task.next}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        instance.modal = new Modal(html, instance.world.finishJourney)
        document.querySelector('.modal').classList.add('modal__congrats')

        document.getElementById("homescreen").addEventListener('click', () => {
            instance.modal.destroy()
            instance.toggleCongrats()
        })
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
                        <h1 class="congrats__title">${_s.journey.congrats}</h1>
                        <div class="congrats__chapter-completed">${_s.journey.completed}:<br /><strong>${instance.world.selectedChapter.title}</strong>!</div>
                        <div id="homescreen" class="button button__continue">
                            <div class="button__content"><span>${_s.journey.homescreen}</span></div>
                        </div>
                    </div>
                    <div class="splash splash__right"></div>
                </div>
            </div>
        `;

        instance.modal = new Modal(html, instance.world.finishJourney)
        document.querySelector('.modal').classList.add('modal__congrats')

        document.getElementById("homescreen").addEventListener('click', () => {
            instance.modal.destroy()
        })

        instance.world.audio.playCongratsSound()
        instance.animateStars(500)
    }

    animateStars(timeout) {
        const stars = document.querySelectorAll(".congrats .stars .icon")
        stars.forEach((star, index) => {
            setTimeout(function () {
                star.classList.add('filled')
            }, timeout * index)
        })
    }
}