// document.querySelector(".page .intro").innerText = _s.conceptDescription
import Experience from '../Experience.js';
import _s from '../Utils/Strings.js'

let instance = null

export default class Page {
    constructor() {

        instance = this
        instance.experience = new Experience()


        const prev = document.querySelector('[aria-label="Prev page"]')
        const next = document.querySelector('[aria-label="Next page"]')

        prev.style.display = 'none'
        next.style.display = 'none'

    }

    elementFromHtml(html) {
        const template = document.createElement('template')

        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    loader() {
        const pageLoader = instance.elementFromHtml(`
            <section class="loader">
                <div class="loading">
                    <span>${_s.loading}</span>
                    <div class="dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                </div>
            </section>`)

        document.querySelector('.page').setAttribute('page', 'loader')
        document.querySelector('.page').classList.add('is-visible')
        document.querySelector('.page-container').append(pageLoader)
    }

    intro() {

        const intro = instance.elementFromHtml(`
            <section class="intro">
                <p>${_s.conceptDescription}</p>
                <div class="categories list"></div>
            </section>
        `)
        document.querySelector('.page').setAttribute('page', 'intro')
        document.querySelector('.page-container').append(intro)

        document.querySelector('.app-header').style.display = "flex"
    }

    lobby() {
        const lobby = instance.elementFromHtml(`
            <section class="lobby">
                <section class="chapters"></section>
                <section class="chapter-details"></section>
            </section>
        `)
        document.querySelector('.page').setAttribute('page', 'lobby')
        document.querySelector('.page-container').append(lobby)
    }

}


