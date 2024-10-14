import Experience from '../Experience.js'
import { Howl, Howler } from 'howler'
import _STATE from '../Utils/AudioStates.js'
import _e from '../Utils/Events.js'
import _s from '../Utils/Strings.js'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/shift-away.css'

let audio = null

export default class Audio {
    constructor() {
        // Singleton
        if (audio) return audio

        audio = this
        audio.experience = new Experience()

        audio.taskDescriptionAudios = []
        audio.bgMusicAudios = {
            state: _STATE.UNDEFINED,
            otherAudioIsPlaying: false,
            default: './sounds/bg-music.mp3',
            objs: {},
        }

        audio.notes = []
        audio.btn = document.querySelector('#toggle-music')
        audio.musicRange = 50
        audio.fadeSteps = 15
        audio.slideValueConversion = 3.33
        audio.bgMusicVolume = () => audio.musicRange / audio.slideValueConversion / 100 // audio volume value should be [0, 1]

        audio.initialize()

        tippy(audio.btn, {
            theme: 'explorers',
            content: _s.settings.backgroundMusic,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })
    }

    initialize() {
        audio.addEventListeners()
    }

    changeBgMusic(soundtrack = audio.bgMusicAudios.default) {
        if (!audio.experience.settings.soundOn) return

        if (audio.bgMusicAudios.state == _STATE.UNDEFINED) {
            audio.loadAndPlay(soundtrack)
        } else if (audio.bgMusicAudios.state == _STATE.PLAYING) {
            if (audio.alreadyFetched(soundtrack) && audio.bgMusicAudios.objs[soundtrack].playing()) return

            audio.fadeOutBgMusic(() => {
                audio.loadAndPlay(soundtrack)
            })
        } else {
            audio.loadBgMusic(soundtrack)
        }
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
            audio.bgMusic.volume(audio.bgMusic.volume() + audio.bgMusicVolume() / audio.fadeSteps)

            if (audio.bgMusic.volume() > audio.bgMusicVolume()) {
                clearInterval(fadeInAudio)
                audio.enableToggleBtn()
            }
        }, 10)
    }

    fadeOutBgMusic(callback = () => {}) {
        if (!audio.bgMusic) return

        const fadeOutAudio = setInterval(() => {
            audio.bgMusic.volume(audio.bgMusic.volume() - audio.bgMusicVolume() / audio.fadeSteps)

            if (audio.bgMusic.volume() < audio.bgMusicVolume() / audio.fadeSteps) {
                clearInterval(fadeOutAudio)
                audio.enableToggleBtn()
                audio.bgMusic.volume(0)
                audio.bgMusic.pause()
                callback()
            }
        }, 10)
    }

    togglePlayTaskDescription(url) {
        if (!audio.taskDescriptionAudios.hasOwnProperty(url)) {
            audio.taskDescriptionAudios[url] = new Howl({
                src: [url],
                onload: function () {
                    audio.playTaskDescription(url)
                },
                onend: function () {
                    document.dispatchEvent(_e.EVENTS.AUDIO_TASK_DESCRIPTION_ENDED)
                    audio.stopTaskDescription(url)
                },
            })
        } else if (audio.taskDescriptionAudios[url].playing()) {
            audio.stopTaskDescription(url)
        } else {
            audio.playTaskDescription(url)
        }
    }

    stopAllTaskDescriptions() {
        // Stop other task descriptions
        for (let url in audio.taskDescriptionAudios) audio.stopTaskDescription(url)
    }

    playSound(sound) {
        if (!audio.experience.settings.soundOn) return

        if (!audio[sound]) {
            audio[sound] = new Howl({
                src: ['sounds/' + sound + '.mp3'],
                volume: 0.25,
                onload: function () {
                    audio.playSound(sound)
                },
            })
        } else if (audio[sound].playing()) {
            audio[sound].stop()
            audio[sound].play()
        } else {
            audio[sound].play()
        }
    }

    stopSound(sound) {
        if (!audio.experience.settings.soundOn) return
        if (!audio[sound]) return
        if (!audio[sound].playing()) return

        audio[sound].stop()
    }

    loadMelodyNotes(notes) {
        notes.forEach((note) => {
            if (!audio.notes[note]) {
                audio.notes[note] = new Howl({
                    src: ['sounds/notes/' + note + '.mp3'],
                    onend: function () {
                        document.dispatchEvent(_e.EVENTS.NOTE_PLAYED)
                    },
                })
            }
        })
    }

    playNote(note) {
        if (!audio.notes[note]) return

        if (audio.notes[note].playing()) {
            audio.notes[note].stop()
            audio.notes[note].play()
        } else {
            audio.notes[note].play()
        }
    }

    loadBgMusic(soundtrack = audio.bgMusicAudios.default, callback = () => {}) {
        if (!audio.alreadyFetched(soundtrack)) {
            audio.disableToggleBtn()

            audio.bgMusicAudios.state = _STATE.PLAYING
            audio.bgMusicAudios.objs[soundtrack] = new Howl({
                src: [soundtrack],
                volume: 0,
                loop: true,
                onload: function () {
                    audio.enableToggleBtn()

                    // Another bg music has started in the meantime (while loading this audio) so simply return
                    if (audio.bgMusic && audio.bgMusic.playing()) return

                    audio.bgMusic = audio.bgMusicAudios.objs[soundtrack]
                    callback()
                },
                onend: function () {
                    document.dispatchEvent(_e.EVENTS.NOTE_PLAYED)
                },
            })
        } else {
            audio.bgMusic = audio.bgMusicAudios.objs[soundtrack]
            callback()
        }
    }

    // Private functions

    togglePlayBgMusic() {
        if (!audio.experience.settings.soundOn) return

        audio.disableToggleBtn()

        if (audio.bgMusicAudios.state == _STATE.UNDEFINED) {
            audio.loadAndPlay(audio.bgMusicAudios.default)
        } else {
            if (audio.bgMusicAudios.state == _STATE.PLAYING) {
                audio.bgMusicAudios.state = _STATE.PAUSED
                audio.pauseBgMusic()
            } else if (audio.bgMusicAudios.state == _STATE.PAUSED) {
                audio.bgMusicAudios.state = _STATE.PLAYING
                audio.playBgMusic()
            }
        }
    }

    loadAndPlay(soundtrack) {
        audio.loadBgMusic(soundtrack, audio.playBgMusic)
    }

    playBgMusic() {
        audio.fadeInBgMusic()
        audio.setSoundIconOn()
    }
    pauseBgMusic() {
        audio.fadeOutBgMusic()
        audio.setSoundIconOff()
    }

    setSoundIconOn() {
        audio.btn.classList.add('is-playing')
    }
    setSoundIconOff() {
        audio.btn.classList.remove('is-playing')
    }

    disableToggleBtn() {
        audio.btn.classList.add('pointer-events-none')
    }
    enableToggleBtn() {
        audio.btn.classList.remove('pointer-events-none')
    }

    alreadyFetched(soundtrack) {
        return audio.bgMusicAudios.objs[soundtrack]
    }

    playTaskDescription(url) {
        audio.taskDescriptionAudios[url].play()
        audio.setOtherAudioIsPlaying(true)
        audio.fadeOutBgMusic()
    }

    stopTaskDescription(url) {
        if (audio.taskDescriptionAudios.hasOwnProperty(url)) audio.taskDescriptionAudios[url].stop()

        audio.setOtherAudioIsPlaying(false)
        audio.fadeInBgMusic()
    }

    loadPianoTiles() {
        if (!audio.pianoTiles) {
            audio.pianoTiles = new Howl({
                src: ['games/piano-tiles/BIEX_Vignett_m_tverrflute.mp3'],
                onload: function () {
                    document.dispatchEvent(_e.EVENTS.SONG_LOADED)
                },
                onend: function () {
                    document.dispatchEvent(_e.EVENTS.SONG_ENDED)
                },
            })
        } else {
            document.dispatchEvent(_e.EVENTS.SONG_LOADED)
        }
    }

    addEventListeners() {
        audio.btn.addEventListener('click', audio.togglePlayBgMusic)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, audio.stopAllTaskDescriptions)
    }
}
