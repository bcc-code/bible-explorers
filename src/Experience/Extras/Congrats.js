import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Congrats {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
    }

    toggleSummary() {
        instance.destroy()
        instance.experience.navigation.prev.addEventListener('click', instance.destroy)
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

    toggleBibleCardsReminder() {
        instance.destroy()
        instance.world.program.destroy()

        instance.experience.navigation.next.addEventListener('click', instance.toggleCongrats)

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
    }

    toggleCongrats() {
        instance.destroy()
        instance.experience.navigation.next.addEventListener('click', instance.finishChapter)
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
    }

    finishChapter() {
        instance.destroy()
        instance.world.goHome()
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
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleCongrats)
        instance.experience.navigation.next.removeEventListener('click', instance.finishChapter)
    }
}