import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
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

    toggleGame() {
        instance.gameHTML()
        instance.setEventListeners()

        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()
    }

    gameHTML() {
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.flip_cards

        const game = _gl.elementFromHtml(`
            <section class="game flip-card">
                <div class="container">
                    <div class="cards"></div>
                    <button class="btn default next" disabled aria-label="card select">${_s.miniGames.flipCards.chooseKing}</button>
                </div>
                <div class="overlay"></div>
            </section>
        `)

        instance.data.cards.forEach(c => {
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
                        <input type="number" placeholder="#" maxlength="1" />
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

        document.querySelector('.ui-container').append(game)
        document.querySelector('.cta').style.display = 'none'

        const skipBTN = _gl.elementFromHtml(`
            <button class="btn default skip">${_s.miniGames.skip}</button>
        `)

        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })

        if (instance.debug.developer || instance.debug.onQuickLook())
            document.querySelector('.game.flip-card .container').append(skipBTN)
    }

    setEventListeners() {
        const cards = gsap.utils.toArray('.flip-card .card')
        let firstTimeClick = true

        cards.forEach((card, index) => {
            const q = gsap.utils.selector(card)

            const cImage = q('.card-image')
            const cAudio = q('.card-audio')
            const cFront = q('.card-front')
            const cInput = q('.card-input input')

            gsap.set(cImage[0], {
                transformStyle: "preserve-3d",
                transformPerspective: 1000
            })

            gsap.set(cFront, { rotationY: 180 })

            const flipAnimation = gsap.timeline({ paused: true })
                .to(cImage[0], { duration: 1, rotationY: 180 })

            cInput[0].addEventListener('input', (e) => {
                if (e.target.value === instance.data.cards[index].code) {
                    card.classList.add('flipped')
                    flipAnimation.play()

                    // All cards are flipped
                    const flippedCards = document.querySelectorAll('.flipped')

                    if (flippedCards.length == instance.data.cards.length) {
                        document.querySelector('.flip-card').classList.add('all-flipped')
                    }
                }
            })

            card.addEventListener('click', () => {
                if (document.querySelector('.flip-card').classList.contains('all-flipped')) {
                    const selectedCard = document.querySelector('.selected')

                    if (selectedCard)
                        selectedCard.classList.remove('selected')

                    card.classList.add('selected')
                    document.querySelector('[aria-label="card select"]').disabled = false

                    if (firstTimeClick) {
                        firstTimeClick = false
                        instance.toggleGlitch()
                    }
                }
            })

            if (cAudio.length)
                cImage[0].addEventListener('click', () => { cAudio[0].play() })
        })

        const chooseCard = document.querySelector('[aria-label="card select"')

        chooseCard.addEventListener('click', (e) => {
            e.target.remove()

            document.querySelector('.game-notification')?.remove()
            document.querySelector('.cta').style.display = 'flex'
            cards.forEach(card => card.style.pointerEvents = 'none')

            instance.toggleGodVoice()
        })

        instance.experience.navigation.next.addEventListener('click', instance.destroy)
        instance.experience.navigation.prev.addEventListener('click', instance.destroy)
    }

    toggleGlitch() {
        const notification = _gl.elementFromHtml(`
            <aside class="game-notification">
                <img src="games/glitchVoice.png"/>
                <p>${instance.data.glitchs_voice.text}</p>
            </aside>
        `)

        document.querySelector('.flip-card .container').append(notification)

        gsap.set(notification, { x: '100%' })
        gsap.to(notification, {
            x: 0, onComplete: () => {
                instance.audio.togglePlayTaskDescription(instance.data.glitchs_voice.audio)
            }
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

        gsap.set(notification, { x: '100%' })
        gsap.to(notification, {
            x: 0, onComplete: () => {
                instance.audio.togglePlayTaskDescription(instance.data.gods_voice.audio)
            }
        })
    }

    destroy() {
        document.querySelector('.game')?.remove()
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        document.querySelector('.cta').style.display = 'flex'
    }
}