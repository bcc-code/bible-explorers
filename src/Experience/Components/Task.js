import Experience from "../Experience"
import _s from "../Utils/Strings.js"

export default class Task {
    constructor() {

        instance = this
        instance.experience = new Experience()

        instance.init()
    }

    elementFromHtml(html) {
        const template = document.createElement('template')

        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    init() {

    }

}