import Experience from "../Experience.js";

let notification = []

export default class Notification {
    constructor(text, icon = "") {
        this.experience = new Experience()
        this.program = this.experience.world.program

        this.htmlEl = document.createElement("div")
        this.htmlEl.className = "alert"
        this.htmlEl.innerHTML = Notification.generateHtml(text)
        document.body.appendChild(this.htmlEl)

        this.el = {
            close: this.htmlEl.querySelector('[aria-label="close alert"]')
        }

        this.el.close.addEventListener("click", this.destroy)

        notification.push(this)
    }

    destroy() {
        notification[notification.length - 1].htmlEl.remove()
        notification.pop()
    }

    static generateHtml(text) {
        return `
            <div class="container">
                <p>${text}</p>
                <button class="btn rounded" aria-label="close alert">
                    <svg class="close-icon icon" width="17" height="16" viewBox="0 0 17 16">
                        <use href="#xmark"></use>
                    </svg>
                </button>
            </div>
            <div class="overlay"></div>
        `
    }
}