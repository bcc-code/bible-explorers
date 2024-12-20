import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Button from '../Components/Button.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'
import gsap from 'gsap'

let instance = null

export default class DavidsRefuge {
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
        instance.data = instance.stepData.davids_refuge

        instance.gameHTML()
        instance.useCorrectAssetsSrc()
        instance.setEventListeners()
    }

    gameHTML() {
        const chooseGoatBtn = new Button({
            content: _s.miniGames.davidsRefuge.chooseGoat,
            id: 'choose-goat',
            enabled: false,
        })
        const game = _gl.elementFromHtml(`
            <section class="game davids-refuge">
                <div class="container">
                    <div class="goats"></div>
                    ${chooseGoatBtn.getHtml()}
                </div>
                <div class="overlay"></div>
            </section>
        `)

        instance.chooseGoatBtn = game.querySelector('#choose-goat')

        instance.experience.interface.gameContainer.append(game)
        instance.experience.setAppView('game')

        instance.data.characters.forEach((goat) => {
            const url = goat.image.split('/')
            const fileName = url[url.length - 1].replace('goat-', '')
            const color = fileName.split('.')[0]

            const item = _gl.elementFromHtml(`
                <article class="goat" data-color="${color}">
                    <p class="tooltip top">${goat.text}</p>
                    <picture>
                        <source srcset="${goat.image}">
                        <img src="${goat.image}"/>
                    </picture>
                </article>
            `)

            game.querySelector('.goats').append(item)

            gsap.to(item, { scale: 0.85 })

            if (color === 'blue') {
                gsap.set(item, { x: '-100%' })
            } else if (color === 'yellow') {
                gsap.set(item, { x: '100%' })
            }
        })

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
    }

    useCorrectAssetsSrc() {
        instance.data.characters.forEach((character, index) => {
            instance.offline.fetchChapterAsset(character, 'image', (data) => {
                document.querySelectorAll('article.goat img')[index].src = data.image
            })
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        // Goat selection
        gsap.utils.toArray('.goat').forEach((item, index) => {
            const q = gsap.utils.selector(item)
            const tooltip = q('.tooltip')

            item.addEventListener('click', () => {
                instance.chooseGoatBtn.disabled = false

                if (item.classList.contains('is-active')) return
                document.querySelectorAll('.goat').forEach((goat) => {
                    goat.classList.remove('is-active')
                    gsap.to(goat, { scale: 0.85 })
                })

                item.classList.add('is-active')
                gsap.to(item, { scale: 1 })
            })

            instance.chooseGoatBtn.addEventListener('click', () => {
                if (item.classList.contains('is-active')) {
                    item.classList.add('is-selected')
                    gsap.to(item, { x: '-50%' })

                    tooltip[0].className = 'tooltip right'

                    if (instance.data.characters[index].tells_the_truth) {
                        tooltip[0].innerText = instance.data.correct_character_message

                        instance.audio.playSound('correct')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

                        gsap.to(instance.chooseGoatBtn, { autoAlpha: 0 })

                        instance.experience.navigation.next.innerHTML = ''
                    } else {
                        tooltip[0].innerText = instance.data.wrong_character_message

                        instance.chooseGoatBtn.querySelector('.content').innerText = _s.miniGames.tryAgain
                        instance.chooseGoatBtn.addEventListener('click', () => {
                            instance.destroy()
                            instance.toggleGame()
                        })
                    }
                } else {
                    item.remove()
                }
            })
        })
    }

    toggleQuestion() {
        const overlay = document.createElement('div')
        overlay.setAttribute('id', 'overlay')

        const message = this.messageModal(instance.data.start_message)
        document.body.append(overlay, message)

        gsap.to('#dialogue', { y: 0, autoAlpha: 1 })
    }

    destroy() {
        document.querySelector('.game')?.remove()

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.experience.setAppView('chapter')
    }
}
