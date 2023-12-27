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
    instance.videosContainer = document.querySelector('#videos-container');
  }

  load(id) {
    instance.playingVideoId = id;

    // First, remove all previous event listeners - if any
    instance.video().off('ended', instance.finish);

    // Always start new loaded videos from the beginning
    instance.video().currentTime(0);

    const videoQuality = instance.getVideoQuality();
    instance.resources.videoPlayers[id].setVideoQuality(videoQuality);

    instance.video().on('ended', instance.finish);

    instance.focus();
    // instance.addSkipBtn();
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

    instance.videosContainer.style.display = 'flex';
    instance.videosContainer.querySelector('#' + instance.playingVideoId).style.display = 'flex';
  }

  defocus() {
    if (!instance.video()) return;

    instance.pause();

    instance.audio.setOtherAudioIsPlaying(false);
    instance.audio.fadeInBgMusic();

    instance.videosContainer.style.display = 'none';
    instance.videosContainer.querySelector('#' + instance.playingVideoId).style.display = 'none';

    // instance.experience.navigation.next.disabled = false
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
