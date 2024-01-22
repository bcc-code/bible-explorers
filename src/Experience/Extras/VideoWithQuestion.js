import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _lang from '../Utils/Lang.js';
import _api from '../Utils/Api.js';
import _gl from '../Utils/Globals.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class VideoWithQuestion {
  constructor() {
    instance = this;
    instance.experience = new Experience();
    instance.resources = instance.experience.resources;
    instance.debug = instance.experience.debug;
    instance.audio = instance.experience.world.audio;
  }

  toggleVideoWithQuestion() {
    instance.world = instance.experience.world;
    instance.selectedChapter = instance.world.selectedChapter;
    instance.program = instance.world.program;
    instance.stepData = instance.program.getCurrentStepData();
    instance.data = instance.stepData.video_with_question;

    instance.audio.setOtherAudioIsPlaying(true);
    instance.audio.fadeOutBgMusic();

    const container = _gl.elementFromHtml(`
            <div class="view" id="video-with-question">
                <div class="container">
                    <header class="game-header">
                        <h2>${instance.stepData.details.title}</h2>
                    </header>
                    <div class="row">
                        <div id="video-${instance.data.video}" class="video"></div>
                    </div>
                    <div class="row hidden">
                        <div class="col">
                            <span class="title">${instance.data.question}</span>
                        </div>
                        <div class="col">
                            <textarea></textarea>
                            <button class="btn default focused" type="submit" aria-label="submit question">${_s.task.submit}</button>
                        </div>
                    </div>
                </div>
                <div class="overlay"></div>
            </div>
        `);

    document.querySelector('.app-container').append(container);

    // Load BTV Player
    instance.resources.loadVideoInBtvPlayer(instance.data.video);

    const playerInterval = setInterval(() => {
      if (instance.resources.videoPlayers[instance.data.video]) {
        clearInterval(playerInterval);

        instance.resources.videoPlayers[instance.data.video].on('ended', instance.toggleQuestion);
      }
    }, 100);

    const submitQuestion = container.querySelector('[aria-label="submit question"');
    submitQuestion.addEventListener('click', () => {
      instance.saveAnswers();
      instance.destroy();
      instance.program.nextStep();
    });

    instance.experience.navigation.next.removeEventListener('click', instance.program.nextStep);
    instance.experience.navigation.next.addEventListener('click', instance.toggleQuestion);
    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);
  }

  toggleQuestion() {
    instance.resources.videoPlayers[instance.data.video].pause();
    document.querySelectorAll('#video-with-question .hidden').forEach((item) => item.classList.remove('hidden'));

    instance.experience.navigation.next.addEventListener('click', instance.saveAnswers);
    instance.experience.navigation.next.removeEventListener('click', instance.toggleQuestion);
    instance.experience.navigation.next.addEventListener('click', instance.program.nextStep);
    instance.experience.navigation.next.classList.remove('focused');
  }

  saveAnswers() {
    const answer = document.querySelector('#video-with-question textarea').value;
    if (!answer) return;

    const data = {
      taskTitle: instance.stepData.details.title,
      answer: [answer],
      chapterId: instance.selectedChapter.id,
      chapterTitle: instance.selectedChapter.title,
      language: _lang.getLanguageCode(),
    };

    fetch(_api.saveAnswer(), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  destroy() {
    instance.experience.navigation.prev.removeEventListener('click', instance.destroy);
    instance.experience.navigation.next.removeEventListener('click', instance.saveAnswers);
    instance.experience.navigation.next.removeEventListener('click', instance.toggleQuestion);
    instance.experience.navigation.next.removeEventListener('click', instance.destroy);
    document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);
    instance.experience.navigation.next.addEventListener('click', instance.program.nextStep);
    document.getElementById('video-with-question')?.remove();
    instance.experience.navigation.next.classList.add('focused');

    instance.audio.setOtherAudioIsPlaying(false);
    instance.audio.fadeInBgMusic();
  }
}
