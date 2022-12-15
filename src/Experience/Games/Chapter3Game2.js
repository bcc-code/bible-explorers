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
            <image data-src="${back}" class="lazyload cardBack">
            <image data-src="${front}" class="lazyload cardFront">
            <audio class="cardAudio">
                <source src="${effect}" type="audio/ogg">
            </audio>
            <input type="text" placeholder="code" class="cardInput" />
            <button class="cardSelect">Choose this hero</button>
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

            const close = document.querySelector('.modal__close')
            close.style.display = 'none'

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'En konge'
            document.querySelector('.modal__flipCardGame').prepend(title)


            const next = document.getElementById('continue')
            next.innerText = 'next'
            next.addEventListener('click', instance.advanceToNextStep)

            gsap.utils.toArray('.card').forEach((card, index) => {
                gsap.set(card, {
                    transformStyle: "preserve-3d",
                    transformPerspective: 1000
                })

                const q = gsap.utils.selector(card)
                const front = q('.cardFront')
                const back = q('.cardBack')
                const input = q('.cardInput')
                const audio = q('.cardAudio')
                const button = q('.cardSelect')

                gsap.set([front, button], { rotationY: 180 })
                gsap.set([button], { y: -40, autoAlpha: 0 })

                const flip = gsap.timeline({ paused: true })
                    .to(input, { autoAlpha: 0, display: 'none' })
                    .to(card, { duration: 1, rotationY: 180 })


                input[0].addEventListener('input', () => {
                    if (input[0].value === this.data.flip_cards[index].code) {
                        card.setAttribute('flipped', '')
                        flip.play()
                    }
                })

                let firstTimeClick = false

                card.addEventListener('click', () => {
                    audio[0].play()


                    const flippedCards = document.querySelectorAll('[flipped]')
                    if (flippedCards.length == this.data.flip_cards.length) {

                        document.getElementById('flipCardGame').classList.add('cardSelection')
                        const selectedCard = document.querySelector('[selected]')

                        if (selectedCard !== null) {
                            selectedCard.removeAttribute('selected')
                            gsap.set(selectedCard.querySelector('button'), { duration: 0.2, y: -40, autoAlpha: 0 })
                        }

                        card.setAttribute('selected', '')
                        gsap.set(button, { duration: 0.2, y: 0, autoAlpha: 1 })

                        if (!firstTimeClick) {
                            setTimeout(() => {
                                instance.toggleGlitch()
                            }, 1000)
                        }

                        firstTimeClick = true

                    }

                })

                button[0].addEventListener('click', () => {
                    card.setAttribute('choosed', '')
                    document.getElementById('flipCardGame').classList.remove('cardSelection')
                    document.getElementById('flipCardGame').classList.add('cardChoosed')

                    button[0].innerText = 'Card selected'

                    setTimeout(() => {
                        instance.toggleGodVoice()
                        next.style.display = 'block'
                    }, 1000)

                })

            })

            const back = document.getElementById('back')
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', () => {
                instance.modal.destroy()
                instance.world.program.taskDescription.toggleTaskDescription()
            })

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

        this.audio.setOtherAudioIsPlaying(true)
        this.audio.fadeOutBgMusic()
    }

    toggleGlitch() {
        // instance.modal.destroy()
        // instance.world.program.taskDescription.toggleTaskDescription()

        console.log('glitch');
    }

    toggleGodVoice() {
        console.log('god voice');
    }

    toggleIris() {
        // instance.modal.destroy()
        // instance.world.program.taskDescription.toggleTaskDescription()
        console.log('iris');

    }

}

