import * as THREE from 'three'
import Experience from "../Experience.js"
import _STATE from '../Utils/AudioStates.js'
import _e from '../Utils/Events.js'

let audio = null

export default class Audio {
    constructor() {
        // Singleton
        if (audio)
            return audio

        audio = this
        audio.experience = new Experience()

        audio.taskDescriptionAudios = []
        audio.bgMusicAudios = {
            state: _STATE.UNDEFINED,
            otherAudioIsPlaying: false,
            default: 'sounds/bg-music.mp3',
            objs: {}
        }

        audio.notes = []

        audio.btn = document.querySelector('[aria-label="Background music"')
        audio.btn.addEventListener('click', audio.togglePlayBgMusic)

        audio.initialize()
    }

    initialize() {
        if (!audio.listener) {
            audio.listener = new THREE.AudioListener()
            audio.audioLoader = new THREE.AudioLoader()
        }
    }

    changeBgMusic(soundtrack = audio.bgMusicAudios.default) {
        if (!audio.experience.settings.soundOn) return

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

            audio.bgMusicAudios.state = _STATE.PLAYING
            audio.bgMusicAudios.objs[soundtrack] = new THREE.Audio(audio.listener)
            audio.bgMusicAudios.objs[soundtrack].setLoop(true)
            audio.bgMusicAudios.objs[soundtrack].setVolume(0)
            audio.bgMusicAudios.objs[soundtrack].pause()

            audio.audioLoader.load(soundtrack, function (buffer) {
                audio.bgMusicAudios.objs[soundtrack].setBuffer(buffer)
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
                audio.bgMusic.getVolume() + 0.025
            )

            if (audio.bgMusic.getVolume() > 0.25) {
                clearInterval(fadeInAudio)
                audio.enableToggleBtn()
            }
        }, 100)
    }

    fadeOutBgMusic(callback = () => {}) {
        if (!audio.bgMusic) return

        const fadeOutAudio = setInterval(() => {
            audio.bgMusic.setVolume(
                audio.bgMusic.getVolume() - 0.025
            )

            if (audio.bgMusic.getVolume() < 0.025) {
                clearInterval(fadeOutAudio)
                audio.enableToggleBtn()
                audio.bgMusic.setVolume(0)
                audio.bgMusic.pause()
                callback()
            }
        }, 100)
    }

    setSoundIconOn() {
        audio.btn.setAttribute('is-playing', '')
    }
    setSoundIconOff() {
        audio.btn.removeAttribute('is-playing')
    }

    disableToggleBtn() {
        audio.btn.classList.add('pointer-events-none')
    }
    enableToggleBtn() {
        audio.btn.classList.remove('pointer-events-none')
    }

    notFetchedYet(soundtrack) {
        return !audio.bgMusicAudios.objs[soundtrack]
    }

    togglePlayTaskDescription(url) {
        // Stop other task descriptions (Dialogue task)
        for (let url in audio.taskDescriptionAudios) {
            audio.stopTaskDescription(url)
        }

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

    playSound(sound) {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio[sound]) {
            audio.audioLoader.load('sounds/' + sound + '.mp3', function (buffer) {
                audio[sound] = new THREE.Audio(audio.listener)
                audio[sound].setBuffer(buffer)
                audio[sound].setVolume(0.25)
                audio[sound].play()
            })
        }
        else if (audio[sound].isPlaying) {
            audio[sound].stop()
            audio[sound].play()
        }
        else {
            audio[sound].play()
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