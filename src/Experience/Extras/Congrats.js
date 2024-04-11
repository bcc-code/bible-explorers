import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Congrats {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world

        instance.randomizePositions = instance.randomizePositions
    }

    toggleSummary() {
        instance.destroy()
        instance.experience.navigation.prev.addEventListener('click', instance.destroy)
        instance.experience.navigation.next.addEventListener('click', instance.destroy)
        instance.world.audio.playSound('task-completed')

        const summary = _gl.elementFromHtml(`
            <div class="w-full h-full grid place-items-center" id="chapter-summary">
                <h1 class="text-2xl tv:text-3xl font-bold">${_s.miniGames.completed.title}</h1>
            </div>
        `)

        instance.experience.interface.mainScreen.append(summary)
    }

    toggleBibleCardsReminder() {
        instance.destroy()
        instance.world.program.destroy()
        instance.experience.navigation.next.addEventListener('click', instance.toggleCongrats)

        const bibleCards = _gl.elementFromHtml(`
            <div class="absolute inset-0 grid place-content-center bg-black/60" id="chapter-bible_cards">
                <video src="textures/Biblebox_Anim_V002.webm" muted autoplay loop></video>
            </div>
        `)

        document.querySelector('#chapter-wrapper').append(bibleCards)
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
        instance.names = instance.world.program.waitingScreen.names

        const chapterCongrats = _gl.elementFromHtml(`
            <div class="absolute inset-0 grid place-content-center bg-black/60" id="chapter-progress">
                <div class="chapter-progress_content">
                    <div class="congrats">
                        <h1 class="text-bke-orange">${_s.journey.congrats}</h1>
                        <p>${_s.journey.completed}:<br /><strong class="text-bke-orange">${instance.world.selectedChapter.title}</strong></p>
                    </div>
                    <div class="stars">
                        <progress max="3" value="3"></progress>
                        <ul>
                            <li class="filled">
                                <svg><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                            <li class="filled">
                                <svg><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                            <li class="filled">
                                <svg><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="absolute inset-0" id="chapter-credits">
                    ${instance.names.map((name) => `<div>${name}</div>`).join('')}
                </div>
            </div>
        `)

        document.querySelector('#app-content').classList.remove('overflow-y-auto')
        document.querySelector('#chapter-wrapper').append(chapterCongrats)
        instance.experience.interface.helperScreen.setAttribute('data-view', '')

        instance.randomizePositions()
        window.addEventListener('resize', instance.randomizePositions())
    }

    randomizePositions() {
        const creditsContainer = document.querySelector('#chapter-credits')
        const names = creditsContainer.querySelectorAll('div')

        const centralElement = document.querySelector('.chapter-progress_content')
        if (!centralElement) {
            console.error('Central element not found in the DOM.')
            return
        }
        const centralRect = centralElement.getBoundingClientRect()

        const marginWidth = window.innerWidth * 0.2 // 20% of viewport width
        const marginHeight = window.innerHeight * 0.2 // 20% of viewport height

        names.forEach((name) => {
            let randomX, randomY, overlap

            do {
                overlap = false
                // Adjust calculations to consider margins
                randomX = marginWidth + Math.random() * (window.innerWidth - 2 * marginWidth - name.offsetWidth)
                randomY = marginHeight + Math.random() * (window.innerHeight - 2 * marginHeight - name.offsetHeight)

                // Check if the random position overlaps with the central element
                overlap = randomX < centralRect.right && randomX + name.offsetWidth > centralRect.left && randomY < centralRect.bottom && randomY + name.offsetHeight > centralRect.top
            } while (overlap)

            name.style.left = `${randomX}px`
            name.style.top = `${randomY}px`

            const animationDuration = Math.random() * 5 + 5 // Between 5 and 10 seconds
            name.style.animationDuration = `${animationDuration}s`
        })
    }

    finishChapter() {
        instance.destroy()
        instance.world.goHome()
    }

    destroy() {
        document.querySelector('#chapter-bible_cards')?.remove()
        document.querySelector('#chapter-progress')?.remove()
        document.querySelector('#chapter-summary')?.remove()
        document.querySelector('#chapter-credits')?.remove()

        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleCongrats)
        instance.experience.navigation.next.removeEventListener('click', instance.finishChapter)

        window.removeEventListener('resize', instance.randomizePositions)
    }
}
