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
        instance.nrOfPlays = 0
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
                    'darkBlue',
                    'lightBlue',
                    'yellow',
                    'pink',
                    'purple'
                ],
                hex: [
                    "#373e93",
                    "#2c90cf",
                    "#f9c662",
                    "#ff6ea9",
                    "#af4eaa"
                ]
            },
            melodies: [
                [ 0, 1, 2, 3, 4 ], // Scale up
                [ 4, 3, 2, 1, 0 ], // Scale down
                [ 2, 2, 2, 2, 2, 2, 1, 0, 4, 4, 1, 1, 1, 1, 4, 4, 4, 3, 2], // Fryd, fryd, fryd
                [ 2, 4, 2, 4, 2, 4, 2, 0, 1, 3, 1, 3, 2, 1, 0, 2, 4, 2, 4, 2, 4, 2, 0, 1, 3, 1, 3, 2, 1, 0 ], // In padurea cu alune
                [ 0, 0, 1, 2, 0, 1, 1, 2, 0, 0, 0, 1, 2, 0, 1, 1, 2, 0, 4, 4, 3, 2, 0, 1, 1, 0, 2, 4, 4, 3, 2, 0, 1, 1, 2, 1 ] // Podul de piatra
            ],
            notes: [
                'e-4',
                'f-sharp-4',
                'g-sharp-4',
                'a-4',
                'b-4'
            ]
        }

        this.audio.loadMelodyNotes(this.data.notes)

        this.data.color.hex.forEach((color, index) => {
            const noteColor = document.createElement('div')
            noteColor.dataset.id = index
            noteColor.style.backgroundColor = color
            noteColor.classList.add('note')
            gameContainer.appendChild(noteColor)
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
                instance.playPad(instance.data.melodies[instance.nrOfPlays][instance.currentPad])
            }, 250)

            document.addEventListener(_e.ACTIONS.NOTE_PLAYED, instance.continueMelody)
        }, 1000)
    }

    continueMelody() {
        if (++instance.currentPad <= instance.level) {
            setTimeout(() => {
                instance.playPad(instance.data.melodies[instance.nrOfPlays][instance.currentPad])
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
        if (i == instance.data.melodies[instance.nrOfPlays][instance.userMelody]) {
            if (instance.userMelody++ == instance.level) {
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

            instance.nrOfPlays++
            instance.toggleSimonSays()
        })
        document.getElementById('continue-journey').addEventListener('click', () => {
            instance.destroy()
            instance.modal.destroy()
            instance.program.advance()
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
                    <div class="button__content"><span>${_s.miniGames.playAnother}</span></div>
                </div>
                <div id="continue-journey" class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.continue}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
        
        if (instance.allMelodiesPlayed()) {
            document.getElementById('play-another').style.display = 'none'
        }
    }

    allMelodiesPlayed() {
        return instance.nrOfPlays + 1 == instance.data.melodies.length
    }

    allNotesPlayed() {
        return instance.level + 1 == instance.data.melodies[instance.nrOfPlays].length;
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