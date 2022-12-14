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
        this.debug = this.experience.debug

        this.data = {
            images: {
                front: [
                    'games/en-konge/front/A.jpeg',
                    'games/en-konge/front/B.jpeg',
                    'games/en-konge/front/C.jpeg',
                    'games/en-konge/front/D.jpeg',
                    'games/en-konge/front/E.jpeg',
                    'games/en-konge/front/F.jpeg',
                ],
                back: [
                    'games/en-konge/back/A.jpeg',
                    'games/en-konge/back/B.jpeg',
                    'games/en-konge/back/C.jpeg',
                    'games/en-konge/back/D.jpeg',
                    'games/en-konge/back/E.jpeg',
                    'games/en-konge/back/F.jpeg',
                ]
            },
            audio: [
                'https://audio.code.org/goal1.mp3'
            ],
            codes: [
                '22',
                '33',
                '44',
                '55',
                '66',
                '77'
            ]
        }

        this.init()
    }

    toggleGame() {
        this.init()
    }

    init() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            const gameWrapper = document.createElement('div')
            gameWrapper.classList.add('model__content')
            gameWrapper.setAttribute("id", "flipCardGame")

            for (let i = 0; i < 6; i++) {

                const card = this.card(
                    this.data.images.back[i],
                    this.data.images.front[i],
                    this.data.audio[0])

                gameWrapper.append(card)

            }

            instance.modal = new Modal(gameWrapper.outerHTML, 'modal__flipCardGame')

            // Hide close
            const close = document.querySelector('.modal__close')
            close.style.display = 'none'

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'En konge'
            document.querySelector('.modal__flipCardGame').prepend(title)


            document.querySelectorAll('.card').forEach((card, index) => {
                const picture = card.querySelector('.card__picture')
                const audio = card.querySelector('.card__audio')
                const input = card.querySelector('.card__input')

                picture.addEventListener('click', () => {
                    audio.play()
                })

                input.addEventListener('input', (e) => {
                    if (e.target.value === this.data.codes[index]) {
                        e.target.disabled = true
                        card.classList.add('is-flipped');
                    }
                })

            })

            document.addEventListener('click', (e) => {

                const targetEl = e.target.closest('.card')

                if (!targetEl.classList.contains('is-flipped')) return

                const selectedCard = document.querySelector('.card.selected')
                if (selectedCard !== null)
                    selectedCard.classList.remove('selected')

                targetEl.classList.add('selected')

            })

            const back = document.getElementById('back')
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', () => {
                instance.modal.destroy()
                instance.world.program.taskDescription.toggleTaskDescription()
            })

            const skip = document.getElementById("skip")
            skip.innerText = _s.miniGames.skip
            skip.style.display = instance.debug.developer || instance.debug.onQuickLook()
                ? 'block'
                : 'none'

            skip.addEventListener('click', instance.advanceToNextStep)

        }

    }

    card(imgSrc, imgSrc2, voice) {
        const card = document.createElement('div')
        card.className = 'card'
        card.innerHTML = `
            <div class="card__picture">
                <div class="card__face card--front">
                    <image data-src="${imgSrc}" class="lazyload">
                </div>
                <div class="card__face card--back">
                    <image data-src="${imgSrc2}" class="lazyload">
                </div>
            </div>
            <audio class="card__audio">
                <source src="${voice}" type="audio/mp3">
            </audio>
            <input type="text" placeholder="code" class="card__input" />
        `

        return card
    }

    advanceToNextStep() {
        instance.modal.destroy()
        instance.world.program.advance()
    }

    toggleGameComplete() {

        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title">
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                    <h2>${_s.miniGames.completed.title}</h2>
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html, 'modal__congrats')

        const next = document.getElementById('continue')
        next.style.display = 'block'
        next.innerText = _s.miniGames.continue
        next.addEventListener('click', instance.advanceToNextStep)
    }

}

