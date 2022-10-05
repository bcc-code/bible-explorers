import Experience from "../Experience.js";

let modal = null

export default class Modal {
    constructor(html, callback = () => { }) {
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
            <button class="modal__close | button bg--secondary width height border--5 border--solid border--transparent rounded--full | icon-xmark-solid"></button>
            <div class="modal__wrapper">
                <div class="modal__container">${html}</div>
            </div>
            <div class="modal__actions">
                <button class="button bg--primary border--5 border--solid border--primary height px rounded--back" id="back"></button>
                <button class="button bg--primary border--5 border--solid border--primary height px rounded" id="restart"></button>
                <button class="button bg--secondary border--5 border--solid border--transparent height px rounded--forward" id="skip"></button>
                <button class="button bg--secondary border--5 border--solid border--transparent height px rounded--forward" id="continue"></button>
            </div>
        `
    }
}