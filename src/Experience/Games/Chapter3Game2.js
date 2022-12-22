import Experience from '../Experience.js';
import Modal from '../Utils/Modal.js';
import _s from '../Utils/Strings.js';
import gsap from 'gsap';

let instance = null;

export default class Chapter3Game2 {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug
    }

    init() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            instance.data = instance.world.program.getCurrentStepData()
            console.log(instance.data)

            const gameWrapper = document.createElement('div')
            gameWrapper.classList.add('model__content')
            gameWrapper.setAttribute("id", "flipCardGame")

            const cardWrapper = document.createElement('div')
            cardWrapper.setAttribute("id", "cardWrapper")

            instance.data.flip_cards.cards.forEach(card => {
                cardWrapper.append(instance.getCardHtml(
                    card.image_front,
                    card.image_back,
                    card.sound_effect
                ))
            })

            const paragraph = document.createElement('div')
            paragraph.setAttribute('id', 'message')

            gameWrapper.append(cardWrapper, paragraph)

            instance.modal = new Modal(gameWrapper.outerHTML, 'modal__flipCardGame')

            const close = document.querySelector('.modal__close')
            close.style.display = 'none'

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'En konge'
            document.querySelector('.modal__flipCardGame').prepend(title)

            const next = document.getElementById('continue')
            next.innerText = 'next'

            const back = document.getElementById('back')
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', () => {
                instance.modal.destroy()
                instance.world.program.previousStep()
            })

            let firstTimeClick = true

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
                    if (input[0].value === instance.data.flip_cards.cards[index].code) {
                        card.setAttribute('flipped', '')
                        flip.play()
                    }
                })

                back[0].addEventListener('click', () => { audio[0].play() })
                front[0].addEventListener('click', () => { audio[0].play() })

                card.addEventListener('click', () => {
                    const flippedCards = document.querySelectorAll('[flipped]')
                    if (flippedCards.length == instance.data.flip_cards.cards.length) {

                        cardWrapper.classList.add('cardSelection')
                        const selectedCard = document.querySelector('[selected]')

                        if (selectedCard !== null) {
                            selectedCard.removeAttribute('selected')
                            gsap.set(selectedCard.querySelector('button'), { duration: 0.2, y: -40, autoAlpha: 0 })
                        }

                        card.setAttribute('selected', '')
                        gsap.set(button, { duration: 0.2, y: 0, autoAlpha: 1 })

                        setTimeout(() => {
                            if (firstTimeClick)
                                instance.toggleGlitch()

                            firstTimeClick = false
                        }, 2000)
                    }
                })

                button[0].addEventListener('click', () => {
                    card.setAttribute('choosed', '')
                    cardWrapper.classList.remove('cardSelection')
                    cardWrapper.classList.add('cardChoosed')

                    button[0].innerText = 'Hero selected'

                    setTimeout(() => {
                        instance.toggleGodVoice()
                        next.style.display = 'block'
                        next.addEventListener('click', instance.finishGame)
                    }, 2000)
                })
            })
        }
    }

    toggleGame() {
        instance.init()
        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()
    }

    getCardHtml(front, back, effect) {
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

    toggleGlitch() {
        const glitch = document.getElementById('message')
        glitch.innerText = instance.data.flip_cards.glitchs_voice.text
        instance.audio.togglePlayTaskDescription(instance.data.flip_cards.glitchs_voice.audio)
    }

    toggleGodVoice() {
        const god = document.getElementById('message')
        god.innerText = instance.data.flip_cards.gods_voice.text
        instance.audio.togglePlayTaskDescription(instance.data.flip_cards.gods_voice.audio)
    }

    finishGame() {
        instance.modal.destroy()
        instance.world.program.nextStep()
    }
}