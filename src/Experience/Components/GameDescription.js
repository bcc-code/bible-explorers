import Offline from '../Utils/Offline.js';
import Experience from '../Experience';
import _s from '../Utils/Strings.js';
import _gl from '../Utils/Globals.js';
import _e from '../Utils/Events.js';
import SortingGame from '../Games/SortingGame.js';
import CableConnectorGame from '../Games/CableConnectorGame.js';
import SimonSaysGame from '../Games/SimonSaysGame.js';
import FlipCards from '../Games/FlipCards.js';
import ChooseNewKing from '../Games/ChooseNewKing.js';
import HeartDefense from '../Games/HeartDefense.js';
import DavidsRefuge from '../Games/DavidsRefugeGame.js';
import MazeGame from '../Games/MazeGame.js';

let instance = null;

export default class GameDescription {
  constructor() {
    instance = this;

    instance.experience = new Experience();
    instance.debug = instance.experience.debug;

    // Setup
    instance.offline = new Offline();
    instance.sortingGame = new SortingGame();
    instance.cableConnectorGame = new CableConnectorGame();
    instance.simonSays = new SimonSaysGame();
    instance.flipCards = new FlipCards();
    instance.chooseNewKing = new ChooseNewKing();
    instance.heartDefense = new HeartDefense();
    instance.davidsRefuge = new DavidsRefuge();
    instance.mazeGame = new MazeGame();
  }

  show() {
    instance.world = instance.experience.world;
    instance.program = instance.world.program;
    instance.stepData = instance.program.getCurrentStepData();
    instance.data = instance.stepData.details;

    instance.setHtml();

    if (instance.data.tutorial) {
      // Fetch details tutorial from blob or url
      instance.offline.fetchChapterAsset(instance.data, 'tutorial', (data) => {
        instance.program.updateAssetInProgramData('details', data);
        document.querySelector('#image-tutorial > *').src = data.tutorial;
      });
    }

    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);
  }

  setHtml() {
    const startGame = _gl.elementFromHtml(`
      <button class="btn default focused pulsate w-full mt-4">${_s.miniGames.startGame}</button>
    `);
    startGame.addEventListener('click', instance.startGame);

    const taskImage = _gl.elementFromHtml(`
      <div class="aspect-video bg-bke-primary p-12 flex items-center justify-center" id="image-tutorial">${instance.data.tutorial != '' ? instance.getDomElement(instance.data.tutorial) : ''}</div>
    `);

    const taskContent = _gl.elementFromHtml(`
      <div>
        <h3 class="text-bke-accent font-semibold text-2xl">${instance.data.title}</h2>
        <p class="my-8">Welcome to "Maze Explorer: Quest for the Bible Box"! In this exciting adventure, you take on the role of Glitch, a small and determined robot on a mission to find the elusive Bible Box hidden deep within a maze. Your goal is to navigate Glitch through the twists and turns of the maze, using either the arrow keys or the WASD keys to guide him to the coveted treasure.</p>
        <p class="text-white/60">Are you ready to help Glitch on his quest? Put your maze-solving skills to the test in "Maze Explorer: Quest for the Bible Box" and see if you can beat the clock to claim the ultimate prize!</p>
        ${instance.data.prompts ? instance.data.prompts[0].prompt : ''}
      </div>
    `);

    document.querySelector('#chapter-videos').append(taskImage);
    document.querySelector('#chapter-tasks div').append(taskContent, startGame);

    instance.experience.navigation.next.classList.remove('focused');
    instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    instance.experience.navigation.next.classList.add('less-focused');
  }

  startGame() {
    instance.destroy();

    if (instance.program.taskType() == 'cables') {
      instance.cableConnectorGame.toggleCableConnector();
    } else if (instance.program.taskType() == 'sorting') {
      instance.sortingGame.toggleSortingGame();
    } else if (instance.program.taskType() == 'simon_says') {
      instance.simonSays.toggleSimonSays();
    } else if (instance.program.taskType() == 'flip_cards') {
      instance.flipCards.toggleGame();
    } else if (instance.program.taskType() == 'choose_new_king') {
      instance.chooseNewKing.toggleGame();
    } else if (instance.program.taskType() == 'heart_defense') {
      instance.heartDefense.toggleGame();
    } else if (instance.program.taskType() == 'davids_refuge') {
      instance.davidsRefuge.toggleGame();
    } else if (instance.program.taskType() == 'labyrinth') {
      instance.mazeGame.toggleGame();
    }
  }

  getDomElement(url) {
    const ext = url.split('.').pop().toLowerCase();

    if (['mp4', 'mov', 'webm'].includes(ext)) return `<video src="" width="100%" height="100%" frameBorder="0" autoplay loop></video>`;
    else return `<img src="" wdith="100%" height="100%" class="h-full" />`;
  }

  destroy() {
    document.querySelector('#image-tutorial')?.remove();
    document.querySelector('#chapter-tasks div').innerHTML = '';

    instance.experience.navigation.next.classList.add('focused');
    instance.experience.navigation.next.classList.remove('less-focused');
    instance.experience.navigation.next.innerHTML = instance.experience.icons.next;
  }
}
