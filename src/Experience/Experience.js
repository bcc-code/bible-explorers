import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Debug, StatsModule } from './Utils/Debug.js';
import Sizes from './Utils/Sizes.js';
import Time from './Utils/Time.js';
import Resources from './Utils/Resources.js';
import MouseMove from './Utils/MouseMove.js';
import sources from './Sources.js';
import Menu from './Components/Menu.js';
import World from './World/World.js';
import FAQ from './Components/FAQ.js';
import _gl from './Utils/Globals.js';

let instance = null;

export default class Experience {
  constructor() {
    // Singleton
    if (instance) return instance;

    instance = this;

    // Global access
    window.experience = this;

    // Options
    this.faq = new FAQ();

    // Setup
    this.settings = new Menu();
    this.debug = new Debug();
    this.stats = new StatsModule();
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Resources(sources);
    this.pointer = new MouseMove();
    this.world = new World();
    this.auth0 = {};

    // Time animation event
    this.videoIsPlaying = false;
    this.gameIsOn = false;

    this.navigation = {
      prev: document.querySelector('[aria-label="prev page"]'),
      next: document.querySelector('[aria-label="next page"]'),
      container: document.querySelector('.chapter-navigation'),
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

  update() {
    this.world.update();
    this.stats.update();
  }
}
