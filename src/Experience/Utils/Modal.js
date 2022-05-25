import Experience from "../Experience.js";

let modal = null

export default class Modal {
    constructor(html, callback = function(){}) {
        this.experience = new Experience()
        this.program = this.experience.world.program
        this.callback = callback

        modal = this

        modal.htmlEl = document.createElement("div")
        modal.htmlEl.className = "modal"
        modal.htmlEl.innerHTML = Modal.generateHtml(html)
        document.body.appendChild(modal.htmlEl)

        modal.el = {
            overlay: modal.htmlEl.querySelector(".modal__overlay"),
            close: modal.htmlEl.querySelector(".modal__close")
        }

        // modal.el.overlay.addEventListener("click", modal.destroy)
        modal.el.close.addEventListener("click", modal.destroy)

        document.body.classList.add('modal-on')
    }

    destroy() {
        modal.htmlEl.remove()
        document.body.classList.remove('modal-on')
        modal.callback()
        modal = null
    }

    static generateHtml(html) {
        return `
            <div class="modal__overlay"></div>
            <div class="modal__close button button__round"><i class="icon icon-xmark-solid"></i></div>
            <div class="modal__scroll">
                <div class="modal__container">
                    ${ html }
                </div>
            </div>
        `
    }
}