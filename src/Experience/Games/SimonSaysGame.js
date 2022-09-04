import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'

let instance = null

export default class SimonSays {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.audio = this.world.audio
        this.debug = this.experience.debug

        instance = this
    }

    toggleSimonSays() {
        this.audio.pauseBgMusic()
        this.init()
        this.addEventListeners()
        this.startGame()
    }

    init() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "simon-says")
        gameWrapper.classList.add('miniGame')
        document.body.appendChild(gameWrapper)

        const gameContainer = document.createElement('div')
        gameContainer.setAttribute("id", "miniGame__simon-says")

        const gameContainerBox = document.createElement('div')
        gameContainerBox.classList.add('frame')
        const gameWatch = document.createElement('div')
        gameWatch.classList.add('watch')
        const gameWatchCenter = document.createElement('div')
        gameWatchCenter.classList.add('watch-center')
        const gameWatchTicker = document.createElement('div')
        gameWatchTicker.classList.add('watch-ticker')

        const cables = document.createElement('div')
        cables.classList.add('watch-cables')

        const heading = document.createElement('span')
        heading.classList.add('watch-heading')
        heading.innerText = _s.miniGames.yourTurn

        const gameWatchTickerLeft = document.createElement('div')
        gameWatchTickerLeft.classList.add('column', 'watch-ticker--left')
        const gameWatchTickerRight = document.createElement('div')
        gameWatchTickerRight.classList.add('column', 'watch-ticker--right',)


        gameWatchTicker.appendChild(gameWatchTickerLeft)
        gameWatchTicker.appendChild(gameWatchTickerRight)

        const tickersLength = 8
        for (let i = 0; i < tickersLength; i++) {
            const ticker = document.createElement('div')
            ticker.classList.add('watch-tick')
            ticker.setAttribute('data-item', i)

            const cable = document.createElement('div')
            cable.classList.add('cable')
            cable.setAttribute('data-item', i)

            cables.appendChild(cable)

            if (i < 4) {
                gameWatchTickerLeft.appendChild(ticker)
            } else {
                gameWatchTickerRight.appendChild(ticker)
            }
        }


        gameWatch.appendChild(gameWatchCenter)
        gameContainerBox.appendChild(heading)
        gameContainerBox.appendChild(cables)
        gameContainerBox.appendChild(gameWatchTicker)
        gameContainerBox.appendChild(gameWatch)
        gameContainer.appendChild(gameContainerBox)
        gameWrapper.appendChild(gameContainer)

        const title = document.createElement('div')
        title.classList.add('heading')
        title.innerHTML = "<h2>" + _s.miniGames.simonSays + "</h2>"

        const actions = document.createElement('div')
        actions.classList.add('miniGame__actions')

        gameWrapper.appendChild(title)
        gameWrapper.appendChild(actions)

        this.data = {
            color: {
                name: [
                    'lightBlue',
                    'yellow',
                    'pink',
                    'purple'
                ],
                hex: [
                    "#2c90cf",
                    "#f9c662",
                    "#ff6ea9",
                    "#af4eaa"
                ]
            },
            melody: [],
            notes: [
                'e-4',
                'f-sharp-4',
                'g-sharp-4',
                'a-4'
            ],
            max: 2
        }

        this.audio.loadMelodyNotes(this.data.notes)

        this.data.color.hex.forEach((color, index) => {
            const noteColor = document.createElement('div')
            noteColor.dataset.id = index
            noteColor.style.backgroundColor = color
            noteColor.classList.add('note')
            gameWatch.appendChild(noteColor)
        })

        actions.appendChild(
            this.addButton('button__back', 'button__default', _s.journey.back)
        )
        actions.appendChild(
            this.addButton('button__reset', 'button__default', _s.miniGames.reset)
        )

        if (instance.debug.active) {
            actions.appendChild(
                this.addButton('button__skip', 'button__default', _s.miniGames.skip)
            )
        }

        document.body.classList.add('freeze')
    }

    startGame() {
        instance.level = 0
        instance.playMelody()
    }

    playMelody() {
        instance.blockPlaying()

        instance.currentPad = 0
        instance.userMelody = 0

        setTimeout(() => {
            setTimeout(() => {
                instance.data.melody.push(Math.floor(Math.random() * 4))
                instance.playPad(instance.data.melody[instance.currentPad])
            }, 250)

            document.addEventListener(_e.ACTIONS.NOTE_PLAYED, instance.continueMelody)
        }, 1000)
    }

    continueMelody() {
        if (++instance.currentPad <= instance.level) {
            setTimeout(() => {
                instance.playPad(instance.data.melody[instance.currentPad])
            }, 250)
        }
        else {
            document.removeEventListener(_e.ACTIONS.NOTE_PLAYED, instance.continueMelody)
            instance.allowPlaying()
        }
    }

    playPad(pad) {
        const note = instance.data.notes[pad]
        instance.audio.playNote(note)
        instance.lightenPad(pad)
    }

    lightenPad(i) {
        const note = document.querySelector("[data-id='" + i + "']")
        note.classList.add('lighten')

        setTimeout(() => {
            note.classList.remove('lighten')
        }, 500)
    }

    checkMelody(i) {
        if (i == instance.data.melody[instance.userMelody]) {
            if (instance.userMelody++ == instance.level) {
                instance.roundTick()

                if (instance.allNotesPlayed()) {
                    return setTimeout(() => {
                        instance.finishGame()
                    }, 1000)
                }

                instance.level++
                instance.playMelody()
            }
        }
        else {
            setTimeout(() => {
                instance.wrongNote()
            }, 1000)
        }
    }

    addEventListeners() {
        document.querySelectorAll("#simon-says .note").forEach((note) => {
            note.addEventListener("click", () => {
                if (!instance.canPlay()) return

                const i = note.dataset.id
                instance.playPad(i)
                instance.checkMelody(i)
            })
        })

        const buttons = document.querySelectorAll('.miniGame .button')
        buttons.forEach(button => {
            if (button.classList.contains('button__back')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                })
            }

            if (button.classList.contains('button__reset')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.toggleSimonSays()
                })
            }

            if (button.classList.contains('button__skip')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.world.program.advance()
                })
            }
        })

        window.addEventListener('keydown', instance.keyEvents)
    }

    keyEvents(event) {
        if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4' || event.key === '5') {
            document.querySelector('#miniGame__simon-says .note[data-id="' + (parseInt(event.key) - 1).toString() + '"]').dispatchEvent(new Event('click'));
        }
    }

    addButton(name, background, label) {
        const button = document.createElement('div')
        button.className = "button " + background + ' ' + name
        button.innerHTML = "<span>" + label + "</span>"

        return button
    }

    roundTick() {
        const round = document.querySelectorAll('.watch-tick')
        round[instance.level].className += " done"
    }

    wrongNote() {
        instance.toggleTryAgain()

        document.getElementById('try-again').addEventListener('click', () => {
            instance.modal.destroy()
            instance.destroy()
            instance.toggleSimonSays()
        })
    }

    toggleTryAgain() {
        instance.blockPlaying()

        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title">
                    <h1>${_s.miniGames.failed.title}</h1>
                </div>
                <div class="congrats__chapter-completed">${_s.miniGames.failed.message}</div>
                <div id="try-again" class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.reset}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
    }

    finishGame() {
        instance.toggleGameComplete()
        instance.audio.playTaskCompleted()

        document.getElementById('play-another').addEventListener('click', () => {
            instance.destroy()
            instance.modal.destroy()
            instance.toggleSimonSays()
        })
        document.getElementById('continue-journey').addEventListener('click', () => {
            instance.destroy()
            instance.modal.destroy()
            instance.world.program.advance()
            this.audio.playBgMusic()
        })
    }

    toggleGameComplete() {
        instance.blockPlaying()

        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title">
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                    <h1>${_s.miniGames.completed.title}</h1>
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                </div>
                <div class="congrats__chapter-completed">${_s.miniGames.completed.message}</div>
                <div id="play-another" class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.playAgain}</span></div>
                </div>
                <div id="continue-journey" class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.continue}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
    }

    allNotesPlayed() {
        return instance.level + 1 == instance.data.max
    }

    canPlay() {
        return document.getElementById('miniGame__simon-says').classList.contains('active')
    }
    allowPlaying() {
        document.getElementById('miniGame__simon-says').classList.add('active')
    }
    blockPlaying() {
        document.getElementById('miniGame__simon-says').classList.remove('active')
    }

    destroy() {
        window.removeEventListener('keydown', instance.keyEvents)
        document.getElementById('simon-says').remove()
        document.body.classList.remove('freeze')
    }
}