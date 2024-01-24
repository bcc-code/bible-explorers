import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _gl from '../Utils/Globals.js';

let instance = null;

export default class Congrats {
  constructor() {
    instance = this;
    instance.experience = new Experience();
    instance.world = instance.experience.world;
  }

  toggleSummary() {
    instance.destroy();
    instance.experience.navigation.prev.addEventListener('click', instance.destroy);
    instance.world.audio.playSound('task-completed');

    const summary = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="summary">
                        <header>
                            <h3 class="text-bke-accent text-2xl font-semibold">${_s.miniGames.completed.title}</h3>
                        </header>
                    </div>
                </div>
            </div>
        `);

    document.querySelector('#app-games').append(summary);
    document.querySelector('#app-games').classList.remove('hidden');
    document.querySelector('#bg-chapter').classList.add('hidden');
  }

  toggleBibleCardsReminder() {
    instance.destroy();
    instance.world.program.destroy();

    instance.experience.navigation.next.addEventListener('click', instance.toggleCongrats);

    const bibleCards = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="bibleCards">
                        <header>
                            <h3 class="text-bke-accent text-2xl font-semibold">${_s.journey.bibleCards.message}</h1>
                        </header>
                        <video id="bibleCards" src="games/bible_cards.webm" muted autoplay loop></video>
                    </div>
                </div>
            </div>
        `);

    document.querySelector('#app-games').append(bibleCards);
    document.querySelector('#app-games').classList.remove('hidden');
    document.querySelector('#bg-chapter').classList.add('hidden');
  }

  toggleCongrats() {
    instance.destroy();
    instance.experience.navigation.next.addEventListener('click', instance.finishChapter);
    instance.world.audio.playSound('congrats');
    instance.experience.celebrate({
      particleCount: 100,
      spread: 160,
    });
    const chapterCongrats = _gl.elementFromHtml(`
            <div class="modal">
                <div class="container">
                    <div class="chapter-progress">
                        <progress max="3" value="3"></progress>
                        <ul>
                            <li class="filled">
                                <svg class="w-12 h-12"><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                            <li class="filled">
                                <svg class="w-12 h-12"><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                            <li class="filled">
                                <svg class="w-12 h-12"><use href="#star-solid"  fill="currentColor"></use></svg>
                            </li>
                        </ul>
                    </div>
                    <div class="congrats">
                        <header>
                            <h3 class="text-bke-accent text-2xl font-semibold">${_s.journey.congrats}</h3>
                        </header>
                        <p class="text-xl">${_s.journey.completed}:<br /><strong>${instance.world.selectedChapter.title}</strong></p>
                    </div>
                </div>
            </div>
        `);

    document.querySelector('#app-games').append(chapterCongrats);
    document.querySelector('#app-games').classList.remove('hidden');
    document.querySelector('#bg-chapter').classList.add('hidden');
  }

  finishChapter() {
    instance.destroy();
    instance.world.goHome();
  }

  destroy() {
    document.querySelector('.modal')?.remove();
    document.querySelector('#app-games').classList.add('hidden');

    instance.experience.navigation.prev.removeEventListener('click', instance.destroy);
    instance.experience.navigation.next.removeEventListener('click', instance.destroy);
    instance.experience.navigation.next.removeEventListener('click', instance.toggleCongrats);
    instance.experience.navigation.next.removeEventListener('click', instance.finishChapter);
  }
}
