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
            close: this.htmlEl.querySelector('.close-alert')
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
            <div class="notification__container">
                ${icon}
                <div>
                    <p>${text}</p>
                    <button class="close-alert | button button__link | icon-xmark-solid"></button>
                </div>
            </div>
        `
    }
}