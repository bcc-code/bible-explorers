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

        instance.experience.navigation.next.innerHTML = `<span>${_s.journey.start}</span>`
    }

    removeLobby() {
        instance.experience.navigation.next.innerHTML = `
            <svg class="next-icon icon" viewBox="0 0 25 16">
                <use href="#arrow-right"></use>
            </svg>`

        document.querySelector('.lobby')?.remove()
    }
}