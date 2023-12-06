import * as THREE from 'three';
import { VideoTexture } from 'three';
import Experience from '../Experience.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class ControlRoom {
  constructor() {
    instance = this;
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.resources = this.experience.resources;
    this.pointer = this.experience.pointer;
    this.time = this.experience.time;
    this.world = this.experience.world;

    this.clickableObjects = [];
    this.screenObjects = [];
    this.roomTexture = [];

    this.currentIntersect = null;
    this.texture = null;

    // Setup
    this.resourceItems = this.resources.items.controlRoom;

    // Events
    this.setEventListeners();
  }

  setEventListeners() {
    document.addEventListener(
      _e.ACTIONS.STEP_TOGGLED,
      this.irisTextureTransition,
    );

    window.addEventListener('click', () => {
      if (!this.experience.world.program) return;
    });
  }

  irisTextureTransition() {
    instance.stopAllCustomIrisTextures();
    instance.setDefaultIrisTexture();
  }

  // Set textures
  setTexture(meshName, texture) {
    if (!texture) return;

    this.texture = texture;
    this.changeMeshTexture(meshName, this.texture);
    this.playIfVideoTexture();
  }

  changeMeshTexture(name, texture) {
    let mesh = this.screenObjects.filter((obj) => {
      return obj.name == name;
    });
    if (mesh) {
      mesh[0].material.map = texture;
    }
  }

  updateTextureScreen4x4() {}

  playIfVideoTexture() {
    if (this.texture instanceof VideoTexture) {
      this.texture.image.play();
    }
  }

  setDefaultIrisTexture() {}

  playCustomIrisTexture(textureName) {
    if (!instance.resources.customTextureItems[textureName].item) return;

    instance.resources.customTextureItems[
      textureName
    ].item.source.data.currentTime = 0;
    instance.resources.customTextureItems[textureName].item.source.data.play();
  }

  stopAllCustomIrisTextures() {
    const customIrisTextures = Object.keys(
      instance.resources.customTextureItems,
    );
    customIrisTextures.forEach((textureName) => {
      instance.resources.customTextureItems[
        textureName
      ].item?.source.data.pause();
    });
  }
}
