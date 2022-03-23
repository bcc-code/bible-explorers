import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Lang.js'

let archive = null

export default class Archive {
    constructor() {
        // Singleton
        if (archive)
            return archive

        this.experience = new Experience()
        archive = this

        archive.facts = this.experience.world.selectedEpisode.archive

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
        if (document.querySelector('.modal')) {
            archive.modal.destroy()
        }
        else {
            let html = `
                <div class="archive__header"><h1>${ _s.archive }</h1></div>
                    <ul class="archive__sidebar">`;
                        archive.facts.forEach((fact, index) => {
                            html += `<li class="${ index == 0 ? 'visible' : '' }" data-id="${ index }">${ fact.title }</li>`
                        })
                    html += `</ul>
                    <div class="archive__content">`;
                        archive.facts.forEach((fact, index) => {
                            html += `<div class="fact ${ index == 0 ? 'visible' : '' }" data-id="${ index }">
                                <div class="fact__content">
                                <h2 class="fact__title">${fact.title}</h2>
                                <div class="fact__description">${ fact.description }</div>
                                </div>
                            </div>`
                        })
                    html += `</div>
            `;

            archive.modal = new Modal(html)

            archive.el = {
                list: document.querySelector(".archive__sidebar"),
                content: document.querySelector(".archive__content")
            }

            archive.el.list.querySelectorAll("li").forEach(function(item) {
                item.addEventListener("mousedown", () => {
                    archive.switchTab(item.dataset.id)
                });
            });
        }
    }
}