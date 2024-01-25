import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _e from '../Utils/Events.js';
import _gl from '../Utils/Globals.js';

let instance = null;
const explorersOne = {
  noOfRounds: 6,
  msBetweenNotes: 250,
};
const explorersTwo = {
  noOfRounds: 8,
  msBetweenNotes: 150,
};
export default class SimonSays {
  constructor() {
    this.experience = new Experience();
    this.world = this.experience.world;
    this.audio = this.world.audio;
    this.debug = this.experience.debug;

    instance = this;

    instance.data = {
      color: ['pink', 'yellow', 'green', 'teal'],
      notes: ['e-4', 'f-sharp-4', 'g-sharp-4', 'a-4'],
      melody: [],
    };

    instance.config = {
      rounds: instance.world.selectedChapter.category == '6-8' ? explorersOne.noOfRounds : explorersTwo.noOfRounds,
      msBetweenNotes: instance.world.selectedChapter.category == '6-8' ? explorersOne.msBetweenNotes : explorersTwo.msBetweenNotes,
    };
  }

  toggleSimonSays() {
    instance.program = instance.world.program;
    instance.currentStepData = instance.program.getCurrentStepData();
    instance.audio.loadMelodyNotes(instance.data.notes);

    this.gameHTML();
    this.setEventListeners();
    this.startGame();

    this.audio.setOtherAudioIsPlaying(true);
    this.audio.fadeOutBgMusic();
  }

  gameHTML() {
    const game = _gl.elementFromHtml(`
            <section class="game simon-says">
                <div class="container">
                    <div class="box">
                        <div class="center"></div>
                        <div class="cables"></div>
                        <div class="side left"></div>
                        <div class="side right"></div>
                    </div>
                </div>
                <div class="overlay"></div>
            </section>`);

    document.querySelector('.app-container').append(game);

    instance.experience.navigation.next.classList.remove('focused');
    instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    instance.experience.navigation.next.classList.add('less-focused');

    for (let i = 0; i < instance.config.rounds; i++) {
      const ticker = document.createElement('div');
      ticker.classList.add('tick');
      ticker.setAttribute('data-item', i);

      const cable = document.createElement('div');
      cable.classList.add('cable');
      cable.setAttribute('data-item', i);

      game.querySelector('.cables').append(cable);

      i < 4 ? game.querySelector('.side.left').append(ticker) : game.querySelector('.side.right').append(ticker);
    }

    for (let j = 0; j < instance.data.color.length; j++) {
      const note = _gl.elementFromHtml(`<button class="note" data-id="${j}" data-color="${instance.data.color[j]}"></button>`);
      game.querySelector('.box').appendChild(note);
    }
  }

  setEventListeners() {
    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);

    document.querySelectorAll('.simon-says .note').forEach((note) => {
      note.addEventListener('click', () => {
        if (!instance.canPlay()) return;

        const i = note.dataset.id;
        instance.playPad(i);
        instance.checkMelody(i);
      });
    });
  }

  startGame() {
    instance.level = 0;
    instance.playMelody();
  }

  playMelody() {
    instance.blockPlaying();

    instance.currentPad = 0;
    instance.userMelody = 0;

    setTimeout(() => {
      setTimeout(() => {
        instance.data.melody.push(Math.floor(Math.random() * 4));
        instance.playPad(instance.data.melody[instance.currentPad]);
      }, 250);

      document.addEventListener(_e.ACTIONS.NOTE_PLAYED, instance.continueMelody);
    }, 1000);
  }

  continueMelody() {
    if (++instance.currentPad <= instance.level) {
      setTimeout(() => {
        instance.playPad(instance.data.melody[instance.currentPad]);
      }, instance.config.msBetweenNotes);
    } else {
      document.removeEventListener(_e.ACTIONS.NOTE_PLAYED, instance.continueMelody);
      instance.allowPlaying();
    }
  }

  playPad(pad) {
    const note = instance.data.notes[pad];
    instance.audio.playNote(note);
    instance.lightenPad(pad);
  }

  lightenPad(i) {
    const note = document.querySelector(".note[data-id='" + i + "']");
    if (!note) return;

    note.classList.add('lighten');

    setTimeout(() => {
      note.classList.remove('lighten');
    }, 500);
  }

  checkMelody(i) {
    if (i == instance.data.melody[instance.userMelody]) {
      if (instance.userMelody++ == instance.level) {
        instance.roundTick();

        if (instance.allNotesPlayed()) {
          return setTimeout(() => {
            instance.toggleGameComplete();
          }, 1000);
        }

        instance.level++;
        instance.playMelody();
      }
    } else {
      setTimeout(() => {
        instance.wrongNote();
      }, 1000);
    }
  }

  roundTick() {
    const round = document.querySelectorAll('.tick');
    round[instance.level].className += ' done';
  }

  wrongNote() {
    const existingModal = document.querySelector('.simon-says');
    if (existingModal.length) return;

    instance.toggleTryAgain();
  }

  toggleTryAgain() {
    instance.blockPlaying();

    const gameOverHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                <h1>${_s.miniGames.simonSays.failed.title}</h1>
                <p>${_s.miniGames.simonSays.failed.message}</p>
                <div class="buttons"></div>
            </div>
        `);

    const resetBTN = _gl.elementFromHtml(`
            <button class="btn default">${_s.miniGames.restartRound}</button>
        `);

    gameOverHTML.querySelector('.buttons').append(resetBTN);

    document.querySelector('.simon-says .container').append(gameOverHTML);
    document.querySelector('.simon-says').classList.add('popup-visible');

    // Add event listeners
    resetBTN.addEventListener('click', () => {
      instance.destroy();
      instance.toggleSimonSays();
    });
  }

  toggleGameComplete() {
    instance.blockPlaying();

    const congratsHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                <h1>${_s.miniGames.completed.title}</h1>
                <div class="buttons"></div>
            </div>
        `);

    instance.experience.navigation.next.classList.add('focused');
    instance.experience.navigation.next.innerHTML = instance.experience.icons.next;

    document.querySelector('.simon-says .container').append(congratsHTML);
    document.querySelector('.simon-says').classList.add('popup-visible');

    instance.audio.playSound('task-completed');
    instance.experience.celebrate({
      particleCount: 100,
      spread: 160,
    });
  }

  allNotesPlayed() {
    return instance.level + 1 == instance.config.rounds;
  }

  canPlay() {
    const miniGame = document.querySelector('.simon-says');
    if (!miniGame) return false;

    return miniGame.classList.contains('active');
  }

  allowPlaying() {
    const miniGame = document.querySelector('.simon-says');
    if (!miniGame) return;

    miniGame.classList.add('active');
  }

  blockPlaying() {
    const miniGame = document.querySelector('.simon-says');
    if (!miniGame) return;

    miniGame.classList.remove('active');
  }

  destroy() {
    instance.experience.navigation.next.classList.remove('less-focused');
    document.querySelector('.game')?.remove();
  }
}
