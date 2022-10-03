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

        archive.htmlEl = document.getElementById("archive")
        archive.htmlEl.addEventListener("click", this.toggleArchive)
    }

    switchTab(id) {
        archive.el.list.querySelector(".visible").classList.remove("visible")
        archive.el.list.querySelector(`[data-id="${id}"]`).classList.add("visible")
        archive.el.content.querySelector(".visible").classList.remove("visible")
        archive.el.content.querySelector(`[data-id="${id}"]`).classList.add("visible")
    }

    toggleArchive() {
        let image = null

        archive.facts.forEach(fact => {
            image = fact.image
        })

        if (document.querySelector('.modal')) {
            archive.modal.destroy()
        }
        else {
            _appInsights.trackPageView({ name: "Archive" })

            let html = `<div class="modal__content archive">
                <ul class="archive__sidebar">`;
            archive.facts.forEach((fact, index) => {
                html += `<li class="${index == 0 ? 'visible' : ''}" data-id="${index}">${fact.title}</li>`
            })
            html += `</ul>
                <div class="archive__wrapper">`
            archive.facts.forEach((fact, index) => {
                html += `<h2 class="modal__heading">${fact.title}</h2>
                        <div class="fact ${index == 0 ? 'visible' : ''}" data-id="${index}">
                            <div class="fact__content">
                                <div class="fact__description">      
                                    <img src="${image.url}"/> 
                                    ${fact.description}
                                </div>
                            </div>
                        </div>`
            })
            html += `</div>
            </div>`

            archive.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__archive')

            archive.el = {
                list: document.querySelector(".archive__sidebar"),
                content: document.querySelector(".archive__content")
            }

            archive.el.list.querySelectorAll("li").forEach(function (item) {
                item.addEventListener("click", () => {
                    archive.switchTab(item.dataset.id)
                })
            })
        }
    }
}