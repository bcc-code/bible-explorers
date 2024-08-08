import Experience from '../Experience.js'
import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class PianoTiles {
    constructor() {
        instance = this

        this.experience = new Experience()
        this.world = this.experience.world
    }

    toggleGame() {
        this.audio = this.world.audio
        this.audio.loadPianoTiles()

        this.ageCategory = this.world.selectedChapter.category
        this.score = 0
        this.speedMultiplier = this.ageCategory === '9-11' ? 1 : 1.25
        this.speed = 400
        this.transitionTime = 2000
        this.notesIndex = 0
        this.addNotesInterval

        this.notes = [
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 2,
                length: 0.5,
            },
            {
                tone: 2,
                length: 0.5,
            },
            {
                tone: 1,
                length: 4,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 2,
                length: 0.5,
            },
            {
                tone: 2,
                length: 4,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 2,
                length: 0.5,
            },
            {
                tone: 1,
                length: 0.5,
            },
            {
                tone: 0,
                length: 4,
            },
            {
                tone: 1,
                length: 0.5,
            },
            {
                tone: 2,
                length: 1,
            },
            {
                tone: 1,
                length: 0.5,
            },
            {
                tone: 0,
                length: 1,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 2,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 0,
                length: 1,
            },
            {
                tone: 0,
                length: 1,
            },
            {
                tone: 1,
                length: 3,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1.5,
            },
            {
                tone: 0,
                length: 0.5,
            },
            {
                tone: 1,
                length: 1.5,
            },
            {
                tone: 1,
                length: 1,
            },
            {
                tone: 2,
                length: 4,
            },
        ]

        this.getCurrentTone = () => this.notes[this.notesIndex]?.tone
        this.getCurrentLength = () => this.notes[this.notesIndex]?.length
        this.getSpeed = () => this.speed * this.speedMultiplier

        this.gameHTML()
        this.startRound()

        this.audio.setOtherAudioIsPlaying(true)
        this.audio.fadeOutBgMusic()

        instance.restart.onclick = () => {
            instance.resultBox.classList.remove('visible')
            instance.sco.innerText = 0
            instance.audio.pianoTiles.stop()
            instance.startRound()
        }

        document.addEventListener(_e.ACTIONS.SONG_ENDED, instance.songEnded)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    gameHTML() {
        const game = _gl.elementFromHtml(`
            <section class="task-game piano-tiles" id="piano-tiles">
                <div class="absolute inset-0 grid place-content-center bg-black/60" id="piano-tites__background">
                    <video src="games/piano-tiles/flute_tiles_BG.mp4" class="h-screen object-cover" muted autoplay loop></video>
                </div>
                <div class="task-game_content">
                    <div id="piano-tiles_game">
                        <div class="piano-tiles_score">
                            <p id="piano-tiles_score">0</p>
                        </div>

                        <div id="piano-tiles__wrapper">
                            <div id="piano-tiles_game-container">
                                <div class="tile-box" id="tile-box1"></div>
                                <div class="tile-box" id="tile-box2"></div>
                                <div class="tile-box" id="tile-box3"></div>
                            </div>

                            <div id="piano-tiles_flute"></div>
                            <div id="piano-tiles_played-notes"></div>

                            <div id="piano-tiles_play-boxes">
                                <div class="play-box" id="play-box1"></div>
                                <div class="play-box" id="play-box2"></div>
                                <div class="play-box" id="play-box3"></div>
                            </div>
                        </div>
                    </div>
                </div>
                    
                <div class="task-game_popup result-box">
                    <div class="icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div class="score_text">You've scored 0 points</div>
                    <div class="buttons">
                        <button class="piano-tiles_restart">Play again</button>
                    </div>
            </section>`)

        instance.experience.interface.gameContainer.append(game)
        instance.experience.setAppView('game')

        this.game = game.querySelector('#piano-tiles_game')
        this.sco = game.querySelector('#piano-tiles_score')
        this.resultBox = game.querySelector('.result-box')
        this.restart = this.resultBox.querySelector('.piano-tiles_restart')
        this.text = this.resultBox.querySelector('.score_text')
        this.playedNotes = game.querySelector('#piano-tiles_played-notes')

        document.onkeydown = (e) => {
            let playBox

            if (e.key === 'ArrowLeft') {
                playBox = document.getElementById('play-box1')
            }

            if (e.key === 'ArrowUp') {
                playBox = document.getElementById('play-box2')
            }

            if (e.key === 'ArrowRight') {
                playBox = document.getElementById('play-box3')
            }

            if (!playBox) return

            playBox.classList.add('clicked')
            setTimeout(() => {
                playBox.classList.remove('clicked')
            }, 150)

            // Get clickable note
            const clickableTone = document.querySelector('.note.clickable')
            if (!clickableTone) return

            const toneToPlay = clickableTone.getAttribute('data-tone')

            if (
                (e.key === 'ArrowLeft' && toneToPlay == 0) ||
                (e.key === 'ArrowUp' && toneToPlay == 1) ||
                (e.key === 'ArrowRight' && toneToPlay == 2)
            ) {
                clickableTone.style.opacity = 0.3
                clickableTone.classList.remove('clickable')
                clickableTone.onkeydown = null

                instance.increaseScore()

                // Add played note icon
                var noteIcon = document.createElement('div')
                const rndNote = Math.floor(Math.random() * 4) + 1

                noteIcon.classList.add('note-icon')
                noteIcon.setAttribute('data-tone', rndNote)

                instance.playedNotes.append(noteIcon)

                setTimeout(
                    (noteIcon) => {
                        noteIcon.classList.add('move-right', 'disappear')
                    },
                    100,
                    noteIcon
                )
            }
        }
    }

    startRound() {
        instance.game.style.display = 'block'
        instance.score = 0
        instance.notesIndex = 0

        document.getElementById('tile-box1').innerHTML = ''
        document.getElementById('tile-box2').innerHTML = ''
        document.getElementById('tile-box3').innerHTML = ''
        instance.playedNotes.innerHTML = ''

        setTimeout(() => {
            instance.audio.pianoTiles.playbackRate = 1 - (instance.speedMultiplier - 1) / 1.75
            instance.audio.pianoTiles.play()
        }, 1000)

        setTimeout(() => {
            instance.addNote()
            instance.createNotesInterval()
        }, 7800 * instance.speedMultiplier)
    }

    createNotesInterval() {
        instance.addNotesInterval = setInterval(
            instance.addNote,
            instance.getSpeed() * instance.getCurrentLength()
        )
    }

    addNote() {
        if (instance.notesIndex >= instance.notes.length) {
            clearInterval(instance.addNotesInterval)
            return
        }

        var note = document.createElement('div')
        note.classList.add('note')
        note.setAttribute('data-tone', instance.getCurrentTone())
        note.setAttribute('data-index', instance.notesIndex)
        note.setAttribute('data-length', instance.getCurrentLength())
        document.getElementById('tile-box' + (instance.getCurrentTone() + 1)).append(note)

        setTimeout(
            (note) => {
                note.classList.add('move-down')
                clearInterval(instance.addNotesInterval)
                instance.createNotesInterval()
            },
            100,
            note
        )

        setTimeout(
            (note) => {
                document.querySelector('.note.clickable')?.classList.remove('clickable')
                note.classList.add('clickable')
            },
            (instance.transitionTime - instance.getSpeed() * instance.getCurrentLength()) * 0.65,
            note
        )

        note.onclick = () => {
            if (!note.classList.contains('clickable')) return

            note.style.opacity = 0.3
            note.style.pointerEvents = 'none'
            note.classList.remove('clickable')
            note.onkeydown = null

            instance.increaseScore()
        }

        instance.notesIndex++
    }

    getMargin() {
        return 33.33 * instance.getCurrentTone()
    }

    increaseScore() {
        instance.score++
        instance.sco.innerText = instance.score
    }

    songEnded() {
        instance.audio.pianoTiles.stop()
        clearInterval(instance.addNotesInterval)
        setTimeout(instance.showScore, 1500)

        const clickableTone = document.querySelector('.note.clickable')
        if (!clickableTone) return

        clickableTone.classList.remove('clickable')
        clickableTone.onkeydown = null
    }

    showScore() {
        instance.game.style.display = 'none'
        instance.resultBox.classList.add('visible')
        instance.text.innerText = "You've scored " + instance.score + '/' + instance.notes.length + ' points'
    }

    destroy() {
        clearInterval(instance.addNotesInterval)
        instance.audio.pianoTiles.stop()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()

        document.querySelector('.piano-tiles')?.remove()
        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
