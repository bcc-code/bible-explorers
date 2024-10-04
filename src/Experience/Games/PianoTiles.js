import Experience from '../Experience.js'
import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'
import _s from '../Utils/Strings.js'
import gsap from 'gsap'

let instance = null

const TIME_BEFORE_SONG_START = 4560 // Time before the song starts (milliseconds)
const TRANSITION_DURATION = 2000 // Time for transitions between notes (milliseconds)
const BPM = 122 // Beats per minute
const BEATS_PER_BAR = 4 // Beats in a musical measure

export default class PianoTiles {
    constructor() {
        instance = this

        this.experience = new Experience()
        this.world = this.experience.world
    }

    toggleGame() {
        this.audio = this.world.audio
        this.ageCategory = this.world.selectedChapter.category

        this.speed = BPM * BEATS_PER_BAR

        this.score = 0
        this.notesIndex = 0
        this.playableNotes = []

        this.notes = [
            {
                tone: 1,
                length: 4,
            },
            {
                tone: 2,
                length: 4,
            },
            {
                tone: 1,
                length: 4,
            },
            {
                tone: 2,
                length: 4,
            },
            {
                tone: 1,
                length: 2,
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
                tone: 0,
                length: 3,
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
                length: 0.75,
            },
            {
                tone: 0,
                length: 0.75,
            },
            {
                tone: 2,
                length: 7,
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
            instance.game.parentElement.classList.remove('show-score')
            instance.sco.innerText = 0
            instance.audio.pianoTiles.stop()
            instance.startRound()
        }
    }

    gameHTML() {
        const game = _gl.elementFromHtml(`
            <section class="task-game piano-tiles" id="piano-tiles">
                <div class="absolute inset-0 grid place-content-center bg-black/60" id="piano-tites__background">
                    <video src="games/piano-tiles/defaultBG_v02.mp4" class="h-screen object-cover" muted autoplay loop></video>
                </div>

                <div class="piano-tiles_progress-bar">
                    <div class="points-achieved">
                        <progress max="${instance.notes.length * 0.8077}" value="0"></progress>
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
                        <div id="piano-tiles_flute">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1068 67.17">
                                <defs>
                                    <linearGradient id="a" x1="13.67" x2="1060.37" y1="34.09" y2="34.09" gradientUnits="userSpaceOnUse">
                                        <stop offset="0" stop-color="#331833"/>
                                        <stop offset="1" stop-color="#331833"/>
                                    </linearGradient>
                                    <linearGradient id="b" x1="11.17" x2="1062.87" y1="34.09" y2="34.09" gradientUnits="userSpaceOnUse">
                                        <stop offset="0" stop-color="#f47b4d"/>
                                        <stop offset="1" stop-color="#fbbb4b"/>
                                    </linearGradient>
                                    <linearGradient xlink:href="#b" id="l" x1="366.02" x2="418.63" y1="33.59" y2="33.59"/>
                                    <linearGradient xlink:href="#b" id="q" x1="507.69" x2="560.31" y1="33.59" y2="33.59"/>
                                    <linearGradient xlink:href="#b" id="s" x1="655.07" x2="707.69" y1="33.59" y2="33.59"/>
                                </defs>
                                <g stroke-miterlimit="10" stroke-width="5">
                                    <circle id="note-circle-1" cx="392.33" cy="33.59" r="23.81" fill="url(#k)" stroke="url(#l)"/>
                                    <circle id="note-circle-2" cx="534" cy="33.59" r="23.81" fill="url(#p)" stroke="url(#q)"/>
                                    <circle id="note-circle-3" cx="681.38" cy="33.59" r="23.81" fill="url(#r)" stroke="url(#s)"/>
                                </g>
                            </svg>
                        </div>
                        <div id="piano-tiles_played-notes"></div>
                        <div id="piano-tiles_safe-area"></div>
                        <div id="piano-tiles_play-boxes">
                            <div class="play-box" id="play-box1"></div>
                            <div class="play-box" id="play-box2"></div>
                            <div class="play-box" id="play-box3"></div>
                        </div>
                    </div>
                </div>
                    
                <div class="task-game_popup result-box">
                    <div class="score_text text-2xl"></div>
                    <div class="buttons">
                        <button class="piano-tiles_restart button button-rectangle-wide">${_s.miniGames.anotherRound}</button>
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

            instance.animatePlayBox(playBox)

            const safeAreaRect = instance.safeArea.getBoundingClientRect()
            const clickableTones = document.querySelectorAll('.note')

            instance.playableNotes.forEach((note) => {
                const clickableTone = Array.from(clickableTones).find(
                    (tone) => tone.getAttribute('data-index') == note.index
                )
                if (!clickableTone || note.played) return

                const noteRect = clickableTone.getBoundingClientRect()
                if (noteRect.bottom < safeAreaRect.top || noteRect.top > safeAreaRect.bottom) return

                if (playedNote == note.tone) {
                    clickableTone.onkeydown = null
                    note.played = true

                    instance.lightUpCircle(playedNote + 1)

                    instance.fadeOutNoteElement(clickableTone)
                    instance.increaseScore()
                    instance.updateProgressBar()

                    var awesomeLabel = document.createElement('div')
                    awesomeLabel.classList.add('awesome-label')
                    awesomeLabel.setAttribute('data-tone', note.tone)

                    if (note.index - 1 == instance.lastCorrectNoteIndex) {
                        if (++instance.streak > 1) {
                            awesomeLabel.classList.add('combo')
                            awesomeLabel.setAttribute('data-streak', instance.streak)
                        }

                        instance.animateAwesomeLabel(awesomeLabel)
                    } else {
                        instance.streak = 0
                    }

                    const existingLabel = document.querySelector('.awesome-label')
                    if (existingLabel) existingLabel.remove()

                    instance.labels.append(awesomeLabel)
                    instance.lastCorrectNoteIndex = note.index

                    setTimeout(() => {
                        awesomeLabel.remove()
                    }, 750)

                    var noteIcon = document.createElement('div')
                    noteIcon.classList.add('note-icon')
                    const rndNote = Math.floor(Math.random() * 4) + 1 // Randomize tone
                    noteIcon.setAttribute('data-tone', rndNote)

                    // Append the note to the played-notes container
                    instance.playedNotes.append(noteIcon)

                    // Trigger the animation for the notes with GSAP
                    this.animateNoteIcon(noteIcon)
                } else {
                    instance.lightUpCircle(playedNote + 1, '#D53500')
                }
            })
        }
    }

    startRound() {
        instance.game.style.display = 'block'
        instance.score = 0
        instance.notesIndex = 0
        instance.lastCorrectNoteIndex = -1
        instance.streak = 0
        instance.updateProgressBar()

        document.getElementById('tile-box1').innerHTML = ''
        document.getElementById('tile-box2').innerHTML = ''
        document.getElementById('tile-box3').innerHTML = ''
        instance.playedNotes.innerHTML = ''

        setTimeout(() => {
            instance.audio.pianoTiles.play()
        }, 1000)

        instance.addNoteTimeout = setTimeout(instance.addNote, TIME_BEFORE_SONG_START - BPM * 2)
    }

    addNote() {
        var note = document.createElement('div')
        note.classList.add('note')
        note.setAttribute('data-tone', instance.getCurrentTone())
        note.setAttribute('data-index', instance.notesIndex)
        note.setAttribute('data-length', instance.getCurrentLength())
        document.getElementById('tile-box' + (instance.getCurrentTone() + 1)).append(note)

        instance.playableNotes.push({
            tone: note.getAttribute('data-tone'),
            index: note.getAttribute('data-index'),
        })

        setTimeout(
            (note) => {
                note.classList.add('move-down')
            },
            100,
            note
        )

        // Fade out unplayed note
        setTimeout(
            (note) => {
                note.classList.add('fade-out')
            },
            TRANSITION_DURATION * 0.75,
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
            },
            TRANSITION_DURATION,
            note
        )

        const noteLength = instance.speed * instance.getCurrentLength()

        instance.notesIndex++

        // Add next note if possible
        if (instance.notesIndex < instance.notes.length) {
            setTimeout(instance.addNote, noteLength)
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

        if ((instance.score * 100) / instance.notes.length >= 80) {
            instance.getProgressBarCheckpoint(1).classList.add('filled')
            instance.getProgressBarCheckpoint(2).classList.add('filled')
            instance.getProgressBarCheckpoint(3).classList.add('filled')
        } else if ((instance.score * 100) / instance.notes.length >= 50) {
            instance.getProgressBarCheckpoint(1).classList.add('filled')
            instance.getProgressBarCheckpoint(2).classList.add('filled')
        } else if ((instance.score * 100) / instance.notes.length >= 20) {
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
        instance.game.parentElement.classList.add('show-score')

        if (instance.score / instance.notes.length >= 0.2) {
            instance.text.innerHTML = `<h2>${_s.miniGames.winRound}</h2><p class="text-xl">${instance.score} / ${instance.notes.length}</p>`

            instance.audio.playSound('correct')
            instance.experience.celebrate({
                particleCount: 100,
                spread: 160,
            })
        } else {
            instance.audio.playSound('wrong')
            instance.text.innerHTML = `<h2>${_s.miniGames.oops}</h2><p class="text-xl">${instance.score} / ${instance.notes.length}</p>`
        }
    }

    expectedNote(key) {
        if (key === 'ArrowLeft') {
            return 0
        } else if (key === 'ArrowUp') {
            return 1
        } else if (key === 'ArrowRight') {
            return 2
        } else {
            return
        }
    }

    fadeOutNoteElement(clickableTone) {
        gsap.to(clickableTone, {
            duration: 0.5,
            scale: 1.4,
            backgroundColor: 'yellow',
            opacity: 0,
            onComplete: () => {
                clickableTone.remove()
            },
        })
    }

    animateNoteIcon(noteIcon) {
        const randomY = Math.random() * 150 - 75

        gsap.to(noteIcon, {
            duration: 1.5,
            scale: 2,
            x: 300,
            y: randomY,
            opacity: 0,
            ease: 'power2.out',
            onComplete: () => {
                noteIcon.remove()
            },
        })
    }

    lightUpCircle(noteNumber, color = '#FFD700') {
        const circle = document.getElementById(`note-circle-${noteNumber}`)

        gsap.to(circle, {
            duration: 0.15,
            fill: color,
            scale: 1.2,
            transformOrigin: '50% 50%',
            repeat: 1,
            yoyo: true,
            ease: 'power1.inOut',
        })
    }

    animatePlayBox(playBox) {
        gsap.timeline({
            defaults: {
                duration: 0.15,
                ease: 'power1.out',
            },
        })
            .to(playBox, {
                scale: 1.1,
                boxShadow: '0px 0px 15px 10px rgba(251, 192, 82, 0.2)',
                yoyo: true,
                repeat: 1,
            })
            .to(playBox, {
                scale: 1,
                boxShadow: '0px 0px 0px 0px rgba(0, 0, 0, 0)',
            })
    }

    animateAwesomeLabel(awesomeLabel) {
        gsap.to(awesomeLabel, {
            duration: 0.25,
            scale: 1.2,
            transformOrigin: '50% 50%',
            repeat: 1,
            yoyo: true,
            ease: 'power1.inOut',
        })
    }

    destroy() {
        clearTimeout(instance.addNoteTimeout)
        instance.audio.pianoTiles.stop()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()

        instance.game.parentElement?.remove()
        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.SONG_LOADED, instance.songLoaded)
        document.removeEventListener(_e.ACTIONS.SONG_ENDED, instance.songEnded)
        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
