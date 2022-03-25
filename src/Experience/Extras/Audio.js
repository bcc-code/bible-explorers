import * as THREE from 'three'
import Experience from "../Experience.js"

let audio = null

export default class Audio {
    constructor() {
        this.experience = new Experience()
        audio = this

        audio.el = document.getElementById("sound")
        audio.el.addEventListener("mousedown", audio.toggleBgMusic)
    }

    initialize() {
        if (!audio.listener) {
            audio.listener = new THREE.AudioListener()
            audio.audioLoader = new THREE.AudioLoader()
        }
    }

    toggleBgMusic() {
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

    addBgMusicElement() {
        audio.el.style.display = 'block'
    }

    removeBgMusicElement() {
        if (audio.bgMusic) audio.bgMusic.pause()
        audio.el.style.display = 'none'
    }

    playCodeUnlockedSound() {
        this.initialize()

        if (!audio.codeUnlockedSound) {
            audio.audioLoader.load('sounds/item-collected-sound.mp3', function(buffer) {
                audio.codeUnlockedSound = new THREE.Audio(audio.listener)
                audio.codeUnlockedSound.setBuffer(buffer)
                audio.codeUnlockedSound.play()
            });
        }
        else if (audio.codeUnlockedSound.isPlaying) {
            audio.codeUnlockedSound.pause()
        }
        else {
            audio.codeUnlockedSound.play()
        }
    }

    playWhoosh() {
        this.initialize()

        if (!audio.whoosh) {
            audio.audioLoader.load('sounds/whoosh-between-screens.mp3', function(buffer) {
                audio.whoosh = new THREE.Audio(audio.listener)
                audio.whoosh.setBuffer(buffer)
                audio.whoosh.play()
            });
        }
        else if (audio.whoosh.isPlaying) {
            audio.whoosh.pause()
        }
        else {
            audio.whoosh.play()
        }
    }

    playIris(sound) {
        this.initialize()

        if (!audio[sound]) {
            audio.audioLoader.load('sounds/'+sound+'.mp3', function(buffer) {
                audio[sound] = new THREE.Audio(audio.listener)
                audio[sound].setBuffer(buffer)
                audio[sound].play()
                audio.onEndedIris(sound)
            });
        }
        else if (audio[sound].isPlaying) {
            audio[sound].pause()
            audio.experience.world.program.updateIrisTexture('READY')
        }
        else {
            audio[sound].play()
            audio.experience.world.program.updateIrisTexture('SPEAK')
            audio.onEndedIris(sound)
        }
    }

    onEndedIris(sound) {
        audio[sound].source.onended = function() {
            audio[sound].stop()
            audio.experience.world.program.updateIrisTexture('READY')
            audio.experience.world.program.advance()
        }
    }
}