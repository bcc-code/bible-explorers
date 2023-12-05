let instance = null;

export default class Experience {
  constructor() {
    // Singleton
    if (instance) return instance;

    instance = this;

    // Global access
    window.experience = this;
  }
}
