import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Congrats {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.camera = this.experience.camera
        this.debug = this.experience.debug

        instance = this
    }

    toggleBibleCardsReminder() {
        const bibleCards = _gl.elementFromHtml(`
            <div class="modal full-screen">
                <div class="container">
                    <header>
                        <h2>${_s.journey.bibleCards.message}</h2>
                    </header>
                    <video id="bibleCards" src="games/bible_cards.webm" muted autoplay loop></video>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(bibleCards)

        instance.experience.navigation.next.addEventListener('click', () => {
            instance.destroy()
            instance.toggleCongrats()
        })
    }

    toggleCongrats() {
        const chapterCongrats = _gl.elementFromHtml(`
            <div class="modal full-screen">
                <div class="container">
                    <header>
                        <h2>${_s.journey.congrats}</h2>
                    </header>
                    <p>${_s.journey.completed}:<br /><strong>${instance.world.selectedChapter.title}</strong></p>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(chapterCongrats)

        instance.world.audio.playSound('congrats')

        instance.experience.navigation.next.addEventListener('click', () => {
            instance.destroy()
            instance.world.goHome()
            instance.debug.removeQuickLookMode()

            if (!instance.experience.settings.fullScreen && document.fullscreenElement) {
                document.exitFullscreen()
            }
        })
    }

    animateStars(timeout) {
        const stars = document.querySelectorAll(".congrats .stars .icon")
        stars.forEach((star, index) => {
            setTimeout(function () {
                star.classList.add('filled')
            }, timeout * index)
        })
    }

    destroy() {
        document.querySelector('.modal')?.remove()
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
    }
}