import Experience from "../Experience.js";

let notification = null

export default class Notification {
    constructor(text, callback = () => { }) {
        this.experience = new Experience()
        this.program = this.experience.world.program
        this.callback = callback

        notification = this

        notification.htmlEl = document.createElement("div")
        notification.htmlEl.className = "notification"
        notification.htmlEl.innerHTML = Notification.generateHtml(text)
        document.body.appendChild(notification.htmlEl)

        notification.el = {
            close: notification.htmlEl.querySelector(".notification__close")
        }

        notification.el.close.addEventListener("click", notification.destroy)
    }

    destroy() {
        notification.htmlEl.remove()
        notification.callback()
        notification = null
    }

    static generateHtml(text) {
        return `
            <div class="notification__close button button__round"><div class="button__content"><i class="icon icon-xmark-solid"></i></div></div>
            <div class="notification__container">
                ${text}
            </div>
        `
    }
}