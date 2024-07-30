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

        this.gameHTML()
        this.startRound()

        this.audio.setOtherAudioIsPlaying(true)
        this.audio.fadeOutBgMusic()

        this.ageCategory = this.world.selectedChapter.category
        this.speedMultiplier = this.ageCategory === '9-11' ? 1.5 : 1

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
                length: 2.5,
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
                tone: 0,
                length: 1,
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

        this.addNotesInterval
        this.score = 0
        this.notesIndex = 0
        this.speed = 400
        this.transitionTime = 2000

        instance.start.querySelector('button').onclick = () => {
            instance.startRound()
        }

        instance.restart.onclick = () => {
            instance.start.style.display = 'block'
            instance.resultBox.classList.remove('visible')
            instance.sco.innerText = 0
            instance.audio.pianoTiles.stop()
        }

        document.addEventListener(_e.ACTIONS.SONG_ENDED, instance.songEnded)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    gameHTML() {
        const game = _gl.elementFromHtml(`
            <section class="task-game piano-tiles" id="piano-tiles">
                <div class="task-game_content">
                    <div class="piano-tiles_start" style="display: none;"> 
                        <button>Play</button>
                    </div> 

                    <div id="piano-tiles_game">
                        <div id="piano-tiles_game-container">
                            <div class="tile-box" id="tile-box1"></div>
                            <div class="tile-box" id="tile-box2"></div>
                            <div class="tile-box" id="tile-box3"></div>
                        </div>

                        <div id="piano-tiles_play-boxes">
                            <div class="play-box" id="box1"></div>
                            <div class="play-box" id="box2"></div>
                            <div class="play-box" id="box3"></div>
                        </div>

                        <div class="piano-tiles_tiles" id="piano-tiles_tiles"></div> 
                    </div>
                    <div class="piano-tiles_score"><p id="piano-tiles_score">0</p></div>
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

        this.start = game.querySelector('.piano-tiles_start')
        this.game = game.querySelector('#piano-tiles_game')
        this.sco = game.querySelector('#piano-tiles_score')
        this.resultBox = game.querySelector('.result-box')
        this.restart = this.resultBox.querySelector('.piano-tiles_restart')
        this.text = this.resultBox.querySelector('.score_text')
    }

    startRound() {
        instance.game.style.display = 'block'
        instance.start.style.display = 'none'
        instance.score = 0
        instance.notesIndex = 0

        document.getElementById('piano-tiles_tiles').innerHTML = ''

        setTimeout(() => {
            instance.audio.pianoTiles.play()
        }, 1000)

        setTimeout(() => {
            instance.addNote()
            instance.createNotesInterval()
        }, 7000)
    }

    createNotesInterval() {
        instance.addNotesInterval = setInterval(
            instance.addNote,
            instance.speed * instance.getCurrentLength()
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
        note.style.left =
            'calc(' + instance.getMargin() + '% + ' + (2 * instance.getCurrentTone() + 2) + 'rem)'
        note.style.height = instance.getCurrentLength() * 25 + '%'

        setTimeout(
            (note) => {
                note.classList.add('move')
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
            (instance.transitionTime - instance.speed * instance.getCurrentLength()) * 0.85,
            note
        )

        note.onclick = () => {
            if (!note.classList.contains('clickable')) return

            note.style.background = 'rgba(255,255,255,0.2)'
            note.style.pointerEvents = 'none'
            note.classList.remove('clickable')
            note.onkeydown = null

            instance.increaseScore()
        }

        document.onkeydown = (e) => {
            const clickableTone = document.querySelector('.note.clickable')
            if (!clickableTone) return

            const toneToPlay = clickableTone.getAttribute('data-tone')

            if (
                (e.key === 'ArrowLeft' && toneToPlay == 0) ||
                (e.key === 'ArrowUp' && toneToPlay == 1) ||
                (e.key === 'ArrowRight' && toneToPlay == 2)
            ) {
                clickableTone.style.background = 'rgba(255,255,255,0.2)'
                clickableTone.classList.remove('clickable')
                clickableTone.onkeydown = null

                instance.increaseScore()
            } else {
            }
        }

        instance.notesIndex++
        document.getElementById('piano-tiles_tiles').append(note)
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
