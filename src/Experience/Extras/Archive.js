import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _appInsights from '../Utils/AppInsights.js'

let archive = null

export default class Archive {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.offline = this.world.offline
        archive = this

        archive.facts = this.experience.world.selectedChapter.archive

        archive.button = document.getElementById("archive")
        archive.button.addEventListener("click", this.toggleArchive)
    }

    switchTab(id) {
        archive.el.list.querySelector(".visible").classList.remove("visible")
        archive.el.list.querySelector(`[data-id="${id}"]`).classList.add("visible")
        archive.el.content.querySelector(".visible").classList.remove("visible")
        archive.el.content.querySelector(`[data-id="${id}"]`).classList.add("visible")
    }

    toggleArchive() {
        if (document.querySelector('.modal')) {
            archive.modal.destroy()
        }
        else {
            _appInsights.trackPageView({ name: "Archive" })

            const archiveModal = document.createElement('div')
            archiveModal.classList.add('modal__content', 'archive')

            const archiveWrapper = document.createElement('div')
            archiveWrapper.classList.add('archive__wrapper')

            archive.facts.forEach(fact => {
                const heading = document.createElement('h2')
                heading.classList.add('modal__heading')
                heading.innerText = fact.title

                const content = document.createElement('div')
                content.classList.add('archive__content')
                content.innerHTML = fact.description

                if (fact.image.url) {
                    const image = document.createElement('img')
                    image.setAttribute('src', fact.image.url)
                    content.appendChild(image)
                }

                archiveWrapper.appendChild(heading)
                archiveWrapper.appendChild(content)
            })

            archiveModal.appendChild(archiveWrapper)

            archive.modal = new Modal(archiveModal.outerHTML)
            document.querySelector('.modal').classList.add('modal__archive')
        }
    }
}