import Offline from '../Utils/Offline.js';
import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _gl from '../Utils/Globals.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class ConfirmationScreen {
  constructor() {
    instance = this;

    instance.experience = new Experience();
    instance.debug = instance.experience.debug;
    instance.offline = new Offline();
  }

  show() {
    instance.world = instance.experience.world;
    instance.program = instance.world.program;
    instance.stepData = instance.program.getCurrentStepData();
    instance.data = instance.stepData.confirmation_screen;

    instance.setHtml();
    instance.useCorrectAssetsSrc();

    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);
  }

  useCorrectAssetsSrc() {
    instance.offline.fetchChapterAsset(instance.data, 'cs_image', (data) => {
      document.querySelector('.game-tutorial img').src = data.cs_image;
    });
  }

  setHtml() {
    const startGame = _gl.elementFromHtml(`
      <button class="btn default focused pulsate">${instance.data.button}</button>
    `);
    startGame.addEventListener('click', instance.program.nextStep);

    const task = _gl.elementFromHtml(`
      <section class="task">
        <div class="container">
          <div class="content">
            <header class="game-header">
              <h2>${instance.stepData.details.title}</h2>
            </header>
            <div class="game-tutorial">
                <img src="${instance.data.image}" width="100%" height="100%" class="h-full" />
            </div>
            <div class="game-description text-white mb-2">
              ${instance.stepData.details.prompts ? instance.stepData.details.prompts[0].prompt : ''}
            </div>
          </div>
        </div>
        <div class="overlay"></div>
      </section>
    `);

    task.querySelector('.content').append(startGame);
    document.querySelector('.ui-container').append(task);

    instance.experience.navigation.next.classList.remove('focused');
    instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    instance.experience.navigation.next.classList.add('less-focused');
    instance.experience.navigation.container.style.display = 'flex';
  }

  destroy() {
    document.querySelector('section.task')?.remove();

    instance.experience.navigation.next.classList.add('focused');
    instance.experience.navigation.next.classList.remove('less-focused');
    instance.experience.navigation.next.innerHTML = instance.experience.icons.next;
  }
}
