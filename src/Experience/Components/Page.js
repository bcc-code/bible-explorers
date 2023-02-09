// document.querySelector(".page .intro").innerText = _s.conceptDescription
import Experience from '../Experience.js';
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class Page {
    constructor() {
        instance = this
        instance.experience = new Experience()
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
            </section>
        `)

        document.querySelector('.page').className = 'page page-loader'
        document.querySelector('.page .container').append(pageLoader)
    }

    createIntro() {
        const intro = _gl.elementFromHtml(`
            <section class="intro">
                <p>${_s.conceptDescription}</p>
                <div class="categories list"></div>
            </section>
        `)

        document.querySelector('.page').className = 'page page-intro'
        document.querySelector('.page .container').append(intro)

        document.querySelector('.cta').style.display = 'none'
    }

    removeIntro() {
        document.querySelector('.intro')?.remove()
    }

    createLobby() {
        const lobby = _gl.elementFromHtml(`
            <section class="lobby">
                <section class="chapters"></section>
            </section>
        `)
        document.querySelector('.page').className = 'page page-lobby'
        document.querySelector('.page .container').append(lobby)
        document.querySelector('.cta').style.display = 'flex'

        instance.experience.navigation.next.querySelector('svg').style.display = 'none'
        instance.experience.navigation.next.querySelector('span').innerText = _s.journey.start
        instance.experience.navigation.next.querySelector('span').style.display = 'block'

    }

    removeLobby() {
        instance.experience.navigation.next.querySelector('svg').style.display = 'block'
        instance.experience.navigation.next.querySelector('span').style.display = 'none'

        document.querySelector('.lobby')?.remove()
    }
}