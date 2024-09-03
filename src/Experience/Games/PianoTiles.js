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

        this.ageCategory = this.world.selectedChapter.category
        this.score = 0
        this.speedMultiplier = this.ageCategory === '9-11' ? 1 : 1.25
        this.timeBeforeSongStart = 4750
        this.speed = 240
        this.transitionTime = 2000
        this.notesIndex = 0
        this.playableNotes = []

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
                length: 0.75,
            },
            {
                tone: 0,
                length: 0.75,
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
        this.getSpeed = () => this.speed * 2 * this.speedMultiplier

        document.addEventListener(_e.ACTIONS.SONG_LOADED, instance.songLoaded)
        document.addEventListener(_e.ACTIONS.SONG_ENDED, instance.songEnded)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        this.audio.loadPianoTiles()
    }

    songLoaded() {
        instance.gameHTML()
        instance.startRound()

        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()

        instance.restart.onclick = () => {
            instance.resultBox.classList.remove('visible')
            instance.sco.innerText = 0
            instance.audio.pianoTiles.stop()
            instance.startRound()
        }
    }

    gameHTML() {
        const game = _gl.elementFromHtml(`
            <section class="task-game piano-tiles" id="piano-tiles">
                <div class="absolute inset-0 grid place-content-center bg-black/60" id="piano-tites__background">
                    <video src="games/piano-tiles/flute_tiles_BG.mp4" class="h-screen object-cover" muted autoplay loop></video>
                </div>

                <div class="piano-tiles_progress-bar">
                    <div class="points-achieved">
                        <progress max="${instance.notes.length * 0.75}" value="0"></progress>
                        <ul>
                            <li data-checkpoint="1">
                                <div class="progress-bullet"></div>
                                <svg viewBox="0 0 29 29">
                                    <use href="#star-solid"></use>
                                </svg>
                            </li>
                            <li data-checkpoint="2">
                                <div class="progress-bullet"></div>
                                <svg viewBox="0 0 29 29">
                                    <use href="#star-solid"></use>
                                </svg>
                            </li>
                            <li data-checkpoint="3">
                                <div class="progress-bullet"></div>
                                <svg viewBox="0 0 29 29">
                                    <use href="#star-solid"></use>
                                </svg>
                            </li>
                        </ul>
                    </div>
                </div>

                <div id="piano-tiles_game" class="task-game_content">
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
                        <div id="piano-tiles_safe-area"></div>
                    </div>
                        <div id="piano-tiles_play-boxes">
                        <div class="play-box" id="play-box1"></div>
                        <div class="play-box" id="play-box2"></div>
                        <div class="play-box" id="play-box3"></div>
                    </div>
                </div>
                    
                <div class="task-game_popup result-box">
                    <div class="score_text text-2xl">You've scored 0 points</div>
                    <div class="buttons">
                        <button class="piano-tiles_restart button button-rectangle-wide"></button>
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
        this.progressBar = game.querySelector('.piano-tiles_progress-bar')
        this.safeArea = game.querySelector('#piano-tiles_safe-area')

        document.onkeydown = (e) => {
            const playedNote = instance.expectedNote(e.key)
            let playBox = document.getElementById('play-box' + (playedNote + 1))
            if (!playBox) return

            playBox.classList.add('clicked')
            setTimeout(() => {
                playBox.classList.remove('clicked')
            }, 150)

            // Get clickable note
            const playableNoteIdx = instance.playableNotes.findIndex((pn) => pn.tone == playedNote)
            if (playableNoteIdx == -1) return

                       const toneToPlay = instance.playableNotes[playableNoteIdx].tone

            if (
                (e.key === 'ArrowLeft' && toneToPlay == 0) ||
                (e.key === 'ArrowUp' && toneToPlay == 1) ||
                (e.key === 'ArrowRight' && toneToPlay == 2)
            ) {
                const toneIndex = instance.playableNotes[playableNoteIdx].index
                const clickableTone = document.querySelector('.note[data-index="' + toneIndex + '"]')
                if (!clickableTone) return

                const safeAreaRect = instance.safeArea.getBoundingClientRect();
                const noteRect = clickableTone.getBoundingClientRect()
    
                if (noteRect.bottom >= safeAreaRect.top && noteRect.bottom <= safeAreaRect.bottom) {
                    // Valid hit within the safe area!
                    console.log('hit safe area');
                    
                  } else {
                    // Invalid hit - outside the safe area
                    console.log('outside safe area');
                  }

                clickableTone.classList.remove('clickable')
                clickableTone.classList.add('clicked')
                clickableTone.onkeydown = null
                instance.playableNotes.splice(playableNoteIdx, 1)

                setTimeout(
                    (clickableTone) => {
                        clickableTone.classList.remove('clicked')
                        clickableTone.classList.add('fade-out')
                    },
                    150,
                    clickableTone
                )

                instance.increaseScore()
                instance.updateProgressBar()

                // Add awesome label
                var awesomeLabel = document.createElement('div')
                awesomeLabel.classList.add('awesome-label')
                awesomeLabel.setAttribute('data-tone', toneToPlay)

                if (instance.lastCorrectNoteIndex && toneIndex - 1 == instance.lastCorrectNoteIndex) {
                    instance.streak++
                    awesomeLabel.classList.add('combo')
                    awesomeLabel.setAttribute('data-streak', instance.streak)
                } else {
                    instance.streak = 1
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
        instance.progressBar.style.display = 'block'
        instance.score = 0
        instance.notesIndex = 0
        instance.lastCorrectNoteIndex = null
        instance.streak = 0
        instance.updateProgressBar()

        document.getElementById('tile-box1').innerHTML = ''
        document.getElementById('tile-box2').innerHTML = ''
        document.getElementById('tile-box3').innerHTML = ''
        instance.playedNotes.innerHTML = ''

        setTimeout(() => {
            instance.audio.pianoTiles.playbackRate = 1 - (instance.speedMultiplier - 1) / 1.75
            instance.audio.pianoTiles.play()
        }, 1000)

        instance.addNoteTimeout = setTimeout(
            instance.addNote,
            instance.timeBeforeSongStart * instance.speedMultiplier
        )
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

        // Make note clickable
        setTimeout(
            (note) => {
                instance.playableNotes.push({
                    tone: note.getAttribute('data-tone'),
                    index: note.getAttribute('data-index'),
                })
                note.classList.add('clickable')
            },
            instance.transitionTime * 0.45,
            note
        )

        // Remove clickable class from unplayed note
        setTimeout(
            (note) => {
                const playableNoteIdx = instance.playableNotes.findIndex(
                    (pn) => pn.tone == note.getAttribute('data-tone')
                )
                if (playableNoteIdx != -1) {
                    instance.playableNotes.splice(playableNoteIdx, 1)
                }
                note.classList.remove('clickable')
            },
            instance.transitionTime * 0.6,
            note
        )

        // Fade out unplayed note
        setTimeout(
            (note) => {
                note.classList.add('fade-out')
            },
            instance.transitionTime * 0.65,
            note
        )

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

    updateProgressBar() {
        instance.progressBar.querySelector('progress').value = instance.score

        if (instance.score >= 25) {
            instance.getProgressBarCheckpoint(1).classList.add('filled')
            instance.getProgressBarCheckpoint(2).classList.add('filled')
            instance.getProgressBarCheckpoint(3).classList.add('filled')
        } else if (instance.score >= 15) {
            instance.getProgressBarCheckpoint(1).classList.add('filled')
            instance.getProgressBarCheckpoint(2).classList.add('filled')
        } else if (instance.score >= 5) {
            instance.getProgressBarCheckpoint(1).classList.add('filled')
        } else {
            instance.getProgressBarCheckpoint(1).classList.remove('filled')
            instance.getProgressBarCheckpoint(2).classList.remove('filled')
            instance.getProgressBarCheckpoint(3).classList.remove('filled')
        }
    }

    getProgressBarCheckpoint(index) {
        return instance.progressBar.querySelector('li[data-checkpoint="' + index + '"]')
    }

    songEnded() {
        instance.audio.pianoTiles.stop()
        setTimeout(instance.showScore, 1500)

        const clickableTone = document.querySelector('.note.clickable')
        if (!clickableTone) return

        clickableTone.classList.remove('clickable')
        clickableTone.onkeydown = null
    }

    showScore() {
        instance.game.style.display = 'none'
        instance.progressBar.style.display = 'none'
        instance.resultBox.classList.add('visible')

        if (instance.score / instance.notes.length > 0.83) {
            instance.text.innerText =
                "Good job! You've scored " + instance.score + '/' + instance.notes.length + ' points'
            instance.restart.innerText = 'Another round'
        } else {
            instance.text.innerText =
                "Oops! You've only scored " + instance.score + '/' + instance.notes.length + ' points'
            instance.restart.innerText = 'Try again'
        }
    }

    expectedNote(key) {
        if (key === 'ArrowLeft') {
            return 0
        } else if (key === 'ArrowUp') {
            return 1
        } else if (key === 'ArrowRight') {
            return 2
        }
    }

    destroy() {
        clearTimeout(instance.addNoteTimeout)
        instance.audio.pianoTiles.stop()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()

        document.querySelector('.piano-tiles')?.remove()
        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.SONG_LOADED, instance.songLoaded)
        document.removeEventListener(_e.ACTIONS.SONG_ENDED, instance.songEnded)
        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
