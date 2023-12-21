import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _gl from '../Utils/Globals.js';

let instance = null;
export default class FAQ {
  constructor() {
    instance = this;
    instance.experience = new Experience();

    instance.generateItems();
    instance.setEventListeners();
  }

  generateItems() {
    const list = document.querySelector('#faq-block ul');

    const faqQuestions = Object.values(_s.faq.questions);
    const faqAnswers = Object.values(_s.faq.answers);

    for (let i = 0; i < faqQuestions.length; i++) {
      const listItem = _gl.elementFromHtml(`
                <li>
                    <p>${faqQuestions[i]}</p>
                    <p>${faqAnswers[i]}</p>
                </li>
            `);

      list.append(listItem);
    }

    document.querySelector('#faq-block h2').innerText = _s.settings.faq;
  }

  setEventListeners() {
    document.querySelector('#open-faq').addEventListener('click', instance.open);
    document.querySelector('#close-faq')?.addEventListener('click', instance.close);
  }

  open() {
    document.querySelector('#app-modals').classList.add('faq-is-open');
  }

  close() {
    document.querySelector('#app-modals').classList.remove('faq-is-open');
  }
}
