import * as THREE from 'three'
import Experience from "../Experience.js"
import _STATE from '../Utils/AudioStates.js'
import _e from '../Utils/Events.js'

let audio = null

export default class Audio {
    constructor() {
        this.experience = new Experience()
        audio = this

        audio.taskDescriptionAudios = []
        audio.bgMusicAudios = {
            state: _STATE.UNDEFINED,
            otherAudioIsPlaying: false,
            default: 'sounds/bg-music.mp3',
            objs: {}
        }

        audio.notes = []

        audio.onBTN = document.getElementById("sound-on")
        audio.offBTN = document.getElementById("sound-off")

        audio.onBTN.style.display = "none"

        audio.onBTN.addEventListener("click", audio.togglePlayBgMusic)
        audio.offBTN.addEventListener("click", audio.togglePlayBgMusic)

    }

    initialize() {
        if (!audio.listener) {
            audio.listener = new THREE.AudioListener()
            audio.audioLoader = new THREE.AudioLoader()
        }
    }

    changeBgMusic(soundtrack = audio.bgMusicAudios.default) {
        if (!audio.experience.settings.soundOn) return
        audio.initialize()

        if (audio.bgMusicAudios.state == _STATE.UNDEFINED) {
            audio.loadAndPlay(soundtrack)
        }
        else if (audio.bgMusicAudios.state == _STATE.PLAYING) {
            audio.fadeOutBgMusic(() => {
                audio.loadAndPlay(soundtrack)
            })
        }
        else {
            audio.loadBgMusic(soundtrack)
        }
    }

    togglePlayBgMusic() {
        if (!audio.experience.settings.soundOn) return

        audio.initialize()
        audio.disableToggleBtn()

        if (audio.bgMusicAudios.state == _STATE.UNDEFINED) {
            audio.loadAndPlay(audio.bgMusicAudios.default)
        }
        else {
            if (audio.bgMusicAudios.state == _STATE.PLAYING) {
                audio.bgMusicAudios.state = _STATE.PAUSED
                audio.pauseBgMusic()
            }
            else if (audio.bgMusicAudios.state == _STATE.PAUSED) {
                audio.bgMusicAudios.state = _STATE.PLAYING
                audio.playBgMusic()
            }
        }
    }

    loadAndPlay(soundtrack) {
        audio.loadBgMusic(
            soundtrack,
            audio.playBgMusic
        )
    }

    loadBgMusic(soundtrack = audio.bgMusicAudios.default, callback = () => { }) {
        if (audio.notFetchedYet(soundtrack)) {
            audio.disableToggleBtn()

            audio.audioLoader.load(soundtrack, function (buffer) {
                audio.bgMusicAudios.state = _STATE.PLAYING
                audio.bgMusicAudios.objs[soundtrack] = new THREE.Audio(audio.listener)
                audio.bgMusicAudios.objs[soundtrack].setBuffer(buffer)
                audio.bgMusicAudios.objs[soundtrack].setLoop(true)
                audio.bgMusicAudios.objs[soundtrack].setVolume(0)

                audio.bgMusic = audio.bgMusicAudios.objs[soundtrack]
                audio.enableToggleBtn()

                callback()
            })
        }
        else {
            audio.bgMusic = audio.bgMusicAudios.objs[soundtrack]
            callback()
        }
    }

    playBgMusic() {
        audio.fadeInBgMusic()
        audio.setSoundIconOn()
    }

    pauseBgMusic() {
        audio.fadeOutBgMusic()
        audio.setSoundIconOff()
    }

    setOtherAudioIsPlaying(value) {
        audio.bgMusicAudios.otherAudioIsPlaying = value
    }

    fadeInBgMusic() {
        if (!audio.bgMusic) return
        if (audio.bgMusicAudios.otherAudioIsPlaying) return
        if (audio.bgMusicAudios.state != _STATE.PLAYING) return

        audio.bgMusic.play()

        const fadeInAudio = setInterval(() => {
            audio.bgMusic.setVolume(
                audio.bgMusic.getVolume() + 0.05
            )

            if (audio.bgMusic.getVolume() > 0.5) {
                clearInterval(fadeInAudio)
                audio.enableToggleBtn()
            }
        }, 100)
    }

    fadeOutBgMusic(callback = () => { }) {
        if (!audio.bgMusic) return

        const fadeOutAudio = setInterval(() => {
            audio.bgMusic.setVolume(
                audio.bgMusic.getVolume() - 0.1
            )

            if (audio.bgMusic.getVolume() < 0.1) {
                clearInterval(fadeOutAudio)
                audio.enableToggleBtn()
                audio.bgMusic.setVolume(0)
                audio.bgMusic.pause()
                callback()
            }
        }, 100)
    }

    setSoundIconOn() {
        audio.onBTN.style.display = 'inline-block'
        audio.offBTN.style.display = 'none'
        // audio.el.classList.add('sound-on')
    }
    setSoundIconOff() {
        audio.offBTN.style.display = 'inline-block'
        audio.onBTN.style.display = 'none'
        // audio.el.classList.remove('sound-on')
    }

