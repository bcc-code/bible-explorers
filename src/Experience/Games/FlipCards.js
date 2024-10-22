import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'
import gsap from 'gsap'

let instance = null

export default class FlipCards {
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
        instance.flipCards = instance.stepData.flip_cards
        instance.confirmationScreen = instance.stepData.confirmation_screen

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        if (instance.confirmationScreen.cs_description !== '') {
            instance.toggleConfirmationScreen()
        } else {
            instance.toggleFlipCards()
        }
    }

    toggleConfirmationScreen() {
        instance.destroyFlipCards()
        instance.confirmationScreenHTML()
        instance.useCorrectAssetsSrcConfirmationScreen()
        instance.setConfirmationScreenEventListeners()
    }

    confirmationScreenHTML() {
        const container = _gl.elementFromHtml(
            `<div class="task-container" id="task-content">
                <div class="corner top-left"></div>
                <div class="edge top"></div>
                <div class="corner top-right"></div>
                <div class="edge left"></div>
                <div class="content">
                    <div class="task-content">
                        ${instance.confirmationScreen.cs_title !== '' ?
                            `<h5 class="task-heading">
                                <div class="corner top-left"></div>
                                <div class="edge top"></div>
                                <div class="corner top-right"></div>
                                <div class="edge left"></div>
                                <div class="content"> ${instance.confirmationScreen.cs_title} </div>
                                <div class="edge right"></div>
                                <div class="corner bottom-left"></div>
                                <div class="edge bottom"></div>
                                <div class="corner bottom-right"></div>
                            </h5>` : ''}
                        ${instance.confirmationScreen.cs_description ? `<p class="task-prompts">${instance.confirmationScreen.cs_description}</p>` : ''}
                        ${instance.confirmationScreen.cs_image ? `<div class="task-tutorial" id="task-image"><img src="${instance.confirmationScreen.cs_image}" /></div>` : ''}
                        ${instance.confirmationScreen.cs_button !== '' ? `
                        <div class="task-actions">
                            <button class="button-grid">
                                <div class="corner top-left"></div>
                                <div class="edge top"></div>
                                <div class="corner top-right"></div>
                                <div class="edge left"></div>
                                <div class="content">${instance.confirmationScreen.cs_button}</div>
                                <div class="edge right"></div>
                                <div class="corner bottom-left"></div>
                                <div class="edge bottom"></div>
                                <div class="corner bottom-right"></div>
                            </button>
                        </div>` : ''}
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>`
        )

        const nextStep = container.querySelector('button')
        if (nextStep) nextStep.addEventListener('click', instance.toggleFlipCards)

        instance.experience.interface.tasksDescription.append(container)
        instance.experience.setAppView('task-description')

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
    }

    useCorrectAssetsSrcConfirmationScreen() {
        instance.offline.fetchChapterAsset(instance.confirmationScreen, 'cs_image', (data) => {
            document.querySelector('#task-image img').src = data.cs_image
        })
    }

    setConfirmationScreenEventListeners() {
        instance.experience.navigation.prev.removeEventListener('click', instance.program.previousStep)
        instance.experience.navigation.prev.addEventListener('click', instance.backToGameDescription)
        instance.experience.navigation.next.addEventListener('click', instance.toggleFlipCards)
    }

    backToGameDescription() {
        instance.destroyConfirmationScreen()
        instance.program.gameDescription.show()
        instance.experience.navigation.prev.addEventListener('click', instance.program.previousStep)
    }

    destroyConfirmationScreen() {
        document.querySelector('#task-content')?.remove()

        instance.experience.navigation.prev.removeEventListener('click', instance.backToGameDescription)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleFlipCards)
    }

    toggleFlipCards() {
        instance.destroyConfirmationScreen()
        instance.flipCardsHTML()
        instance.useCorrectAssetsSrcFlipCards()
        instance.setFlipCardsEventListeners()
    }

    flipCardsHTML() {
        const game = _gl.elementFromHtml(`
            <section class="game flip-card flip-card-new" id="flipCards">
                <div class="fixed inset-0 bg-bke-darkpurple/75"></div>
                <div class="container">
                  <header class="game-header">
                    <h3 class="text-bke-accent text-2xl font-semibold">${instance.flipCards.title}</h3>
                  </header>
                  <div class="cards"></div>
                </div>
                <div class="overlay"></div>
            </section>
          `)

        if (instance.flipCards.cards) {
            instance.flipCards.cards.forEach((c) => {
                const card = _gl.elementFromHtml(`
                  <article class="card">
                      <div class="card-frame"></div>
                      <div class="card-image">
                          <div class="card-back" style="background-image: url('${c.image_back}')"></div>
                          <div class="card-front" style="background-image: url('${c.image_front}')"></div>
                      </div>
                      <div class="card-input bg-bke-purple">
                            <svg class="icon">
                                <use href="#book-solid" fill="currentColor"></use>
                            </svg>
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

    useCorrectAssetsSrcFlipCards() {
        if (!instance.flipCards.cards) return

        instance.flipCards.cards.forEach((card, index) => {
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

    setFlipCardsEventListeners() {
        instance.experience.navigation.prev.addEventListener('click', instance.toggleConfirmationScreen)

        const cards = gsap.utils.toArray('#flipCards .card')
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
                if (e.target.value.length > e.target.maxLength)
                    e.target.value = e.target.value.slice(0, e.target.maxLength)

                if (e.target.value.length == e.target.maxLength) {
                    if (e.target.value == instance.flipCards.cards[index].code) {
                        card.classList.add('flipped')
                        flipAnimation.play()

                        instance.audio.playSound('task-completed')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

                        // All cards are flipped
                        const flippedCards = document.querySelectorAll('.flipped')
                        if (flippedCards.length == instance.flipCards.cards.length) {
                            instance.experience.navigation.next.innerHTML = ''
                        }
                    } else {
                        e.target.parentNode.classList.add('wrong-code')
                        instance.audio.playSound('wrong')

                        setTimeout(() => {
                            e.target.parentNode.classList.remove('wrong-code')
                            e.target.value = ''
                        }, 1000)
                    }
                }
            })

            if (cAudio.length)
                cImage[0].addEventListener('click', () => {
                    cAudio[0].play()
                })
        })
    }

    destroyFlipCards() {
        document.querySelector('.game')?.remove()

        instance.experience.navigation.prev.removeEventListener('click', instance.toggleConfirmationScreen)
    }

    destroy() {
        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''

        instance.destroyConfirmationScreen()
        instance.destroyFlipCards()
        instance.experience.navigation.prev.addEventListener('click', instance.program.previousStep)
        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
