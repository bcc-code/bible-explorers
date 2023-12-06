import * as THREE from 'three';
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
    instance.audio = instance.world.audio;
    instance.scene = instance.experience.scene;
    instance.controlRoom = instance.world.controlRoom;
    instance.clickableObjects = instance.controlRoom.clickableObjects;

    // Setup
    instance.videoPlayIcon = null;

    instance.canvasTexture();

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

  canvasTexture() {
    // create image
    const bitmap = createRetinaCanvas(1920, 1080, 1);
    const ctx = bitmap.getContext('2d', { antialias: false });

    const centerX = bitmap.width / 2;
    const centerY = bitmap.height / 2;
    const size = 40;
    const circle = size * 2.5;

    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.rect(0, 0, 1920, 1080);
    ctx.fillStyle = 'black';
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';

    // make circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, circle, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    // make play button
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(centerX - size + 10, centerY - size);
    ctx.lineTo(centerX - size + 10, centerY + size);
    ctx.lineTo(centerX + size + 5, centerY);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // canvas contents are used for
    const texture = new THREE.Texture(bitmap);
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      map: texture,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(16, 9);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'play_video_icon';
    this.scene.add(mesh);

    mesh.visible = false;

    this.videoPlayIcon = mesh;
    this.clickableObjects.push(mesh);
  }

  load(id) {
    instance.playingVideoId = id;

    // First, remove all previous event listeners - if any
    instance.video().off('ended', instance.waitAndFinish);
    instance.video().off('play', instance.setFullscreenIfNecessary);
    instance.video().off('fullscreenchange', instance.pauseOnFullscreenExit);

    // Always start new loaded videos from the beginning
    instance.video().currentTime(0);

    const videoQuality = instance.getVideoQuality();
    instance.resources.videoPlayers[id].setVideoQuality(videoQuality);

    instance.video().on('play', instance.setFullscreenIfNecessary);
    instance.video().on('fullscreenchange', instance.pauseOnFullscreenExit);
    instance.video().on('ended', instance.waitAndFinish);

    instance.focus();
    instance.addSkipBtn();
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
    instance.audio.setOtherAudioIsPlaying(true);
    instance.audio.fadeOutBgMusic();
  }

  defocus() {
    if (instance.video()) {
      instance.pause();
      instance.videoPlayIcon.visible = false;

      if (instance.video().isFullscreen_) instance.video().exitFullscreen();

      instance.audio.setOtherAudioIsPlaying(false);
      instance.audio.fadeInBgMusic();
    }

    // instance.experience.navigation.next.disabled = false
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
    bsr =
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio ||
      1;
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