    disableToggleBtn() {
        // audio.el.classList.add('pointer-events-none')
    }
    enableToggleBtn() {
        // audio.el.classList.remove('pointer-events-none')
    }

    notFetchedYet(soundtrack) {
        return !audio.bgMusicAudios.objs[soundtrack]
    }

    togglePlayTaskDescription(url) {
        audio.initialize()

        if (!audio.taskDescriptionAudios.hasOwnProperty(url)) {
            audio.audioLoader.load(url, function (buffer) {
                audio.taskDescriptionAudios[url] = new THREE.Audio(audio.listener)
                audio.taskDescriptionAudios[url].onEnded = () => {
                    document.dispatchEvent(_e.EVENTS.AUDIO_TASK_DESCRIPTION_ENDED)
                    audio.stopTaskDescription(url)
                }
                audio.taskDescriptionAudios[url].setBuffer(buffer)
                audio.playTaskDescription(url)
            })
        }
        else if (audio.taskDescriptionAudios[url].isPlaying) {
            audio.stopTaskDescription(url)
        }
        else {
            audio.playTaskDescription(url)
        }
    }

    playTaskDescription(url) {
        audio.taskDescriptionAudios[url].play()
        audio.setOtherAudioIsPlaying(true)
        audio.fadeOutBgMusic()
    }

    stopTaskDescription(url) {
        if (audio.taskDescriptionAudios.hasOwnProperty(url))
            audio.taskDescriptionAudios[url].stop()

        audio.setOtherAudioIsPlaying(false)
        audio.fadeInBgMusic()
    }

    playWhoosh() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()
        if (!audio.whoosh) {
            audio.audioLoader.load('sounds/whoosh-between-screens.mp3', function (buffer) {
                audio.whoosh = new THREE.Audio(audio.listener)
                audio.whoosh.setBuffer(buffer)
                audio.whoosh.setVolume(0.5)
                audio.whoosh.play()
            })
        }
        else if (audio.whoosh.isPlaying) {
            audio.whoosh.stop()
            audio.whoosh.play()
        }
        else {
            audio.whoosh.play()
        }
    }

    playCorrectSound() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.correctSound) {
            audio.audioLoader.load('sounds/correct.mp3', function (buffer) {
                audio.correctSound = new THREE.Audio(audio.listener)
                audio.correctSound.setBuffer(buffer)
                audio.correctSound.setVolume(0.5)
                audio.correctSound.play()
            })
        }
        else if (audio.correctSound.isPlaying) {
            audio.correctSound.stop()
            audio.correctSound.play()
        }
        else {
            audio.correctSound.play()
        }
    }

    playWrongSound() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.wrongSound) {
            audio.audioLoader.load('sounds/wrong.mp3', function (buffer) {
                audio.wrongSound = new THREE.Audio(audio.listener)
                audio.wrongSound.setBuffer(buffer)
                audio.wrongSound.setVolume(0.5)
                audio.wrongSound.play()
            })
        }
        else if (audio.wrongSound.isPlaying) {
            audio.wrongSound.stop()
            audio.wrongSound.play()
        }
        else {
            audio.wrongSound.play()
        }
    }

    playTaskCompleted() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.taskCompletedSound) {
            audio.audioLoader.load('sounds/task-completed.mp3', function (buffer) {
                audio.taskCompletedSound = new THREE.Audio(audio.listener)
                audio.taskCompletedSound.setBuffer(buffer)
                audio.taskCompletedSound.setVolume(0.5)
                audio.taskCompletedSound.play()
            })
        }
        else if (audio.taskCompletedSound.isPlaying) {
            audio.taskCompletedSound.stop()
            audio.taskCompletedSound.play()
        }
        else {
            audio.taskCompletedSound.play()
        }
    }

    playCongratsSound() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.congratsSound) {
            audio.audioLoader.load('sounds/congrats.mp3', function (buffer) {
                audio.congratsSound = new THREE.Audio(audio.listener)
                audio.congratsSound.setBuffer(buffer)
                audio.congratsSound.setVolume(0.5)
                audio.congratsSound.play()
            })
        }
        else if (audio.congratsSound.isPlaying) {
            audio.congratsSound.stop()
            audio.congratsSound.play()
        }
        else {
            audio.congratsSound.play()
        }
    }

    loadMelodyNotes(notes) {
        this.initialize()

        notes.forEach(note => {
            if (!audio.notes[note]) {
                audio.audioLoader.load('sounds/notes/' + note + '.mp3', function (buffer) {
                    audio.notes[note] = new THREE.Audio(audio.listener)
                    audio.notes[note].setBuffer(buffer)
                    audio.notes[note].onEnded = () => document.dispatchEvent(_e.EVENTS.NOTE_PLAYED)
                })
            }
        })
    }

    playNote(note) {
        this.initialize()

        if (!audio.notes[note]) return

        if (audio.notes[note].isPlaying) {
            audio.notes[note].stop()
            audio.notes[note].play()
        }
        else {
            audio.notes[note].play()
        }
    }
}