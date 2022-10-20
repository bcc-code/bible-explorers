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

        this.el = {
            overlay: this.htmlEl.querySelector(".modal__overlay"),
            close: this.htmlEl.querySelector(".modal__close")
        }

        this.el.close.addEventListener("click", this.destroy)

        modal.push(this)

        document.body.classList.add('modal-on')
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
            <button class="modal__close | button bg--secondary width height border--5 border--solid border--transparent rounded--full | icon-xmark-solid"></button>
            <div class="modal__wrapper">
                <div class="modal__container">${html}</div>
            </div>
            <div class="modal__actions">
                <button class="button bg--primary border--5 border--solid border--primary height px rounded--back" id="back"></button>
                <div>
                    <button class="button bg--primary border--5 border--solid border--primary height px rounded" id="restart"></button>
                    <button class="button bg--secondary border--5 border--solid border--transparent height px rounded--forward" id="skip"></button>
                    <button class="button bg--secondary border--5 border--solid border--transparent height px rounded--forward pulsate" id="continue"></button>
                </div>
            </div>
        `
    }
}