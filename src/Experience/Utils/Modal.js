import Experience from "../Experience.js";

let modal = null

export default class Modal {
    constructor(html) {
        this.experience = new Experience()
        this.program = this.experience.world.program

        modal = this

        modal.htmlEl = document.createElement("div")
        modal.htmlEl.className = "modal"
        modal.htmlEl.innerHTML = Modal.generateHtml(html)
        document.body.appendChild(modal.htmlEl)

        modal.el = {
            overlay: modal.htmlEl.querySelector(".modal__overlay"),
            close: modal.htmlEl.querySelector(".modal__close")
        }

        modal.el.overlay.addEventListener("mousedown", modal.destroy)
        modal.el.close.addEventListener("mousedown", modal.destroy)

        document.body.classList.add('modal-on')
    }

    destroy() {
        modal.htmlEl.remove()
        document.body.classList.remove('modal-on')
        modal.program?.updateIrisTexture('READY')
        modal = null
    }

    static generateHtml(html) {
        return `
            <div class="modal__overlay"></div>
            <div class="modal__close"></div>
            <div class="modal__container">
                ${ html }
            </div>
        `
    }
}