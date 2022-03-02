import * as THREE from 'three'

let audio = null

export default class Audio {
    constructor() {
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
}