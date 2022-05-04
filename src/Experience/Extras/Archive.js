import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let archive = null

export default class Archive {
    constructor() {
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
                <div class="modal__content archive">
                    <div class="archive__header heading"><div class="icon"><i></i></div><span>${ _s.archive }</span></div>
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
                </div>
            `;

            archive.modal = new Modal(html)

            archive.el = {
                list: document.querySelector(".archive__sidebar"),
                content: document.querySelector(".archive__content")
            }

            archive.el.list.querySelectorAll("li").forEach(function(item) {
                item.addEventListener("click", () => {
                    archive.switchTab(item.dataset.id)
                });
            });
        }
    }
}