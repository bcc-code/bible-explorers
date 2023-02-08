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
        instance.destroy()

        const bibleCards = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="bibleCards">
                        <header>
                            <h1>${_s.journey.bibleCards.message}</h1>
                        </header>
                        <video id="bibleCards" src="games/bible_cards.webm" muted autoplay loop></video>
                    </div>
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
        instance.destroy()
        instance.world.audio.playSound('congrats')

        const chapterCongrats = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="congrats">
                        <header>
                            <h1>${_s.journey.congrats}</h1>
                        </header>
                        <p>${_s.journey.completed}:<br /><strong>${instance.world.selectedChapter.title}</strong></p>
                    </div>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(chapterCongrats)

        instance.experience.navigation.next.addEventListener('click', () => {
            instance.destroy()
            instance.world.goHome()
            instance.debug.removeQuickLookMode()

            if (!instance.experience.settings.fullScreen && document.fullscreenElement) {
                document.exitFullscreen()
            }
        })
    }

    toggleSummary() {
        instance.destroy()
        instance.world.audio.playSound('task-completed')
        const summary = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="summary">
                        <header>
                            <h1>${_s.miniGames.completed.title}</h1>
                        </header>
                    </div>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(summary)
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