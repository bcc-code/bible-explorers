import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
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
        instance.debug = instance.experience.debug
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
        const game = _gl.elementFromHtml(`
            <section class="game flip-card">
                <div class="container">
                    <div class="cards"></div>
                    <button class="btn default next" disabled aria-label="card select">${_s.miniGames.flipCards.chooseKing}</button>
                </div>
                <div class="overlay"></div>
            </section>
        `)

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
                                <svg class="lock-icon" width="21" height="24" viewBox="0 0 21 24">
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

        document.querySelector('.app-container').append(game)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
    }

    useCorrectAssetsSrc() {
        if (!instance.data.cards) return

        instance.data.cards.forEach((card, index) => {
            instance.offline.fetchChapterAsset(card, 'image_back', (data) => {
                card.image_back = data.image_back
                document.querySelectorAll('article.card .card-back')[index].style.backgroundImage = "url('" + data.image_back + "')"
            })
            instance.offline.fetchChapterAsset(card, 'image_front', (data) => {
                card.image_front = data.image_front
                document.querySelectorAll('article.card .card-front')[index].style.backgroundImage = "url('" + data.image_front + "')"
            })
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const cards = gsap.utils.toArray('.flip-card .card')
        let firstTimeClick = true

        cards.forEach((card, index) => {
            const q = gsap.utils.selector(card)

            const cImage = q('.card-image')
            const cAudio = q('.card-audio')
            const cFront = q('.card-front')
            const cInput = q('.card-input input')

            gsap.set(cImage[0], {
                transformStyle: 'preserve-3d',
                transformPerspective: 1000,
            })

            gsap.set(cFront, { rotationY: 180 })

            const flipAnimation = gsap.timeline({ paused: true }).to(cImage[0], { duration: 1, rotationY: 180 })

            cInput[0].addEventListener('input', (e) => {
                if (e.target.value.length > e.target.maxLength) e.target.value = e.target.value.slice(0, e.target.maxLength)

                if (e.target.value.length == e.target.maxLength)
                    if (e.target.value === instance.data.cards[index].code) {
                        card.classList.add('flipped')
                        flipAnimation.play()

                        instance.audio.playSound('task-completed')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

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
                        }, 1000)
                    }
            })

            card.addEventListener('click', () => {
                if (document.querySelector('.flip-card').classList.contains('all-flipped')) {
                    const selectedCard = document.querySelector('.selected')

                    if (selectedCard) selectedCard.classList.remove('selected')

                    card.classList.add('selected')
                    document.querySelector('[aria-label="card select"]').disabled = false

                    if (firstTimeClick) {
                        firstTimeClick = false
                        instance.toggleGlitch()
                    }
                }
            })

            if (cAudio.length)
                cImage[0].addEventListener('click', () => {
                    cAudio[0].play()
                })
        })

        const chooseCard = document.querySelector('[aria-label="card select"')

        chooseCard.addEventListener('click', (e) => {
            e.target.disabled = true

            document.querySelector('.game-notification')?.remove()

            cards.forEach((card) => (card.style.pointerEvents = 'none'))

            instance.toggleGodVoice()

            instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
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

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button-arrow button-arrow-default'
    }
}
