import Experience from "../Experience.js";

let modal = []

export default class Modal {
    constructor(html, cssClass, callback = () => { }) {
        this.experience = new Experience()
        this.program = this.experience.world.program
        this.callback = callback

        this.htmlEl = document.createElement("div")
        this.htmlEl.className = "modal" + " " + cssClass
        this.htmlEl.innerHTML = Modal.generateHtml(html)

        document.body.appendChild(this.htmlEl)
        document.body.classList.add('modal-on')

        this.close()

        modal.push(this)
    }

    close() {
        const closeModal = this.htmlEl.querySelector(".modal__close")
        closeModal.addEventListener("click", this.destroy)
    }

    destroy() {
        modal[modal.length - 1].htmlEl.remove()
        modal[modal.length - 1].callback()
        modal.pop()

        if (!modal.length) {
            document.body.classList.remove('modal-on')
        }
    }

    static generateHtml(html) {
        return `
            <button class="modal__close btn bordered rounded">
                <div class="icon-xmark-solid"></div>
            </button>
            <div class="modal__heading--minigame"></div>
            <div class="modal__wrapper">
                <div class="modal__container">${html}</div>
            </div>
            <div class="modal__actions">
                <button class="btn default bordered back" id="back"></button>
                <div>
                    <button class="btn default bordered back" id="restart"></button>
                    <button class="btn default bordered next" id="skip"></button>
                    <button class="btn default bordered next pulsate" id="continue"></button>
                </div>
            </div>
        `
    }
}