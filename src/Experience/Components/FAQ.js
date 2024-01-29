import Experience from '../Experience.js'
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
        const list = document.querySelector('#faq-content')

        const faqQuestions = Object.values(_s.faq.questions)
        const faqAnswers = Object.values(_s.faq.answers)

        for (let i = 0; i < faqQuestions.length; i++) {
            const listItem = _gl.elementFromHtml(`
                <div>
                    <h4 class="text-xl font-semibold">${faqQuestions[i]}</h4>
                    <p class="text-white/80">${faqAnswers[i]}</p>
                </div>
            `)

            list.append(listItem)
        }
    }
}
