import EventEmitter from './EventEmitter.js';

export default class Sizes extends EventEmitter {
  constructor() {
    super();

    // Setup
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Resize events
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.trigger('resize');
    });
  }
}
