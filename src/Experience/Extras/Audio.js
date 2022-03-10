import * as THREE from 'three'
import Experience from "../Experience.js"

let audio = null

export default class Audio {
    constructor() {
        this.experience = new Experience()
        audio = this

        audio.listener = new THREE.AudioListener()
        audio.audioLoader = new THREE.AudioLoader()

        audio.el = document.querySelector("#sound")
        audio.el.addEventListener("mousedown", audio.toggleBgMusic)
    }

    toggleBgMusic() {
        if (!audio.bgMusic) {
            audio.audioLoader.load('sounds/background-instrumental-music.mp3', function(buffer) {
                audio.bgMusic = new THREE.Audio(audio.listener)
                audio.bgMusic.setBuffer(buffer)
                audio.bgMusic.setLoop(true)
                audio.bgMusic.setVolume(0.5)
                audio.bgMusic.play()
            })
        }
        else if (audio.bgMusic.isPlaying) {
            audio.bgMusic.pause()
        }
        else {
            audio.bgMusic.play()
        }
    }

    removeBgMusicElement() {
        if (audio.bgMusic) audio.bgMusic.pause()
        audio.el.remove()
    }

    playCodeUnlockedSound() {
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

    playIris(sound) {
        if (!audio[sound]) {
            audio.audioLoader.load('sounds/'+sound+'.mp3', function(buffer) {
                audio[sound] = new THREE.Audio(audio.listener)
                audio[sound].setBuffer(buffer)
                audio[sound].play()
                audio.onEndedEvent(sound)
            });
        }
        else if (audio[sound].isPlaying) {
            audio[sound].pause()
            audio.experience.world.program.updateIrisTexture('READY')
        }
        else {
            audio[sound].play()
            audio.experience.world.program.updateIrisTexture('SPEAK')
            audio.onEndedEvent(sound)
        }
    }

    onEndedEvent(sound) {
        audio[sound].source.onended = function() {
            audio[sound].stop()
            audio.experience.world.program.updateIrisTexture('READY')
            audio.experience.world.program.advance()
        }
    }
}