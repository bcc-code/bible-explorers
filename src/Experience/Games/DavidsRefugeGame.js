import gsap from 'gsap'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class DavidsRefuge {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.audio = instance.world.audio
        instance.debug = instance.experience.debug
    }

    toggleGame() {
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.davids_refuge
        document.querySelector('.cta').style.display = 'none'

        instance.gameHTML()

        if (instance.data.hints.length > 0)
            instance.hintsHTML()

        instance.setEventListeners()
    }

    gameHTML() {
        const game = _gl.elementFromHtml(`
            <section class="game davids-refuge">
                <div class="container">
                    <div class="goats"></div>
                    <button class="btn default" aria-label="select goat" disabled><span>${_s.miniGames.davidsRefuge.chooseGoat}</span></button>
                </div>
                <div class="overlay"></div>
            </section>
        `)

        document.querySelector('.ui-container').append(game)

        instance.data.characters.forEach(goat => {
            const url = goat.image.split('/')
            const fileName = url[url.length - 1].replace('goat-', '')
            const color = fileName.split('.')[0]

            const item = _gl.elementFromHtml(`
                <article class="goat" data-color="${color}">
                    <div class="circle"></div>
                    <p class="tooltip">${goat.text}</p>
                    <img src="${goat.image}"/>
                </article>
            `)

            game.querySelector('.goats').append(item)
        })

        const skipBTN = _gl.elementFromHtml(`
            <button class="btn default" aria-label="skip-button">${_s.miniGames.skip}</button>
        `)

        if (instance.debug.developer || instance.debug.onQuickLook())
            game.querySelector('.container').append(skipBTN)

        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })
    }

    hintsHTML() {
        if (!instance.data.hints.length)
            return

        const hints = _gl.elementFromHtml(`
            <aside class="hints">
                <h4>Hints</h4>
                <ul>
                    <li>${instance.data.hints[0].text}</li>
                </ul>
                <button class="btn default next">Get more hints</button>
            </aside>
        `)

        const hintsToggle = _gl.elementFromHtml(`
            <button class="btn rounded" aria-label="toggle hints">
                <svg class="question-icon icon" width="15" height="22" viewBox="0 0 15 22">
                    <use href="#question-mark"></use>
                </svg>
            </button>
        `)

        document.querySelector('.davids-refuge .container').append(hintsToggle, hints)

        const hintsList = hints.querySelector('ul')

        gsap.set(hints, { scale: 0, autoAlpha: 0, transformOrigin: 'top left' })

        const showHints = gsap.timeline({ paused: true })
            .to(hints, { scale: 1, autoAlpha: 1 })

        hintsToggle.addEventListener('click', () => {
            hints.style.opacity === '0'
                ? showHints.play()
                : showHints.reverse()
        })

        document.addEventListener('click', (event) => {
            if (!hints.contains(event.target) && !hintsToggle.contains(event.target) && !getHint.contains(event.target))
                showHints.reverse()
        })

        let index = 1

        const getHint = hints.querySelector('button')
        getHint.addEventListener('click', () => {
            if (index < instance.data.hints.length) {
                const hint = _gl.elementFromHtml(`<li>${instance.data.hints[index].text}</li>`)
                hintsList.appendChild(hint)
            }

            if (++index == instance.data.hints.length)
                getHint.remove()
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        // Goat selection
        const selectGoat = document.querySelector('[aria-label="select goat"]')

        gsap.utils.toArray('.goat').forEach(item => {
            const q = gsap.utils.selector(item)
            const img = q('img')
            const circle = q('.circle')
            const tooltip = q('.tooltip')


            item.addEventListener('click', () => {
                selectGoat.disabled = false

                if (item.hasAttribute('data-selected')) return

                document.querySelectorAll('.goat').forEach(goat => {
                    if (!goat.hasAttribute('data-selected')) return

                    const selectedImage = goat.querySelector('img')
                    const selectedTooltip = goat.querySelector('.circle')
                    const selectedCircle = goat.querySelector('.tooltip')

                    gsap.to(selectedImage, { x: 0 })
                    gsap.to(selectedTooltip, { y: 0, backgroundColor: '' })
                    gsap.to(selectedCircle, { x: 0, y: 0 })

                    goat.removeAttribute('data-selected')
                })

                item.setAttribute('data-selected', '')

                gsap.to(img, { x: 10 })
                gsap.to(circle, { y: 10, backgroundColor: '#fff' })
                gsap.to(tooltip, { x: 10, y: 10 })
            })
        })

        selectGoat.addEventListener('click', () => {
            if (selectGoat.disabled) return

            document.querySelectorAll('.goat').forEach((goat, index) => {
                const tooltip = goat.querySelector('.tooltip')

                // Selected goat
                if (goat.hasAttribute('data-selected')) {
                    if (instance.data.characters[index].tells_the_truth) {
                        tooltip.innerHTML = instance.data.correct_character_message

                        goat.style.pointerEvents = 'none'
                        selectGoat.disabled = true
                        document.querySelector('.cta').style.display = 'flex'

                        instance.audio.playSound('correct')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160
                        })
                    }
                    else {
                        tooltip.innerHTML = instance.data.wrong_character_message

                        selectGoat.innerText = _s.miniGames.tryAgain
                        selectGoat.addEventListener('click', () => {
                            instance.destroy()
                            instance.toggleGame()
                        })
                    }
                }
                else {
                    tooltip?.remove()
                    gsap.to(goat, { filter: 'grayscale(0.5)', pointerEvents: 'none' })
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
    }
}