import Experience from '../Experience.js';
import Modal from '../Utils/Modal.js';
import _s from '../Utils/Strings.js';
import gsap from 'gsap';

let instance = null;

export default class Chapter3Game2 {
    constructor() {

        // Singleton
        if (instance)
            return instance

        instance = this

        this.experience = new Experience()
        this.world = this.experience.world
        this.audio = this.world.audio
        this.debug = this.experience.debug


        let selectedChapter = instance.world.selectedChapter

        this.data = selectedChapter.program.filter(program => program.taskType == "flip_cards")[0]

    }

    card(front, back, effect) {
        const card = document.createElement('div')
        card.className = 'card'
        card.innerHTML = `
            <div class="card__picture">
                <div class="card__face card--back">
                    <image data-src="${back}" class="lazyload">
                </div>
                <div class="card__face card--front">
                    <image data-src="${front}" class="lazyload">
                </div>
            </div>
            <audio class="card__audio">
                <source src="${effect}" type="audio/ogg">
            </audio>
            <input type="text" placeholder="code" class="card__input" />
        `

        return card
    }

    init() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            const gameWrapper = document.createElement('div')
            gameWrapper.classList.add('model__content')
            gameWrapper.setAttribute("id", "flipCardGame")

            for (let i = 0; i < this.data.flip_cards.length; i++) {

                const card = this.card(
                    this.data.flip_cards[i].image_front,
                    this.data.flip_cards[i].image_back,
                    this.data.flip_cards[i].sound_effect)
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
                    if (e.target.value === this.data.flip_cards[index].code) {
                        e.target.disabled = true
                        card.classList.add('is-flipped');
                    }
                })

            })

            document.addEventListener('click', (e) => {

                if (!e.target.closest('.is-flipped'))
                    return

                const selectedCard = document.querySelector('.card.selected')

                if (selectedCard !== null)
                    selectedCard.classList.remove('selected')

                e.target.closest('.card').classList.add('selected')

                const next = document.getElementById('continue')
                next.style.display = 'block'
                next.innerText = _s.miniGames.continue
                next.addEventListener('click', instance.advanceToNextStep)
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

    advanceToNextStep() {
        instance.modal.destroy()
        instance.world.program.advance()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()
    }

    finishGame() {
        instance.modal.destroy()
        instance.audio.playTaskCompleted()
        instance.toggleGameComplete()
    }

    toggleGame() {
        this.init()
    }

    toggleGlitch() {

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


        const restart = document.getElementById('restart')
        restart.style.display = 'block'
        restart.innerText = _s.miniGames.playAgain
        restart.addEventListener('click', () => {
            instance.modal.destroy()
            instance.toggleSimonSays()
        })
    }

}

