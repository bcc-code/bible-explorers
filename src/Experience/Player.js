import * as THREE from 'three'

let player = null

export default class Player {
    constructor() {
        player = this

        player.listener = new THREE.AudioListener();
        player.audioLoader = new THREE.AudioLoader();

        player.el = document.querySelector(".sound");
        player.el.addEventListener("click", player.toggleBgMusic);
    }

    toggleBgMusic() {
        if (!player.bgMusic) {
            player.audioLoader.load('sounds/background-instrumental-music.mp3', function(buffer) {
                player.bgMusic = new THREE.Audio( player.listener );
                player.bgMusic.setBuffer( buffer );
                player.bgMusic.setLoop( true );
                player.bgMusic.setVolume( 0.5 );
                player.bgMusic.play();
            });
        }
        else if (player.bgMusic.isPlaying) {
            player.bgMusic.pause();
        }
        else {
            player.bgMusic.play();
        }
    }

    playCodeUnlockedSound() {
        if (!player.codeUnlockedSound) {
            player.audioLoader.load('sounds/item-collected-sound.mp3', function(buffer) {
                player.codeUnlockedSound = new THREE.Audio( player.listener );
                player.codeUnlockedSound.setBuffer( buffer );
                player.codeUnlockedSound.play();
            });
        }
        else if (player.codeUnlockedSound.isPlaying) {
            player.codeUnlockedSound.pause();
        }
        else {
            player.codeUnlockedSound.play();
        }
    }
}