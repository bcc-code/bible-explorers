import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import gsap from 'gsap'

let instance = null

export default class Chapter3Game2 {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug
    }

    init() {
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.flip_cards

        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        } else {
            const gameWrapper = document.createElement('div')
            gameWrapper.classList.add('model__content')
            gameWrapper.setAttribute("id", "flipCardGame")

            const cardWrapper = document.createElement('div')
            cardWrapper.setAttribute("id", "cardWrapper")

            instance.data.cards.forEach(card => {
                cardWrapper.append(instance.getCardHtml(
                    card.image_front,
                    card.image_back,
                    card.sound_effect
                ))
            })

            gameWrapper.append(cardWrapper)

            instance.modal = new Modal(gameWrapper.outerHTML, 'modal__flipCardGame')

            const close = document.querySelector('.modal__close')
            close.style.display = 'none'

            const title = document.querySelector('.modal__heading--minigame')
            title.innerHTML = `<h3>${instance.stepData.details.title}</h3>
                <p>${instance.stepData.details.prompts[0].prompt}</p>`


            const back = document.getElementById('back')
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', () => {
                instance.modal.destroy()
                instance.program.previousStep()
            })

            const next = document.getElementById('continue')
            next.style.display = 'block'
            next.disabled = true
            next.innerText = 'next'

            const skip = document.getElementById("skip")
            skip.innerText = _s.miniGames.skip
            skip.style.display = instance.debug.developer || instance.debug.onQuickLook()
                ? 'block'
                : 'none'
            skip.addEventListener('click', instance.finishGame)

            let firstTimeClick = true
            let cards = gsap.utils.toArray('.card')

            cards.forEach((card, index) => {
                gsap.set(card, {
                    transformStyle: "preserve-3d",
                    transformPerspective: 1000
                })

                const q = gsap.utils.selector(card)
                const front = q('.cardFront')
                const back = q('.cardBack')
                const input = q('input')
                const audio = q('audio')

                gsap.set(front, { rotationY: 180 })

                const flip = gsap.timeline({ paused: true })
                    .to(input, { autoAlpha: 0, display: 'none' })
                    .to(card, { duration: 1, rotationY: 180 })

                const cardSelect = document.createElement('button')
                cardSelect.className = 'button bg--secondary border--5 border--solid border--transparent height px rounded--full'
                cardSelect.setAttribute('card-select', '')
                cardSelect.innerText = _s.miniGames.flipCards.chooseKing
                cardSelect.disabled = true

                input[0].addEventListener('input', () => {
                    if (input[0].value === instance.data.cards[index].code) {
                        card.setAttribute('flipped', '')
                        flip.play()

                        const flippedCards = document.querySelectorAll('[flipped]')

                        if (flippedCards.length == instance.data.cards.length) {
                            title.querySelector('p').innerText = instance.stepData.details.prompts[1].prompt
                            document.getElementById('flipCardGame').append(cardSelect)
                        }
                    }
                })

                if (audio.length) {
                    back[0].addEventListener('click', () => { audio[0].play() })
                    front[0].addEventListener('click', () => { audio[0].play() })
                }

                card.addEventListener('click', () => {
                    const flippedCards = document.querySelectorAll('[flipped]')
                    if (flippedCards.length == instance.data.cards.length) {

                        document.getElementById('cardWrapper').classList.add('cardSelection')
                        const selectedCard = document.querySelector('[selected]')

                        if (selectedCard !== null) {
                            selectedCard.removeAttribute('selected')
                        }

                        card.setAttribute('selected', '')
                        document.querySelector('[card-select]').disabled = false

                        setTimeout(() => {
                            if (firstTimeClick)
                                instance.toggleGlitch()

                            firstTimeClick = false
                        }, 300)
                    }
                })

                card.addEventListener('mouseenter', () => {
                    input[0].focus()
                })
            })

            document.addEventListener('click', (event) => {
                if (event.target.hasAttribute('card-select')) {
                    document.getElementById('cardWrapper').classList.remove('cardSelection')
                    document.getElementById('cardWrapper').classList.add('cardChoosed')

                    const selectedCard = document.querySelector('[selected]')
                    selectedCard.setAttribute('choosed', '')
                    document.querySelector('[card-select]').disabled = true

                    setTimeout(() => {
                        instance.toggleGodVoice()
                        next.disabled = false
                        next.addEventListener('click', instance.finishGame)
                    }, 1000)
                }
            })
        }
    }

    toggleGame() {
        instance.init()
        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()
    }

    getCardHtml(front, back, sound) {
        const card = document.createElement('div')
        card.className = 'card'
        card.innerHTML = `
            <image data-src="${back}" class="lazyload cardBack">
            <image data-src="${front}" class="lazyload cardFront">`

        if (sound) card.innerHTML += `
                <i class="icon-volume-solid"></i>
                <audio class="cardAudio">
                    <source src="${sound}" type="audio/ogg">
                </audio>
            `

        card.innerHTML += `<div class='cardInput'><i class='icon-lock-solid'></i><input type="text" placeholder="#"/></div>
            <div class="cardSelect"></div>
        `
        return card
    }

    dialogueHtml(cls, text, avatar) {
        return `
            <div id="dialogue" class="dialogue ${cls}">
                <div class="dialogue-content">
                    <img src="${avatar}"/>
                    <p>${text}</p>
                </div>
            </div>
        `
    }

    toggleGlitch() {
        const imageSrc = 'games/glitch.png'
        const glitch = instance.dialogueHtml('glitch', instance.data.glitchs_voice.text, imageSrc)

        document.querySelector('.modal__flipCardGame').insertAdjacentHTML('beforeend', glitch)

        gsap.to('.dialogue', {
            y: 0, autoAlpha: 1, onComplete: () => {
                instance.audio.togglePlayTaskDescription(instance.data.glitchs_voice.audio)
            }
        })
    }

    toggleGodVoice() {
        const imageSrc = 'games/godVoice.png'
        const godVoice = instance.dialogueHtml('godVoice', instance.data.gods_voice.text, imageSrc)

        gsap.to('.dialogue', {
            y: '100%', autoAlpha: 0, onComplete: () => {
                document.querySelector('.dialogue').remove()
                document.querySelector('.modal__flipCardGame').insertAdjacentHTML('beforeend', godVoice)
                gsap.to('.dialogue', {
                    y: 0, autoAlpha: 1, onComplete: () => {
                        instance.audio.togglePlayTaskDescription(instance.data.gods_voice.audio)
                    }
                })
            }
        })
    }

    finishGame() {
        instance.modal.destroy()
        instance.program.nextStep()
    }
}