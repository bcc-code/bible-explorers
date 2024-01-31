import Experience from '../Experience.js'
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
        instance.experience.navigation.next.addEventListener('click', instance.destroy)
        instance.world.audio.playSound('task-completed')

        const summary = _gl.elementFromHtml(`
            <div class="modal h-full grid place-items-center">
                <h1 class="text-4xl font-semibold">${_s.miniGames.completed.title}</h1>
            </div>
        `)

        instance.experience.interface.bigScreen.append(summary)
    }

    toggleBibleCardsReminder() {
        instance.destroy()
        instance.world.program.destroy()
        instance.experience.navigation.next.addEventListener('click', instance.toggleCongrats)

        const bibleCards = _gl.elementFromHtml(`
            <div class="modal">
                <video class="aspect-video w-full" id="bibleCards" src="games/bible_cards.webm" muted autoplay loop></video>
            </div>
        `)

        instance.experience.interface.bigScreen.append(bibleCards)
        instance.experience.navigation.prev.disabled = true
    }

    toggleCongrats() {
        instance.destroy()
        instance.experience.navigation.next.addEventListener('click', instance.finishChapter)
        instance.world.audio.playSound('congrats')
        instance.experience.celebrate({
            particleCount: 100,
            spread: 160,
        })

        const chapterCongrats = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="chapter-progress">
                        <progress max="3" value="3"></progress>
                        <ul>
                            <li class="filled">
                                <svg class="w-12 h-12"><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                            <li class="filled">
                                <svg class="w-12 h-12"><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                            <li class="filled">
                                <svg class="w-12 h-12"><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                        </ul>
                    </div>
                    <div class="congrats">
                        <h1 class="text-4xl font-semibold">${_s.journey.congrats}</h1>
                        <p class="text-2xl mt-8">${_s.journey.completed}:<br /><strong class="text-bke-orange">${instance.world.selectedChapter.title}</strong></p>
                    </div>
                </div>
            </div>
        `)

        instance.experience.interface.bigScreen.append(chapterCongrats)
    }

    finishChapter() {
        instance.destroy()
        instance.world.goHome()
    }

    destroy() {
        document.querySelector('.modal')?.remove()

        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleCongrats)
        instance.experience.navigation.next.removeEventListener('click', instance.finishChapter)
    }
}
