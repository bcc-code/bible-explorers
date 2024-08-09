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
        this.speed = 240
        this.transitionTime = 2000
        this.notesIndex = 0
        this.addNotesInterval

        this.notes = [
            {
                tone: 1,
                length: 3,
            },
            {
                tone: 2,
                length: 3,
                break: 2,
            },
            {
                tone: 1,
                length: 1.5,
            },
            {
                tone: 1,
                length: 1.5,
            },
            {
                tone: 2,
                length: 4,
                break: 1,
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
                length: 1,
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
                length: 0.5,
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
                tone: 1,
                length: 1,
            },
            {
                tone: 1,
                length: 0.5,
            },
            {
                tone: 2,
                length: 4,
            },
        ]

        this.getCurrentTone = () => this.notes[this.notesIndex]?.tone
        this.getCurrentLength = () => this.notes[this.notesIndex]?.length
        this.getBreak = () => this.notes[this.notesIndex]?.break ?? 0
        this.getSpeed = () => this.speed * this.speedMultiplier * 2

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

                            <div id="piano-tiles_labels"></div>
                            <div id="piano-tiles_flute"></div>
                            <div id="piano-tiles_played-notes"></div>
                        </div>

                         <div id="piano-tiles_play-boxes">
                            <div class="play-box" id="play-box1"></div>
                            <div class="play-box" id="play-box2"></div>
                            <div class="play-box" id="play-box3"></div>
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
        this.labels = game.querySelector('#piano-tiles_labels')
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
                clickableTone.classList.remove('clickable')
                clickableTone.classList.add('clicked')
                clickableTone.onkeydown = null

                setTimeout(
                    (clickableTone) => {
                        clickableTone.classList.remove('clicked')
                        clickableTone.classList.add('fade-out')
                    },
                    150,
                    clickableTone
                )

                instance.increaseScore()

                // Add awesome label
                var awesomeLabel = document.createElement('div')
                awesomeLabel.classList.add('awesome-label')
                awesomeLabel.setAttribute('data-tone', toneToPlay)

                const toneIndex = clickableTone.getAttribute('data-index')
                if (instance.lastCorrectNoteIndex && toneIndex - 1 == instance.lastCorrectNoteIndex) {
                    awesomeLabel.classList.add('combo')
                }

                const existingLabel = document.querySelector('.awesome-label')
                if (existingLabel) existingLabel.remove()

                instance.labels.append(awesomeLabel)

                // Update note index
                instance.lastCorrectNoteIndex = toneIndex

                setTimeout(
                    (awesomeLabel) => {
                        awesomeLabel.remove()
                    },
                    750,
                    awesomeLabel
                )

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
        instance.lastCorrectNoteIndex = null

        document.getElementById('tile-box1').innerHTML = ''
        document.getElementById('tile-box2').innerHTML = ''
        document.getElementById('tile-box3').innerHTML = ''
        instance.playedNotes.innerHTML = ''

        setTimeout(() => {
            instance.audio.pianoTiles.playbackRate = 1 - (instance.speedMultiplier - 1) / 1.75
            instance.audio.pianoTiles.play()
        }, 1000)

        const timeBeforeSongStart = 7750
        setTimeout(() => {
            instance.addNote()
        }, timeBeforeSongStart * instance.speedMultiplier)
    }

    addNote() {
        var note = document.createElement('div')
        note.classList.add('note')
        note.setAttribute('data-tone', instance.getCurrentTone())
        note.setAttribute('data-index', instance.notesIndex)
        note.setAttribute('data-length', instance.getCurrentLength())
        document.getElementById('tile-box' + (instance.getCurrentTone() + 1)).append(note)

        setTimeout(
            (note) => {
                note.classList.add('move-down')
            },
            100,
            note
        )

        setTimeout(
            (note) => {
                document.querySelector('.note.clickable')?.classList.remove('clickable')
                note.classList.add('clickable')
            },
            instance.transitionTime / 2,
            note
        )

        setTimeout((note) => {}, instance.transitionTime, note)

        const noteLength = instance.getSpeed() * instance.getCurrentLength()
        const breakAfterNote = instance.getSpeed() * instance.getBreak()

        instance.notesIndex++

        if (instance.notesIndex < instance.notes.length) {
            setTimeout(instance.addNote, noteLength + breakAfterNote)
        }
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
