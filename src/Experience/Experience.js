import Sizes from './Utils/Sizes.js';
import World from './World.js';
import Menu from './Components/Menu.js';
import Page from './Components/Page.js';
import FAQ from './Components/FAQ.js';
import _gl from './Utils/Globals.js';
import { PlayerFactory, createPlayer } from 'bccm-video-player';
import confetti from 'canvas-confetti';

let instance = null;

export default class Experience {
  constructor() {
    // Singleton
    if (instance) return instance;
    instance = this;

    // Global access
    window.experience = this;

    // Options
    this.sizes = new Sizes();
    this.faq = new FAQ();
    this.page = new Page();
    this.world = new World();
    this.settings = new Menu();
    this.auth0 = {};

    this.navigation = {
      prev: document.querySelector('[aria-label="prev page"]'),
      next: document.querySelector('[aria-label="next page"]'),
      container: document.querySelector('.cta'),
    };

    this.icons = {
      prev: `<svg class="prev-icon icon" viewBox="0 0 25 16">
                <use href="#arrow-left"></use>
            </svg>`,
      next: `<svg class="next-icon icon" viewBox="0 0 25 16">
                <use href="#arrow-right"></use>
            </svg>`,
    };

    const celebrateCanvas = _gl.elementFromHtml(`<canvas class="celebrate" width="${this.sizes.width}"  height="${this.sizes.height}"></canvas>`);
    document.body.appendChild(celebrateCanvas);

    this.celebrate = confetti.create(celebrateCanvas, {
      resize: true,
      useWorker: true,
    });
  }
}
