import Experience from '../Experience.js'

let notification = []

export default class Notification {
    constructor(text, icon = '') {
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
                <button class="button-grid" aria-label="close alert">
                    <div class="corner top-left"></div>
                    <div class="edge top"></div>
                    <div class="corner top-right"></div>
                    <div class="edge left"></div>
                    <div class="content">
                        <svg class="cion"><use href="#xmark-large-solid" fill="currentColor"></use></svg>
                    </div>
                    <div class="edge right"></div>
                    <div class="corner bottom-left"></div>
                    <div class="edge bottom"></div>
                    <div class="corner bottom-right"></div>
                </button>
            </div>
        `
    }
}
