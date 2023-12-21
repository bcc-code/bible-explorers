import Experience from '../Experience';
import _s from '../Utils/Strings.js';
import _gl from '../Utils/Globals.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class Message {
  constructor() {
    instance = this;
    instance.experience = new Experience();
    instance.world = instance.experience.world;
    instance.resources = instance.experience.resources;
    instance.audio = instance.world.audio;
    instance.navigation = instance.experience.navigation;
  }

  show(text = '', character = '') {
    instance.destroy();
    instance.world = instance.experience.world;
    instance.program = instance.world.program;
    instance.stepData = instance.program.getCurrentStepData();
    instance.data = instance.stepData.message;

    if (!text) text = instance.data.text;
    if (!character) character = instance.data ? instance.data.character : 'iris';

    instance.setHtml(text, character);
    instance.setEventListeners();

    if (instance.data.audio) instance.audio.togglePlayTaskDescription(instance.data.audio);

    if (instance.data.video) {
      instance.world.controlRoom.playCustomIrisTexture(instance.data.video);
    }
  }

  setHtml(text, character) {
    const message = _gl.elementFromHtml(
      `<section class="message">
            <div class="absolute inset-0 pointer-events-auto grid grid-cols-12 grid-rows-6">
                <div class="col-span-full row-span-4 row-start-2 p-4">
                  <div class="border-2 border-bke-outline rounded-lg bg-white/40 h-full">
                    // Video iframe from IRIS
                  </div>
                </div>
                <div class="col-span-8 row-start-6 p-4">
                  <div class="h-full rounded-lg border-2 border-bke-outline bg-gradient-to-r from-bke-dark to-bke-primary px-6 py-4">
                    <h3 class="text-lg italic text-bke-outline uppercase">${character}</h3>
                    <div class="mt-1 text-lg text-white/80">${text}</div>
                  </div>
                </div>
            </div>
        </section>`
    );
    document.querySelector('.ui-container').append(message);

    if (instance.data.character == 'glitch') {
      const glitch = _gl.elementFromHtml('<video id="glitch-idle" src="textures/glitch_idle_v2.mp4" muted autoplay loop></video>');
      document.querySelector('section.message .container').append(glitch);
    }

    if (instance.data.open_question === true) {
      // instance.experience.navigation.next.disabled = true
      const openQuestion = _gl.elementFromHtml(
        `<section class="open-question">
                    <div class="container">
                        <div class="content">
                            <textarea class="question-textarea" rows="8" placeholder="${_s.task.openQuestion}"></textarea>
                        </div>
                    </div>
                </section>`
      );
      document.querySelector('.ui-container').append(openQuestion);

      const textarea = openQuestion.querySelector('textarea');
      textarea.addEventListener('input', (e) => {
        instance.experience.navigation.next.disabled = e.target.value.length <= 2;
      });
    }
  }

  setEventListeners() {
    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);
  }

  destroy() {
    document.querySelector('section.message')?.remove();
    document.querySelector('section.open-question')?.remove();
  }
}
