import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Button from '../Components/Button.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'
import gsap from 'gsap'

let instance = null

export default class ChooseNewKing {
    constructor() {
        instance = this
        instance.offline = new Offline()
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
    }

    toggleGame() {
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.choose_new_king

        instance.gameHTML()
        instance.useCorrectAssetsSrc()
        instance.setEventListeners()

        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()
    }

    gameHTML() {
        const chooseKingBtn = new Button(_s.miniGames.flipCards.chooseKing, 'choose-king', false)
        const game = _gl.elementFromHtml(`
            <section class="game flip-card">
                <div class="container">
                    <div class="cards"></div>
                    ${chooseKingBtn.getHtml()}
                </div>
                <div class="overlay"></div>
            </section>
        `)

        instance.chooseKingBtn = game.querySelector('#choose-king')

        if (instance.data.cards) {
            instance.data.cards.forEach((c) => {
                const card = _gl.elementFromHtml(`
                    <article class="card">
                        <div class="card-frame"></div>
                        <div class="card-image">
                            <div class="card-back" style="background-image: url('${c.image_back}')"></div>
                            <div class="card-front" style="background-image: url('${c.image_front}')"></div>
                        </div>
                        <div class="card-input">
                            <div class="icon">
                                <svg class="icon">
                                    <use href="#locked"></use>
                                </svg>
                            </div>
                            <input type="number" placeholder="#" maxlength="${c.code.length}" />
                        </div>
                    </article>
                `)

                if (c.sound_effect) {
                    const audio = _gl.elementFromHtml(`
                        <audio class="card-audio" src="${c.sound_effect}"></audio>
                    `)

                    card.append(audio)
                    card.classList.add('has-audio')
                }

                game.querySelector('.cards').append(card)
            })
        }

        instance.experience.interface.gameContainer.append(game)
        instance.experience.setAppView('game')

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
    }

    useCorrectAssetsSrc() {
        if (!instance.data.cards) return

        instance.data.cards.forEach((card, index) => {
            instance.offline.fetchChapterAsset(card, 'image_back', (data) => {
                card.image_back = data.image_back
                document.querySelectorAll('article.card .card-back')[index].style.backgroundImage =
                    "url('" + data.image_back + "')"
            })
            instance.offline.fetchChapterAsset(card, 'image_front', (data) => {
                card.image_front = data.image_front
                document.querySelectorAll('article.card .card-front')[index].style.backgroundImage =
                    "url('" + data.image_front + "')"
            })
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const cards = gsap.utils.toArray('.flip-card .card')
        let glitchVisible = false

        cards.forEach((card, index) => {
            const q = gsap.utils.selector(card)

            const cImage = q('.card-image')
            const cAudio = q('.card-audio')
            const cFront = q('.card-front')
            const cInput = q('.card-input input')

            if (index === 0) {
                cInput[0].focus()
            }

            gsap.set(cImage[0], {
                transformStyle: 'preserve-3d',
                transformPerspective: 1000,
            })

            gsap.set(cFront, { rotationY: 180 })

            const flipAnimation = gsap
                .timeline({ paused: true })
                .to(cImage[0], { duration: 1, rotationY: 180 })

            cInput[0].addEventListener('input', (e) => {
                if (e.target.value.length > e.target.maxLength)
                    e.target.value = e.target.value.slice(0, e.target.maxLength)

                if (e.target.value.length == e.target.maxLength)
                    if (e.target.value === instance.data.cards[index].code) {
                        card.classList.add('flipped')
                        flipAnimation.play()

                        instance.audio.playSound('task-completed')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

                        const nextInput = cards[index + 1]?.querySelector('.card-input input')
                        if (nextInput) {
                            nextInput.focus()
                        }

                        // All cards are flipped
                        const flippedCards = document.querySelectorAll('.flipped')

                        if (flippedCards.length == instance.data.cards.length) {
                            document.querySelector('.flip-card').classList.add('all-flipped')
                        }
                    } else {
                        e.target.parentNode.classList.add('wrong-code')
                        instance.audio.playSound('wrong')

                        setTimeout(() => {
                            e.target.parentNode.classList.remove('wrong-code')
                            e.target.value = ''
                            e.target.focus()
                        }, 1000)
                    }
            })

            card.addEventListener('click', () => {
                const allCardsFlipped = document.querySelector('.flip-card').classList.contains('all-flipped')
                if (allCardsFlipped && !glitchVisible) {
                    glitchVisible = true
                    instance.toggleGlitch()
                }

                if (document.querySelector('.flip-card').classList.contains('all-flipped')) {
                    const selectedCard = document.querySelector('.selected')
                    if (selectedCard) selectedCard.classList.remove('selected')

                    card.classList.add('selected')
                    instance.chooseKingBtn.disabled = false
                }
            })

            if (cAudio.length)
                cImage[0].addEventListener('click', () => {
                    cAudio[0].play()
                })
        })

        instance.chooseKingBtn.addEventListener('click', (e) => {
            const allCardsFlipped = document.querySelector('.flip-card').classList.contains('all-flipped')
            if (allCardsFlipped) {
                instance.toggleGodVoice()

                instance.chooseKingBtn.disabled = true
                cards.forEach((card) => (card.style.pointerEvents = 'none'))
                instance.experience.navigation.next.innerHTML = ''
            }

            document.querySelector('.game-notification')?.remove()
        })
    }

    toggleGlitch() {
        const notification = _gl.elementFromHtml(`
            <aside class="game-notification">
                <img src="games/glitchVoice.png"/>
                <p>${instance.data.glitchs_voice.text}</p>
            </aside>
        `)

        document.querySelector('.flip-card .container').append(notification)

        gsap.set(notification, { x: '-100%' })
        gsap.to(notification, {
            x: 0,
            onComplete: () => {
                instance.audio.stopAllTaskDescriptions()
                instance.audio.togglePlayTaskDescription(instance.data.glitchs_voice.audio)
            },
        })
    }

    toggleGodVoice() {
        const notification = _gl.elementFromHtml(`
            <aside class="game-notification">
                <img src="games/godVoice.png"/>
                <p>${instance.data.gods_voice.text}</p>
            </aside>
        `)

        document.querySelector('.flip-card .container').append(notification)

        gsap.set(notification, { x: '-100%' })
        gsap.to(notification, {
            x: 0,
            onComplete: () => {
                instance.audio.stopAllTaskDescriptions()
                instance.audio.togglePlayTaskDescription(instance.data.gods_voice.audio)
            },
        })
    }

    destroy() {
        document.querySelector('.game')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
    }
}
