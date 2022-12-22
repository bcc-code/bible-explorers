import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'

let instance = null
const showSkipAfterNoOfTries = 3
const explorersOne = {
    noOfRounds: 6,
    msBetweenNotes: 250
}
const explorersTwo = {
    noOfRounds: 8,
    msBetweenNotes: 150
}
export default class SimonSays {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.audio = this.world.audio
        this.debug = this.experience.debug

        instance = this
        instance.fails = 0

        instance.data = {
            color: {
                name: [
                    'pink',
                    'yellow',
                    'green',
                    'lightBlue'
                ],
                hex: [
                    "#ff6ea9",
                    "#f9c662",
                    "#67BD53",
                    "#2c90cf"
                ]
            },
            melody: [],
            notes: [
                'e-4',
                'f-sharp-4',
                'g-sharp-4',
                'a-4'
            ],
            rounds: instance.world.selectedChapter.category == '6-8' ? explorersOne.noOfRounds : explorersTwo.noOfRounds,
            msBetweenNotes: instance.world.selectedChapter.category == '6-8' ? explorersOne.msBetweenNotes : explorersTwo.msBetweenNotes
        }
    }

    toggleSimonSays() {
        this.toggleInit()
        this.startGame()

        this.audio.setOtherAudioIsPlaying(true)
        this.audio.fadeOutBgMusic()
    }

    toggleInit() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            const gameWrapper = document.createElement('div')
            gameWrapper.classList.add('model__content', 'simon-says')

            const gameContent = document.createElement('div')
            gameContent.setAttribute("id", "miniGame__simon-says")

            const gameContentBox = document.createElement('div')
            gameContentBox.classList.add('frame')
            const gameWatch = document.createElement('div')
            gameWatch.classList.add('watch')
            const gameWatchCenter = document.createElement('div')
            gameWatchCenter.classList.add('watch-center')
            const gameWatchMiddle = document.createElement('div')
            gameWatchMiddle.classList.add('watch-middle')
            const gameWatchTicker = document.createElement('div')
            gameWatchTicker.classList.add('watch-ticker')

            const cables = document.createElement('div')
            cables.classList.add('watch-cables')

            const gameWatchTickerLeft = document.createElement('div')
            gameWatchTickerLeft.classList.add('column', 'watch-ticker--left')
            const gameWatchTickerRight = document.createElement('div')
            gameWatchTickerRight.classList.add('column', 'watch-ticker--right')

            gameWatchTicker.append(gameWatchTickerLeft)
            gameWatchTicker.append(gameWatchTickerRight)

            for (let i = 0; i < instance.data.rounds; i++) {
                const ticker = document.createElement('div')
                ticker.classList.add('watch-tick')
                ticker.setAttribute('data-item', i)

                const cable = document.createElement('div')
                cable.classList.add('cable')
                cable.setAttribute('data-item', i)

                cables.append(cable)

                i < 4
                    ? gameWatchTickerLeft.append(ticker)
                    : gameWatchTickerRight.append(ticker)
            }

            gameWatch.appendChild(gameWatchCenter)
            gameWatchMiddle.appendChild(cables)
            gameWatchMiddle.appendChild(gameWatchTicker)
            gameContentBox.appendChild(gameWatchMiddle)
            gameContentBox.appendChild(gameWatch)
            gameContent.appendChild(gameContentBox)
            gameWrapper.appendChild(gameContent)

            instance.audio.loadMelodyNotes(instance.data.notes)

            instance.data.color.hex.forEach((color, index) => {
                const noteColor = document.createElement('div')
                noteColor.dataset.id = index
                noteColor.style.backgroundColor = color
                noteColor.classList.add('note')
                gameWatch.appendChild(noteColor)
            })

            instance.modal = new Modal(gameWrapper.outerHTML, 'modal__simon-says')


            const title = document.querySelector('.modal__heading--minigame')
            title.innerHTML = `<h3>${_s.miniGames.simonSays}</h3>`

            // Add event listeners

            document.querySelectorAll(".simon-says .note").forEach((note) => {
                note.addEventListener("click", () => {
                    if (!instance.canPlay()) return

                    const i = note.dataset.id
                    instance.playPad(i)
                    instance.checkMelody(i)
                })
            })

            const back = document.getElementById('back')
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', () => {
                instance.modal.destroy()
                instance.world.program.previousStep()
            })

            const restart = document.getElementById('restart')
            restart.style.display = 'block'
            restart.innerText = _s.miniGames.reset
            restart.addEventListener('click', () => {
                instance.modal.destroy()
                instance.toggleSimonSays()
            })

            const skip = document.getElementById("skip")
            skip.innerText = _s.miniGames.skip
            skip.style.display = instance.debug.developer || instance.debug.onQuickLook()
                ? 'block'
                : 'none'

            skip.addEventListener('click', instance.advanceToNextStep)
        }
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
            }, instance.data.msBetweenNotes)
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
        if (!note) return

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

    roundTick() {
        const round = document.querySelectorAll('.watch-tick')
        round[instance.level].className += " done"
    }

    wrongNote() {
        const existingModal = document.querySelectorAll('.modal__content')
        if (existingModal.length) return

        instance.toggleTryAgain()
    }

    toggleTryAgain() {
        instance.toggleInit()
        instance.blockPlaying()

        let html = `<div class="modal__content congrats congrats__miniGame simon-says">
            <div class="congrats__container">
                <div class="congrats__title">
                    <h2>${_s.miniGames.failed.title}</h2>
                </div>
                <div class="congrats__chapter-completed">${_s.miniGames.failed.message}</div>
            </div>
        </div>`

        instance.modal = new Modal(html, 'modal__congrats')

        // Add event listeners

        const restart = document.getElementById('restart')
        restart.style.display = 'block'
        restart.innerText = _s.miniGames.reset
        restart.addEventListener('click', () => {
            instance.fails++
            instance.modal.destroy()
            instance.toggleSimonSays()
        })

        const skip = document.getElementById("skip")
        skip.innerText = _s.miniGames.skip
        skip.style.display = instance.debug.developer || instance.debug.onQuickLook() || instance.fails >= showSkipAfterNoOfTries - 1
            ? 'block'
            : 'none'

        skip.addEventListener('click', instance.advanceToNextStep)
    }

    finishGame() {
        instance.fails = 0
        instance.modal.destroy()
        instance.audio.playTaskCompleted()
        instance.toggleGameComplete()
    }

    toggleGameComplete() {
        instance.blockPlaying()

        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title">
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                    <h2>${_s.miniGames.completed.title}</h2>
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html, 'modal__congrats')

        const next = document.getElementById('continue')
        next.style.display = 'block'
        next.innerText = _s.miniGames.continue
        next.addEventListener('click', instance.advanceToNextStep)

        const restart = document.getElementById('restart')
        restart.style.display = 'block'
        restart.innerText = _s.miniGames.playAgain
        restart.addEventListener('click', () => {
            instance.modal.destroy()
            instance.toggleSimonSays()
        })
    }

    advanceToNextStep() {
        instance.fails = 0
        instance.modal.destroy()
        instance.world.program.nextStep()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()
    }

    allNotesPlayed() {
        return instance.level + 1 == instance.data.rounds
    }

    canPlay() {
        const miniGame = document.getElementById('miniGame__simon-says')
        if (!miniGame) return false

        return miniGame.classList.contains('active')
    }

    allowPlaying() {
        const miniGame = document.getElementById('miniGame__simon-says')
        if (!miniGame) return

        miniGame.classList.add('active')
    }

    blockPlaying() {
        const miniGame = document.getElementById('miniGame__simon-says')
        if (!miniGame) return

        miniGame.classList.remove('active')
    }
}