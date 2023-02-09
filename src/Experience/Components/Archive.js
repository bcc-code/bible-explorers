import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _appInsights from '../Utils/AppInsights.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Archive {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.offline = this.world.offline
        instance = this

        instance.facts = this.experience.world.selectedChapter.archive
    }

    init() {
        _appInsights.trackPageView({ name: "Archive" })

        const archiveToggle = _gl.elementFromHtml(`<button class="btn default" aria-label="Archive">Archive</button>`)
        archiveToggle.addEventListener("click", this.toggle)

        const archive = _gl.elementFromHtml(`
            <aside class="archive side-modal">
                <div class="container">
                    <section class="buttons">
                        <button class="btn rounded" aria-label="Close Archive">
                            <svg class="close-icon icon" width="17" height="16" viewBox="0 0 17 16">
                                <use href="#xmark"></use>
                            </svg>
                        </button>
                    </section>
                    <section class="content"></section>
                </div>
                <div class="overlay"></div>
            </aside>
        `)

        instance.facts.forEach(fact => {
            const heading = _gl.elementFromHtml(`<h2>${fact.title}</h2>`)
            const content = _gl.elementFromHtml(`<div>${fact.description}</div>`)

            archive.querySelector('.archive .content').append(heading, content)

            if (fact.image.url) {
                const image = _gl.elementFromHtml(`<img src="${fact.image.url}"/>`)
                archive.querySelector('.archive .content').append(image)
            }
        })

        document.querySelector('.nav').append(archiveToggle)
        document.querySelector('.ui').append(archive)

        instance.eventListeners()
    }

    eventListeners() {
        const archiveBTN = document.querySelector('[aria-label="Archive"]')
        archiveBTN.addEventListener('click', () => {
            document.querySelector('.archive').classList.add('is-open')
        })

        const closeBtn = document.querySelector('[aria-label="Close Archive"]')
        closeBtn.addEventListener('click', () => {
            document.querySelector('.archive').classList.remove('is-open')
        })
    }

    remove() {
        document.querySelector('[aria-label="Archive"]')?.remove()
        document.querySelector('.archive')?.remove()
    }
}