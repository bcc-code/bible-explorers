import Experience from '../Experience.js'

let notification = []

export default class Notification {
    constructor(text, icon = '') {
        this.experience = new Experience()
        this.program = this.experience.world.program

        this.htmlEl = document.createElement('div')
        this.htmlEl.className = 'isolate fixed grid place-content-center inset-0'
        this.htmlEl.innerHTML = Notification.generateHtml(text)
        document.body.appendChild(this.htmlEl)

        this.el = {
            close: this.htmlEl.querySelector('[aria-label="close alert"]'),
        }

        this.el.close.addEventListener('click', this.destroy)

        notification.push(this)
    }

    destroy() {
        notification[notification.length - 1].htmlEl.remove()
        notification.pop()
    }

    static generateHtml(text) {
        return `
            <div class="fixed inset-0 -z-10 bg-bke-darkpurple/70"></div>
            <div class="p-8 bg-white flex items-center">
                <p class="text-xl text-bke-darkpurple w-[320px]">${text}</p>
                <button class="button-cube-wider" aria-label="close alert">
                    <svg class="w-5 h-5"><use href="#xmark-large-solid" fill="currentColor"></use></svg>
                </button>
            </div>
        `
    }
}
