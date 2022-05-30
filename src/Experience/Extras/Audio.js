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
            audio.audioLoader.load('sounds/background-instrumental-music.mp3', function(buffer) {
                audio.bgMusic = new THREE.Audio(audio.listener)
                audio.bgMusic.setBuffer(buffer)
                audio.bgMusic.setLoop(true)
                audio.bgMusic.setVolume(0.5)
                audio.bgMusic.play()
                audio.el.classList.add('sound-on')
            })
        }
        else if (audio.bgMusic.isPlaying) {
            audio.bgMusic.pause()
            audio.el.classList.remove('sound-on')
        }
        else {
            audio.bgMusic.play()
            audio.el.classList.add('sound-on')
        }
    }

    playBgMusic() {
        if (!audio.experience.settings.soundOn) return
        audio.initialize()

        if (!audio.bgMusic) {
            audio.audioLoader.load('sounds/background-instrumental-music.mp3', function(buffer) {
                audio.bgMusic = new THREE.Audio(audio.listener)
                audio.bgMusic.setBuffer(buffer)
                audio.bgMusic.setLoop(true)
                audio.bgMusic.setVolume(0.5)
                audio.bgMusic.play()
                audio.el.classList.add('sound-on')
            })
        }
        else if (!audio.bgMusic.isPlaying) {
            audio.bgMusic.play()
            audio.el.classList.add('sound-on')
        }
    }

    addBgMusicElement() {
        audio.el.style.display = 'flex'
    }

    removeBgMusicElement() {
        if (audio.bgMusic) audio.bgMusic.pause()
        audio.el.style.display = 'none'
    }

    playCodeUnlockedSound() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.codeUnlockedSound) {
            audio.audioLoader.load('sounds/item-collected-sound.mp3', function(buffer) {
                audio.codeUnlockedSound = new THREE.Audio(audio.listener)
                audio.codeUnlockedSound.setBuffer(buffer)
                audio.codeUnlockedSound.play()
            })
        }
        else if (audio.codeUnlockedSound.isPlaying) {
            audio.codeUnlockedSound.stop()
            audio.codeUnlockedSound.play()
        }
        else {
            audio.codeUnlockedSound.play()
        }
    }

    playCorrectSound() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.correctSound) {
            audio.audioLoader.load('sounds/correct.mp3', function(buffer) {
                audio.correctSound = new THREE.Audio(audio.listener)
                audio.correctSound.setBuffer(buffer)
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
            audio.audioLoader.load('sounds/wrong.mp3', function(buffer) {
                audio.wrongSound = new THREE.Audio(audio.listener)
                audio.wrongSound.setBuffer(buffer)
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

    playWhoosh() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.whoosh) {
            audio.audioLoader.load('sounds/whoosh-between-screens.mp3', function(buffer) {
                audio.whoosh = new THREE.Audio(audio.listener)
                audio.whoosh.setBuffer(buffer)
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

    playCongratsSound() {
        if (!audio.experience.settings.soundOn) return
        this.initialize()

        if (!audio.congratsSound) {
            audio.audioLoader.load('sounds/congrats.mp3', function(buffer) {
                audio.congratsSound = new THREE.Audio(audio.listener)
                audio.congratsSound.setBuffer(buffer)
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