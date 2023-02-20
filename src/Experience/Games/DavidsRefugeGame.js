import gsap from 'gsap'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'

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
        instance.hintsHTML()
        instance.eventListeners()
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
                    <div class="tooltip">${goat.text}</div>
                    <img src="${goat.image}"/>
                </article>
            `)

            game.querySelector('.goats').append(item)

        })



    }

    hintsHTML() {
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

        if (instance.data.hints.length) {
            document.querySelector('.davids-refuge .container').append(hintsToggle, hints)

            const hintsList = hints.querySelector('ul')

            gsap.set(hints, { scale: 0, autoAlpha: 0, transformOrigin: 'top left' })

            const showHints = gsap.timeline({ paused: true })
                .to(hints, { scale: 1, autoAlpha: 1 })

            hintsToggle.addEventListener('click', () => {
                if (hints.style.opacity === '0') {
                    showHints.play()
                } else {
                    showHints.reverse()
                }
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

                if (++index == instance.data.hints.length) {
                    getHint.remove()
                }
            })

        }

    }

    eventListeners() {

        // Goat selection
        const selectGoat = document.querySelector('[aria-label="select goat"]')

        gsap.utils.toArray('.goat').forEach(item => {
            const q = gsap.utils.selector(item)
            const img = q('img')
            const circle = q('.circle')
            const tooltip = q('.tooltip')

            gsap.set(tooltip, { autoAlpha: 0 })

            item.addEventListener('click', () => {
                selectGoat.disabled = false
                gsap.to(tooltip, { autoAlpha: 1 })

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
                    tooltip.style.width = '330px'

                    if (instance.data.characters[index].tells_the_truth) {
                        tooltip.innerHTML = `<span style="white-space: normal">${instance.data.correct_character_message}</span>`
                        tooltip.style.top = '-7rem'

                        instance.toggleMessage()
                        selectGoat.disabled = true
                        document.querySelector('.cta').style.display = 'flex'
                    }
                    else {
                        tooltip.innerHTML = `<span style="white-space: normal">${instance.data.wrong_character_message}</span>`

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

        instance.experience.navigation.next.addEventListener('click', instance.destroy)
        instance.experience.navigation.prev.addEventListener('click', instance.destroy)

    }

    toggleQuestion() {
        const overlay = document.createElement('div')
        overlay.setAttribute('id', 'overlay')

        const message = this.messageModal(instance.data.start_message)
        document.body.append(overlay, message)

        gsap.to('#dialogue', { y: 0, autoAlpha: 1 })
    }

    toggleMessage() {
        const notification = _gl.elementFromHtml(`
            <aside class="game-notification">
                <p>${instance.data.end_message}</p>
            </aside>
        `)

        document.querySelector('.davids-refuge .container').append(notification)
        gsap.fromTo(notification, { x: '100%' }, { x: 0 })
    }

    destroy() {
        document.querySelector('.game')?.remove()
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
    }

}