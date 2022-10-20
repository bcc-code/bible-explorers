import Experience from "../Experience.js";

let notification = []

export default class Notification {
    constructor(text, icon = "") {
        this.experience = new Experience()
        this.program = this.experience.world.program

        this.htmlEl = document.createElement("div")
        this.htmlEl.className = "notification"
        this.htmlEl.innerHTML = Notification.generateHtml(text, icon)
        document.body.appendChild(this.htmlEl)

        this.el = {
            close: this.htmlEl.querySelector(".notification__close")
        }

        this.el.close.addEventListener("click", this.destroy)

        notification.push(this)
    }

    destroy() {
        notification[notification.length - 1].htmlEl.remove()
        notification.pop()
    }

    static generateHtml(text, icon) {
        return `
            <div class="notification__close button button__round"><div class="button__content"><i class="icon icon-xmark-solid"></i></div></div>
            <div class="notification__container">
                ${icon}
                <span>${text}</span>
            </div>
        `
    }
}