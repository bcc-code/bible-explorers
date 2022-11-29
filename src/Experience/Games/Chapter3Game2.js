import Experience from '../Experience.js';
import Modal from '../Utils/Modal.js';
import _s from '../Utils/Strings.js';

let instance = null;

export default class Chapter3Game2 {
    constructor() {

        // Singleton
        if (instance)
            return instance

        instance = this

        this.experience = new Experience()
        this.world = this.experience.world

        this.init()

    }

    init() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            const gameWrapper = document.createElement('div')
            gameWrapper.classList.add('model__content')
            gameWrapper.setAttribute("id", "flipCardGame")

            for (let i = 0; i < 4; i++) {

                const card = new Card(`https://picsum.photos/id/56/200/300?grayscale`, `https://picsum.photos/id/${i}/200/300`).create()

                gameWrapper.append(card)
            }

            instance.modal = new Modal(gameWrapper.outerHTML, 'modal__flipCardGame')

            // Hide close
            const close = document.querySelector('.modal__close')
            close.style.display = 'none'

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'Game 2 title'
            document.querySelector('.modal__flipCardGame').prepend(title)

            document.querySelectorAll('.card').forEach((c) => {
                const cAudio = c.querySelector('.card__audio')
                const cAudioFile = c.querySelector('.card__audio audio')
                const cImage = c.querySelector('.card__picture')
                const cInput = c.querySelector('.card__footer input')

                cAudio.addEventListener('click', () => {
                    cAudioFile.play()
                })

                cInput.addEventListener('input', (e) => {

                    if (e.target.value === '2') {
                        cImage.classList.add('is-flipped')
                    } else {
                        cImage.classList.remove('is-flipped')
                    }
                })

            })
        }

    }
}

class Card {
    constructor(src, srcBack, callback) {
        this.src = src
        this.srcBack = srcBack
    }

    create() {
        const card = document.createElement('div')
        card.className = 'card'

        const cardPicture = document.createElement('div')
        cardPicture.className = 'card__picture'


        const cardFront = document.createElement('div')
        cardFront.className = 'card__face card__front'
        cardFront.appendChild(this.picture(this.src))

        const cardBack = document.createElement('div')
        cardBack.className = 'card__face card__back'
        cardBack.appendChild(this.picture(this.srcBack))

        cardPicture.append(cardFront, cardBack)

        const cardFooter = document.createElement('div')
        cardFooter.className = 'card__footer'

        const cardFooterInput = document.createElement('input')
        cardFooterInput.setAttribute('placeholder', 'code')
        cardFooter.appendChild(cardFooterInput)


        const cardAudio = document.createElement('div')
        cardAudio.className = 'card__audio'
        cardAudio.appendChild(this.audio('https://audio.code.org/goal1.mp3'))

        cardFront.append(cardAudio)

        card.append(cardPicture, cardFooter)

        return card
    }

    audio(src) {
        const audio = new Audio(src)

        return audio
    }

    picture(src) {
        const image = new Image(200, 300)
        image.setAttribute('data-src', src)
        image.className = 'lazyload'

        return image
    }
}