import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Debug, StatsModule } from './Utils/Debug.js';
import Sizes from './Utils/Sizes.js';
import Time from './Utils/Time.js';
import Resources from './Utils/Resources.js';
import MouseMove from './Utils/MouseMove.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import sources from './Sources.js';
import Menu from './Components/Menu.js';
import World from './World/World.js';
import Page from './Components/Page.js';
import FAQ from './Components/FAQ.js';
import _gl from './Utils/Globals.js';
import _lang from './Utils/Lang.js';

let instance = null;

export default class Experience {
  constructor(canvas) {
    // Singleton
    if (instance) return instance;

    instance = this;

    // Global access
    window.experience = this;

    // Options
    this.canvas = canvas;
    this.faq = new FAQ();

    // Setup
    this.page = new Page();
    this.settings = new Menu();
    this.debug = new Debug();
    this.stats = new StatsModule();
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Resources(sources);
    this.pointer = new MouseMove();
    this.camera = new Camera();
    this.world = new World();
    this.raycaster = new THREE.Raycaster();
    this.renderer = new Renderer();
    this.auth0 = {};

    // Sizes resize event
    this.sizes.on('resize', () => {
      this.resize();
    });

    // Time animation event
    this.videoIsPlaying = false;
    this.gameIsOn = false;

    this.time.on('animation', () => {
      if (this.videoIsPlaying == false && this.gameIsOn == false) this.update();
    });

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

    const celebrateCanvas = _gl.elementFromHtml(
      `<canvas class="celebrate" width="${this.sizes.width}"  height="${this.sizes.height}"></canvas>`,
    );
    document.body.appendChild(celebrateCanvas);

    this.celebrate = confetti.create(celebrateCanvas, {
      resize: true,
      useWorker: true,
    });

    const redirectToLanguage = this.getUrlParameter('language');
    if (redirectToLanguage) {
      window.history.replaceState({}, document.title, '/');
      _lang.updateLanguage(redirectToLanguage);
    }
  }

  resize() {
    this.camera.resize();
    this.world.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.world.update();
    this.stats.update();
    this.renderer.update();
  }

  getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined
          ? true
          : decodeURIComponent(sParameterName[1]);
      }
    }
    return false;
  }
}
