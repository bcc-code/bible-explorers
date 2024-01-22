import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _lang from '../Utils/Lang.js';
import _api from '../Utils/Api.js';
import _gl from '../Utils/Globals.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class QuestionAndCode {
  constructor() {
    this.experience = new Experience();
    instance = this;
  }

  toggleQuestionAndCode() {
    instance.world = instance.experience.world;
    instance.debug = instance.experience.debug;
    instance.program = instance.world.program;
    instance.currentCheckpoint = instance.program.currentCheckpoint;
    instance.selectedChapter = instance.world.selectedChapter;
    instance.currentStepData = instance.program.getCurrentStepData();
    instance.question = instance.currentStepData.question_and_code;
    instance.localStorageId = 'answers-theme-' + instance.selectedChapter.id;
    instance.toggleQuestion();
  }

  toggleQuestion() {
    const answersWrapper = _gl.elementFromHtml(`
        <div class="game answers">
            <div class="container">
                <button class="btn default" aria-label="skip-button" style="display: none">${_s.miniGames.skip}</button>
                <form>
                    <label for="answer1">1</label>
                    <input type="text" id="answer1" />
                    <label for="answer2">2</label>
                    <input type="text" id="answer2" />
                    <label for="answer3">3</label>
                    <input type="text" id="answer3" />
                    <label for="answer4">4</label>
                    <input type="text" id="answer4" />
                </form>
            </div>
            <div class="overlay"></div>
        </div>`);

    document.querySelector('.app-container').append(answersWrapper);

    instance.experience.navigation.next.classList.remove('focused');
    instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    instance.experience.navigation.next.classList.add('less-focused');
    instance.experience.navigation.container.style.display = 'flex';

    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);

    let allInputsEmpty = true;

    instance.el = {};
    instance.el.inputs = document.querySelectorAll('.answers input');
    instance.el.inputs.forEach((input, index) => {
      if (index == 0) input.focus();
      if (input.value.length != 0) allInputsEmpty = false;

      input.addEventListener('input', () => {
        const val = [...instance.el.inputs].filter((input) => input.value.length == 0).length;

        if (val == 0) {
          instance.experience.navigation.container.style.display = 'flex';
          instance.experience.navigation.next.classList.add('focused');
          instance.experience.navigation.next.innerHTML = instance.experience.icons.next;
        } else {
          instance.experience.navigation.next.classList.remove('focused');
          instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
        }
      });
    });

    instance.experience.navigation.next.addEventListener('click', instance.saveAnswers);

    // if (allInputsEmpty)
    //     instance.experience.navigation.next.disabled = true
  }

  saveAnswers() {
    let thisTaskAnswers = [];
    instance.el.inputs.forEach((input) => {
      thisTaskAnswers.push(input.value);
    });

    fetch(_api.saveAnswer(), {
      method: 'POST',
      body: JSON.stringify({
        answer: thisTaskAnswers,
        chapterId: instance.selectedChapter.id,
        chapterTitle: instance.selectedChapter.title,
        language: _lang.getLanguageCode(),
      }),
    });
  }

  destroy() {
    document.querySelector('.game')?.remove();

    instance.experience.navigation.next.removeEventListener('click', instance.saveAnswers);
    instance.experience.navigation.next.classList.add('focused');
    instance.experience.navigation.next.classList.remove('less-focused');
    instance.experience.navigation.next.innerHTML = instance.experience.icons.next;
  }
}
