import Experience from "../Experience.js";

let popup = null

export default class Popup {
    constructor(text, callback = () => {}) {
        this.experience = new Experience()
        this.program = this.experience.world.program
        this.callback = callback

        popup = this

        popup.htmlEl = document.createElement("div")
        popup.htmlEl.className = "popup"
        popup.htmlEl.innerHTML = Popup.generateHtml(text)
        document.body.appendChild(popup.htmlEl)

        popup.el = {
            overlay: popup.htmlEl.querySelector(".popup__overlay"),
            close: popup.htmlEl.querySelector(".popup__close")
        }

        popup.el.close.addEventListener("click", popup.destroy)
    }

    destroy() {
        popup.htmlEl.remove()
        popup.callback()
        popup = null
    }

    static generateHtml(text) {
        return `
            <div class="popup__close button button__round"><div class="button__content"><i class="icon icon-xmark-solid"></i></div></div>
            <div class="popup__container">
                ${ text }
            </div>
        `
    }
}