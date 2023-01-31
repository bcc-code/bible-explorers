import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null
export default class FAQ {
    constructor() {

        instance = this
        instance.experience = new Experience()

        instance.generateItems()
    }

    generateItems() {


        const content = _gl.elementFromHtml(`
            <div class="content">
                <h2>${_s.settings.faq}</h2>
            </div>
        `)

        const list = _gl.elementFromHtml(`<ul></ul>`)
        content.append(list)

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

        document.querySelector('.faq .container').append(content)
    }

    open() {
        document.querySelector('.faq').classList.add('is-open');
    }

    close() {
        document.querySelector('.faq').classList.remove('is-open');
    }
}