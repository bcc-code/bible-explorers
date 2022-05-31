import * as THREE from 'three'
import Experience from "../Experience.js"

let audio = null

export default class Audio {
    constructor() {
        this.experience = new Experience()
        audio = this

        audio.el = document.getElementById("sound")
        audio.el.addEventListener("click", audio.toggleBgMusic)
    }

    initialize() {
        if (!audio.listener) {
            audio.listener = new THREE.AudioListener()
            audio.audioLoader = new THREE.AudioLoader()
        }
    }

    toggleBgMusic() {
        if (!audio.experience.settings.soundOn) return
        audio.initialize()

        if (!audio.bgMusic) {
            audio.loadBgMusic()
        }
        else if (audio.bgMusic.isPlaying) {
            audio.fadeOutBgMusic()
            audio.el.classList.remove('sound-on')
        }
        else {
            audio.fadeInBgMusic()
            audio.el.classList.add('sound-on')
        }
    }

    playBgMusic() {
        if (!audio.experience.settings.soundOn) return
        audio.initialize()

        if (!audio.bgMusic) {
            audio.loadBgMusic()
        }
        else if (!audio.bgMusic.isPlaying) {
            audio.fadeInBgMusic()
            audio.el.classList.add('sound-on')
        }
    }

    fadeInBgMusic() {
        audio.bgMusic.setVolume(0)
        audio.bgMusic.play()

        const fadeInAudio = setInterval(() => {
            const volume = audio.bgMusic.getVolume() + 0.05
            audio.bgMusic.setVolume(volume)

            if (audio.bgMusic.getVolume() > 0.5) {
                clearInterval(fadeInAudio);
            }
        }, 100);
    }

    fadeOutBgMusic() {

        const fadeOutAudio = setInterval(() => {
            const volume = audio.bgMusic.getVolume() - 0.1
            audio.bgMusic.setVolume(volume)

            if (audio.bgMusic.getVolume() < 0.1) {
                clearInterval(fadeOutAudio);
                audio.bgMusic.pause()
            }
        }, 100);
    }

    loadBgMusic() {
        audio.audioLoader.load('sounds/background-instrumental-music.mp3', function (buffer) {
            audio.bgMusic = new THREE.Audio(audio.listener)
            audio.bgMusic.setBuffer(buffer)
            audio.bgMusic.setLoop(true)
            audio.fadeInBgMusic()
            audio.el.classList.add('sound-on')
        })
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
}