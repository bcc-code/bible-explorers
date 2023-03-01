import Experience from "../Experience.js"
import _gl from "../Utils/Globals.js"

let instance = null

export default class Skip {
    constructor() {
        instance = this
        instance.experience = new Experience()

        if (!instance.experience.auth0.isAuthenticated) return
        if (!document.body.classList.contains("quick-look-mode")) return

        instance.init()

    }

    init() {
        const html = _gl.elementFromHtml(`<aside class="skip-navigation"></aside>`)
        document.querySelector('.ui-container').append(html)

        const prevStep = _gl.elementFromHtml(`
            <button aria-label="prev step">
                <svg class="prev-icon icon" viewBox="0 0 25 16">
                    <use href="#arrow-left"></use>
                </svg>
            </button>
        `)

        const nextStep = _gl.elementFromHtml(`
            <button aria-label="next step">
                <svg class="next-icon icon" viewBox="0 0 25 16">
                    <use href="#arrow-right"></use>
                </svg>
            </button>
        `)

        html.append(prevStep, nextStep)

    }

    destroy() {
        document.querySelector('.skip-navigation').remove()

    }
}