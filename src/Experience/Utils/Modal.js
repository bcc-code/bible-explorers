import Experience from "../Experience.js";

let modal = null

export default class Modal {
    constructor(html) {
        this.experience = new Experience()
        this.program = this.experience.world.program

        modal = this

        modal.htmlEl = document.createElement("div");
        modal.htmlEl.className = "modal";
        modal.htmlEl.innerHTML = Modal.generateHtml(html);
        document.body.appendChild(modal.htmlEl);

        modal.el = {
            overlay: modal.htmlEl.querySelector(".modal__overlay")
        };

        modal.el.overlay.addEventListener("mousedown", () => {
            modal.destroy()
        });

        document.body.classList.add('modal-on')
        this.program.canClick = false
    }

    destroy() {
        modal.htmlEl.remove()
        document.body.classList.remove('modal-on')
        this.program.canClick = true
        modal = null
    }

    static generateHtml(html) {
        return `
            <div class="modal__overlay"></div>
            <div class="modal__container">
                <div class="archive">
                    ${html}
                </div>
            </div>
        `
    }
}