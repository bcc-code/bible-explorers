import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';

import Experience from './Experience.js';
import Audio from './Extras/Audio.js';
import { setIn } from 'immutable';

let camera = null;

export default class Camera {
  constructor() {
    camera = this;
    camera.experience = new Experience();
    camera.audio = new Audio();
    camera.sizes = camera.experience.sizes;
    camera.scene = camera.experience.scene;
    camera.canvas = camera.experience.canvas;
    camera.resources = camera.experience.resources;
    camera.debug = camera.experience.debug;

    // Options
    camera.cameraUpdated = false;
    camera.updateCameraTween = null;
    camera.zoomInTween = null;
    camera.data = {
      moveDuration: 2000,
      zoom: 1.15,
      location: 0,
      debug: false,
      fov: 60,
    };

    camera.setInstance();
  }

  setInstance() {
    camera.instance = new THREE.PerspectiveCamera(
      camera.data.fov,
      camera.sizes.width / camera.sizes.height,
      0.01,
      1000,
    );
    camera.instance.position.copy(camera.cameraLocations.default.position);

    camera.instance.layers.enable(0);
    camera.instance.layers.enable(1);

    camera.scene.add(camera.instance);
  }

  updateCameraTo(location = 'default', callback = () => {}) {
    const diffCamLocation = camera.lastCameraSettings.location != location;

    // Update camera history
    camera.lastCameraSettings = {
      location: location,
      position: new THREE.Vector3().copy(camera.instance.position),
    };

    if (location == null) return;

    if (diffCamLocation) {
      camera.audio.playSound('whoosh-between-screens');
      camera.updateCamera(camera.cameraLocations[location], callback);
    } else {
      callback();
    }
  }

  updateCamera(
    { position, lookAt, controls, duration = camera.data.moveDuration },
    callback,
  ) {
    document.body.classList.add('camera-is-moving');

    if (camera.updateCameraTween) camera.updateCameraTween.stop();

    if (camera.zoomInTween) camera.zoomOut(2000);

    const from = {
      cameraPosition: new THREE.Vector3().copy(camera.instance.position),
      cameraLookAt: new THREE.Vector3().copy(camera.controls.target),
    };

    const to = {
      cameraPosition: position,
      cameraLookAt: lookAt,
    };

    if (!camera.debug.developer) camera.setDefaultAngleControls();

    camera.updateCameraTween = new TWEEN.Tween(from)
      .to(to, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((obj) => {
        camera.controls.target.set(
          obj.cameraLookAt.x,
          obj.cameraLookAt.y,
          obj.cameraLookAt.z,
        );
        camera.instance.position.set(
          obj.cameraPosition.x,
          obj.cameraPosition.y,
          obj.cameraPosition.z,
        );
      })
      .onComplete(() => {
        if (controls && !camera.debug.developer) {
          camera.controls.minPolarAngle = controls.minPolarAngle;
          camera.controls.maxPolarAngle = controls.maxPolarAngle;
          camera.controls.minAzimuthAngle = controls.minAzimuthAngle;
          camera.controls.maxAzimuthAngle = controls.maxAzimuthAngle;
        }
        callback();
        document.body.classList.remove('camera-is-moving');
      })
      .start();

    camera.controls.autoRotate = false;
  }

  zoomIn(time) {
    camera.zoomInTween = new TWEEN.Tween(camera.controls.object)
      .to({ zoom: 1.3 }, time)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        camera.instance.updateProjectionMatrix();
      })
      .start();
  }

  zoomOut(time) {
    camera.zoomInTween = new TWEEN.Tween(camera.controls.object)
      .to({ zoom: 1 }, time)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        camera.instance.updateProjectionMatrix();
      })
      .start();
  }

  setDefaultAngleControls() {
    camera.controls.minPolarAngle = -Math.PI;
    camera.controls.maxPolarAngle = Math.PI;
    camera.controls.minAzimuthAngle = -Math.PI;
    camera.controls.maxAzimuthAngle = Math.PI;
  }

  resize() {
    camera.instance.aspect = camera.sizes.width / camera.sizes.height;
    camera.instance.updateProjectionMatrix();
  }

  update() {
    TWEEN.update();
    camera.controls.update();

    if (camera.controls.autoRotate) {
      camera.changeRotateDirection();
    }
  }
}
