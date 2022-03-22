import data from "./archive.json";
import Modal from '../Utils/Modal.js'

let archive = null

export default class Archive {
    constructor() {
        // Singleton
        if (archive)
            return archive

        archive = this

        archive.htmlEl = document.createElement("div")
        archive.htmlEl.classList.add('archive__btn')
        archive.htmlEl.setAttribute("id", "archive__btn")
        archive.htmlEl.addEventListener("click", Archive.getHtml)

        archive.icon = document.createElement('i')
        archive.icon.classList.add("archive__icon")

        archive.htmlEl.appendChild(archive.icon)
        document.body.appendChild(archive.htmlEl);
    }

    switchTab(id) {
        archive.el.list.querySelector(".visible").classList.remove("visible")
        archive.el.list.querySelector(`[data-id="${id}"]`).classList.add("visible")
        archive.el.content.querySelector(".visible").classList.remove("visible")
        archive.el.content.querySelector(`[data-id="${id}"]`).classList.add("visible")
    }
  
    static getHtml() {
        let html = `
            <div class="archive__header"><h1>${data.title}</h1></div>
                <ul class="archive__sidebar">`;
                    Object.entries(data.entries).forEach(entry => {
                        html += `<li class="${ entry[0] == 1 ? 'visible' : '' }" data-id="${ entry[0] }">${ entry[1].title }</li>`
                    })
                html += `</ul>
                <div class="archive__content">`;
                    Object.entries(data.entries).forEach(entry => {
                        html += `<div class="entry ${ entry[0] == 1 ? 'visible' : '' }" data-id="${ entry[0] }">
                            <div class="entry__content">
                            <h2 class="entry__head">${entry[1].title}</h2>
                            <div class="entry__text"><p>${ entry[1].text }</p></div>
                            </div>
                        </div>`
                    })
                html += `</div>
        `;

        new Modal(html)

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