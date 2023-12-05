import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Experience from '../Experience.js';
import _lang from '../Utils/Lang.js';
import _s from '../Utils/Strings.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class Video {
  constructor() {
    if (instance) return instance;

    instance = this;

    instance.experience = new Experience();
    instance.world = instance.experience.world;
    instance.debug = instance.experience.debug;
    instance.resources = instance.experience.resources;
    instance.camera = instance.experience.camera;
    instance.audio = instance.world.audio;
    instance.scene = instance.experience.scene;

    // Setup

    instance.videoPlayIcon = null;

    instance.video = () => {
      let id = instance.playingVideoId;
      return instance.resources.videoPlayers[id];
    };

    instance.videoJsEl = () => {
      let id = 'videojs-' + instance.playingVideoId;
      return document.getElementById(id);
    };

    instance.hasSkipBtn = () => {
      return instance.videoJsEl().querySelector('.skip-video') != null;
    };

    instance.getSkipBtn = () => {
      return instance.videoJsEl().querySelector('.skip-video');
    };

    instance.playingVideoId = null;
  }

  load(id) {
    instance.playingVideoId = id;

    // First, remove all previous event listeners - if any
    instance.video().off('ended', instance.waitAndFinish);
    instance.video().off('play', instance.setFullscreenIfNecessary);
    instance.video().off('fullscreenchange', instance.pauseOnFullscreenExit);

    // Always start new loaded videos from the beginning
    instance.video().currentTime(0);

    // Set texture when starting directly on a video task type
    if (instance.portalScreen.material.map != instance.resources.customTextureItems[id]) instance.setTexture(id);

    const videoQuality = instance.getVideoQuality();
    instance.resources.videoPlayers[id].setVideoQuality(videoQuality);

    instance.video().on('play', instance.setFullscreenIfNecessary);
    instance.video().on('fullscreenchange', instance.pauseOnFullscreenExit);
    instance.video().on('ended', instance.waitAndFinish);

    instance.focus();
    instance.addSkipBtn();
  }

  setTexture(id) {
    if (!instance.resources.customTextureItems.hasOwnProperty(id)) return;

    instance.portalScreen.material.map = instance.resources.customTextureItems[id];
    instance.portalScreen.material.map.flipY = false;
    instance.portalScreen.material.needsUpdate = true;
  }

  //#region Actions

  play() {
    instance.video().play();
    instance.experience.videoIsPlaying = true;
  }

  pause() {
    instance.video().pause();
    instance.experience.videoIsPlaying = false;
  }

  focus() {
    instance.camera.zoomIn(2000);

    instance.audio.setOtherAudioIsPlaying(true);
    instance.audio.fadeOutBgMusic();

    new TWEEN.Tween(instance.portalScreen.material)
      .to({ color: new THREE.Color(0xffffff) }, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();
  }

  defocus() {
    if (instance.video()) {
      instance.pause();
      instance.portalScreen.scale.set(0, 0, 0);
      instance.videoPlayIcon.visible = false;

      if (instance.video().isFullscreen_) instance.video().exitFullscreen();

      instance.audio.setOtherAudioIsPlaying(false);
      instance.audio.fadeInBgMusic();
    }
  }

  waitAndFinish() {
    setTimeout(() => {
      instance.finish();
    }, 1000);
  }

  finish() {
    if (instance.hasSkipBtn()) instance.getSkipBtn().remove();

    instance.defocus();
    instance.world.program.nextStep();

    setTimeout(() => {
      instance.playingVideoId = null;
    }, 1000);
  }

  //#endregion

  getVideoQuality() {
    switch (instance.world.selectedQuality) {
      case 'low':
        return 270;

      case 'medium':
        return 540;

      case 'high':
      default:
        return 1080;
    }
  }

  setFullscreenIfNecessary() {
    if (!this.isFullscreen_) this.requestFullscreen();
  }

  pauseOnFullscreenExit() {
    if (!this.isFullscreen_) instance.pause();
  }

  addSkipBtn() {
    if (instance.hasSkipBtn()) return;

    const skipVideo = document.createElement('div');
    skipVideo.className = 'skip-video btn default less-focused';
    skipVideo.innerText = _s.miniGames.skip;
    skipVideo.addEventListener('click', instance.finish);
    instance.videoJsEl().appendChild(skipVideo);
  }
}

const PIXEL_RATIO = (function () {
  var ctx = document.createElement('canvas').getContext('2d'),
    dpr = window.devicePixelRatio || 1,
    bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
  return dpr / bsr;
})();

const createRetinaCanvas = function (w, h, ratio) {
  if (!ratio) {
    ratio = PIXEL_RATIO;
  }
  var can = document.createElement('canvas');
  can.width = w * ratio;
  can.height = h * ratio;
  can.style.width = w + 'px';
  can.style.height = h + 'px';
  can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
  return can;
};
