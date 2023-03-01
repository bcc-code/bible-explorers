import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null
export default class FAQ {
    constructor() {

        instance = this
        instance.experience = new Experience()

        instance.generateItems()
        instance.setEventListeners()
    }

    generateItems() {
        const list = document.querySelector('.faq ul')

        const faqQuestions = Object.values(_s.faq.questions)
        const faqAnswers = Object.values(_s.faq.answers)

        for (let i = 0; i < faqQuestions.length; i++) {
            const listItem = _gl.elementFromHtml(`
                <li>
                    <p>${faqQuestions[i]}</p>
                    <p>${faqAnswers[i]}</p>
                </li>
            `)

            list.append(listItem)
        }

        document.querySelector('.faq h2').innerText = _s.settings.faq
    }

    setEventListeners() {
        document.querySelector('.faq .overlay').addEventListener('click', instance.close)
        document.querySelector('[aria-label="FAQ"]').addEventListener('click', instance.open)
        document.querySelector('[aria-label="Close FAQ"]')?.addEventListener('click', instance.close)
    }

    open() {
        document.querySelector('.faq').classList.add('is-open');
    }

    close() {
        document.querySelector('.faq').classList.remove('is-open');
    }
}