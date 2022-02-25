import data from "./archive.json";
import Modal from '../Utils/Modal.js'

let archive = null

export default class Archive {
    constructor() {
        // Singleton
        if (archive)
            return archive

        archive = this

        archive.htmlEl = document.createElement("div");
        archive.htmlEl.setAttribute("id", "archive");
        archive.htmlEl.addEventListener("click", Archive.getHtml);
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
            <h2>${data.title}</h2>
            <div class="archive__grid">
                <ul class="archive__list">`;
                    Object.entries(data.entries).forEach(entry => {
                        html += `<li class="${ entry[0] == 1 ? 'visible' : '' }" data-id="${ entry[0] }">${ entry[1].title }</li>`
                    })
                html += `</ul>
                <div class="archive__content">`;
                    Object.entries(data.entries).forEach(entry => {
                        html += `<div class="entry__content ${ entry[0] == 1 ? 'visible' : '' }" data-id="${ entry[0] }">
                            <h3>${entry[1].title}</h3>
                            <div class="text">${ entry[1].text }</div>
                        </div>`
                    })
                html += `</div>
            </div>
        `;

        new Modal(html)

        archive.el = {
            list: document.querySelector(".archive__list"),
            content: document.querySelector(".archive__content")
        }

        archive.el.list.querySelectorAll("li").forEach(function(item) {
            item.addEventListener("mousedown", () => {
                archive.switchTab(item.dataset.id)
            });
        });
    }
}