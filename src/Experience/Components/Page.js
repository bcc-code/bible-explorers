// document.querySelector(".page .intro").innerText = _s.conceptDescription
import Experience from '../Experience.js';
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Page {
    constructor() {

        instance = this
        instance.experience = new Experience()

        const prev = document.querySelector('[aria-label="prev page"]')
        const next = document.querySelector('[aria-label="next page"]')

        prev.style.display = 'none'
        next.style.display = 'none'
    }

    loader() {
        const pageLoader = _gl.elementFromHtml(`
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

        document.querySelector('.page').className = 'page page-loader'
        document.querySelector('.page .container').append(pageLoader)
    }

    intro() {
        const intro = _gl.elementFromHtml(`
            <section class="intro">
                <p>${_s.conceptDescription}</p>
                <div class="categories list"></div>
            </section>
        `)

        document.querySelector('.page').className = 'page page-intro'
        document.querySelector('.page .container').append(intro)
    }

    lobby() {
        const lobby = _gl.elementFromHtml(`
            <section class="lobby">
                <section class="chapters"></section>
            </section>
        `)
        document.querySelector('.page').className = 'page page-lobby'
        document.querySelector('.page .container').append(lobby)
    }

}


