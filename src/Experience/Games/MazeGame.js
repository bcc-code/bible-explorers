import Experience from "../Experience.js";
import _s from "../Utils/Strings.js";
import _gl from "../Utils/Globals.js";
import _e from "../Utils/Events.js";
import Timer from "../Extras/Timer.js";

import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import TWEEN, { Tween } from "@tweenjs/tween.js";

let instance = null;
let q = new THREE.Quaternion();
let bibleBox;

const clock = new THREE.Clock();

export default class MazeGame {
  constructor() {
    instance = this;

    this.experience = new Experience();
    this.world = this.experience.world;
    this.debug = this.experience.debug;
    this.sizes = this.experience.sizes;
    this.time = this.experience.time;
    this.resources = this.experience.resources;
  }

  toggleGame() {
    instance.program = instance.world.program;
    instance.currentStepData = instance.program.getCurrentStepData();

    this.experience.gameIsOn = true;

    this.initSettings();
    this.initHtml();
    this.setEventListeners();

    this.time.on("animation", () => {
      this.update();
    });

    this.sizes.on("resize", () => {
      this.resize();
    });
  }

  initSettings() {
    // Options
    this.options = {
      gameState: "initialize",
      gameLevel: 0,
      gameLevels: 5,
      mainGameEnded: false,
      gameRepeat: false,
    };

    this.player = {
      localVelocity: new CANNON.Vec3(),
      moveDistance: 10,
    };

    this.maze = {
      entrancePosition: [],
      exitPosition: [],
      wallSize: 0.5, // width, height and depth
    };
  }

  addInstructions() {
    const texture = this.resources.items.instructions;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const geometry = new THREE.PlaneGeometry(0.3, 0.5);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.x = this.maze.entrancePosition[0] - 0.75;
    mesh.position.y = 0.1;
    mesh.position.z = this.maze.entrancePosition[1];
    this.scene.add(mesh);
  }

  setEventListeners() {
    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, this.destroy);

    const actionButton = document.querySelector(".maze-game button");

    actionButton.addEventListener("click", () => {
      this.options.gameState = "initialize";
      this.disposeLevelAssets();
    });
  }

  timerWithTimeElapsed() {
    const timerInMinutes = this.currentStepData.timer;
    return timerInMinutes && this.timer.remainingSeconds == 0;
  }

  startTimer() {
    const timerInMinutes = this.currentStepData.timer;

    if (timerInMinutes > 0) {
      this.timer = new Timer();

      this.timer.setMinutes(timerInMinutes, ".maze-game .container");

      document.addEventListener(
        _e.ACTIONS.TIME_ELAPSED,
        instance.onTimeElapsed
      );
    }
  }

  stopTimer() {
    const timerInMinutes = this.currentStepData.timer;

    if (timerInMinutes > 0) {
      this.timer.destroy();

      document.removeEventListener(
        _e.ACTIONS.TIME_ELAPSED,
        instance.onTimeElapsed
      );
    }
  }

  initHtml() {
    const game = _gl.elementFromHtml(`
        <section class="game maze-game">
            <div class="container">
                <div class="game-rounds">
                ${_s.miniGames.level} ${this.options.gameLevel + 1} / 5
                </div>
                <div class="game-popup">
                    <h1>${_s.miniGames.completed.title}</h1>
                    <div class="buttons">
                        <button class="btn default focused" id="new-level">
                        ${_s.miniGames.nextRound}</button>
                    </div>
                </div>
                <div class="game-labels">
                    <span id="start-label"></span>
                    <span id="exit-label"></span>
                </div>
            </div>
            <div class="overlay"></div>
            <div id="maze-canvas" class="game-canvas"></div>
        </section>`);

    document.querySelector(".ui-container").append(game);
    document.querySelector(".game-popup").style.display = "none";

    instance.experience.navigation.next.classList.remove("focused");
    instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    instance.experience.navigation.next.classList.add("less-focused");
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.addCamera();
    this.addLight();
    this.addRenderer();

    // add elements
    this.addFloor();
    this.addMaze(this.options.gameLevel, this.maze.wallSize);

    this.addPlayer();
    this.addBibleBox();
    this.addInstructions();
  }

  initCannon() {
    this.cannon = new CANNON.World();
    this.cannon.broadphase = new CANNON.SAPBroadphase(this.cannon);
    this.cannon.gravity = new CANNON.Vec3(0, -9.82, 0);
  }

  initCannonDebugger() {
    this.cannonDebugger = new CannonDebugger(this.scene, this.cannon, {
      // options...
    });
  }

  addCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    );
    this.camera.position.set(1, 1.5, 1);
    this.camera.lookAt(new THREE.Vector3(1, 0, 1));
  }

  addLight() {
    this.light = new THREE.PointLight("#ffffff", 2, 5);
    this.light.position.set(0, 0.65, 0);
    this.scene.add(this.light);
  }

  addFloor() {
    const texture = this.resources.items.floor;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);

    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    this.groundMesh = new THREE.Mesh(geometry, material);
    this.groundMesh.rotation.x = -Math.PI * 0.5; // make it face up
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    this.groundBody.quaternion.setFromEuler(-Math.PI * 0.5, 0, 0); // make it face up
    this.cannon.addBody(this.groundBody);
  }

  addPlayer() {
    const texture = this.resources.items.glitch_baked;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });

    this.playerMesh = this.resources.items.glitch.scene;
    this.playerMesh.traverse((child) => {
      child.material = material;
    });

    this.playerMesh.position.x = this.maze.entrancePosition[0];
    this.playerMesh.position.y = this.maze.wallSize;
    this.playerMesh.position.z = this.maze.entrancePosition[1];
    this.playerMesh.rotation.x = -Math.PI / 4;
    this.scene.add(this.playerMesh);

    const boundingBox = new THREE.Box3().setFromObject(this.playerMesh);
    const center = new THREE.Vector3();
    const sphere = new THREE.Sphere(center);
    const bbsphere = boundingBox.getBoundingSphere(sphere);

    const shape = new CANNON.Sphere(bbsphere.radius / 2);
    this.playerBody = new CANNON.Body({
      mass: 1,
      shape,
      linearDamping: 0.25,
      angularDamping: 1,
    });
    this.playerBody.position.copy(this.playerMesh.position);
    this.cannon.addBody(this.playerBody);
  }

  addBibleBox() {
    const texture = this.resources.items.mazeBoxBaked;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    this.bibleBoxMesh = this.resources.items.mazeBox.scene;
    this.bibleBoxMesh.traverse((child) => {
      child.material = material;
    });

    this.bibleBoxAnimation = {};
    this.bibleBoxAnimation.mixer = new THREE.AnimationMixer(this.bibleBoxMesh);

    this.bibleBoxAnimation.actions = {};
    this.bibleBoxAnimation.actions.open =
      this.bibleBoxAnimation.mixer.clipAction(
        this.resources.items.mazeBox.animations[1]
      );

    this.bibleBoxAnimation.actions.open.setLoop(THREE.LoopOnce);

    this.bibleBoxMesh.position.x = this.maze.exitPosition[0];
    this.bibleBoxMesh.position.y = 0.15;
    this.bibleBoxMesh.position.z = this.maze.exitPosition[1];
    this.scene.add(this.bibleBoxMesh);

    const shape = new CANNON.Sphere(0.2);
    this.bibleBoxBody = new CANNON.Body({
      mass: 0,
      shape,
      isTrigger: true,
    });
    this.bibleBoxBody.position.copy(this.bibleBoxMesh.position);
    this.cannon.addBody(this.bibleBoxBody);
  }

  addMaze(idx, wallSize) {
    const geometries = [];

    this.mazeBody = new CANNON.Body({ mass: 0 });

    mazeArr[idx].forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell == 1) {
          const dummy = new THREE.BoxGeometry(wallSize, wallSize, wallSize);
          dummy.translate(c * wallSize, wallSize * 0.5, r * wallSize);
          geometries.push(dummy);

          const shape = new CANNON.Box(
            new CANNON.Vec3(wallSize * 0.5, wallSize * 0.5, wallSize * 0.5)
          );
          this.mazeBody.addShape(
            shape,
            new CANNON.Vec3(c * wallSize, wallSize * 0.5, r * wallSize)
          );
        }

        if (cell == 2) {
          const shape = new CANNON.Box(
            new CANNON.Vec3(wallSize * 0.5, wallSize * 0.5, wallSize * 0.5)
          );
          // If entrance on left
          if (c == 0) {
            this.mazeBody.addShape(
              shape,
              new CANNON.Vec3(
                c * wallSize - wallSize,
                wallSize * 0.5,
                r * wallSize
              )
            );
          }

          // If entrance on top
          if (r == 0) {
            this.mazeBody.addShape(
              shape,
              new CANNON.Vec3(
                c * wallSize,
                wallSize * 0.5,
                r * wallSize - wallSize
              )
            );
          }

          // If entrance on bottom
          if (r == row.length - 1) {
            this.mazeBody.addShape(
              shape,
              new CANNON.Vec3(
                c * wallSize,
                wallSize * 0.5,
                r * wallSize + wallSize
              )
            );
          }

          // If entrance on right
          if (c == row.length - 1) {
            this.mazeBody.addShape(
              shape,
              new CANNON.Vec3(
                c * wallSize + wallSize,
                wallSize * 0.5,
                r * wallSize
              )
            );
          }

          this.maze.entrancePosition = [c * wallSize, r * wallSize];
        }

        if (cell == 3) {
          this.maze.exitPosition = [c * wallSize, r * wallSize];
        }
      });
    });

    const texture = this.resources.items.cubeMapTop;
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const geometry = BufferGeometryUtils.mergeGeometries(geometries, true);
    this.mazeMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mazeMesh);

    this.mazeBody.position.copy(this.mazeMesh.position);
    this.cannon.addBody(this.mazeBody);
  }

  addRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document
      .querySelector("#maze-canvas")
      .appendChild(this.renderer.domElement);
    this.renderer.domElement.classList.add("maze-webgl");
  }

  resize() {
    if (document.querySelector("#maze-canvas")) {
      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.sizes.width, this.sizes.height);
      this.renderer.setPixelRatio(this.sizes.pixelRatio);
    }
  }

  destroy() {
    instance.timer?.destroy();
    document.querySelector(".game")?.remove();
    instance.experience.gameIsOn = false;

    instance.experience.navigation.next.classList.add("focused");
    instance.experience.navigation.next.innerHTML =
      instance.experience.icons.next;
  }

  disposeLevelAssets() {
    // Traverse the whole scene
    this.scene.traverse((child) => {
      // Test if it's a mesh
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        // Loop through the material properties
        for (const key in child.material) {
          const value = child.material[key];

          // Test if there is a dispose function
          if (value && typeof value.dispose === "function") {
            value.dispose();
          }
        }
      }
    });

    this.renderer.dispose();

    document.querySelector(".maze-webgl")?.remove();
  }

  updateWorld() {
    const elapsedTime = clock.getElapsedTime();

    if (bibleBox) this.cannon.removeBody(bibleBox);

    this.cannon.fixedStep();
    // this.cannonDebugger.update();

    this.playerMesh.position.copy(this.playerBody.position);

    this.bibleBoxMesh.rotation.y = elapsedTime;

    this.player.localVelocity.set(
      this.player.moveDistance * 0.2,
      0,
      this.player.moveDistance * 0.2
    );
    const cannonVelocity = this.playerBody.quaternion.vmult(
      this.player.localVelocity
    );

    if (keys.arrowleft || keys.a) {
      this.playerBody.velocity.x = -cannonVelocity.x;
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(-90)
      );
    }

    if (keys.arrowright || keys.d) {
      this.playerBody.velocity.x = cannonVelocity.x;
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(90)
      );
    }

    if (keys.arrowup || keys.w) {
      this.playerBody.velocity.z = -cannonVelocity.z;
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(180)
      );
    }

    if (keys.arrowdown || keys.s) {
      this.playerBody.velocity.z = cannonVelocity.z;
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(0)
      );
    }

    if ((keys.arrowleft && keys.arrowup) || (keys.a && keys.w)) {
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(225)
      );
    }

    if ((keys.arrowright && keys.arrowup) || (keys.d && keys.w)) {
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(135)
      );
    }

    if ((keys.arrowleft && keys.arrowdown) || (keys.a && keys.s)) {
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(-45)
      );
    }

    if ((keys.arrowright && keys.arrowdown) || (keys.d && keys.s)) {
      q.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).normalize(),
        THREE.MathUtils.degToRad(45)
      );
    }

    this.playerMesh.quaternion.slerp(q, 0.2);

    this.camera.position.x = this.playerMesh.position.x;
    this.camera.position.z = this.playerMesh.position.z;

    this.light.position.x = this.playerMesh.position.x;
    this.light.position.z = this.playerMesh.position.z;
  }

  endLevel() {
    instance.timer?.destroy();

    if (this.options.gameState == "congrats") {
      this.options.gameLevel++;
      document.querySelector(".game-popup h1").textContent =
        _s.miniGames.completed.title;
      document.querySelector(".game-popup button").textContent =
        _s.miniGames.nextRound;
    } else if (this.options.gameState == "repeat") {
      document.querySelector(".game-popup h1").textContent =
        _s.miniGames.timeElapsed.title;
      document.querySelector(".game-popup button").textContent =
        _s.miniGames.playAgain;
    } else if (this.options.gameState == "end game") {
      this.options.gameLevel++;

      document.querySelector(".game-popup h1").textContent =
        _s.miniGames.completed.title;
      document.querySelector(".game-popup button").textContent =
        _s.miniGames.nextRound;

      document.querySelector("#new-level")?.classList.remove("focused");
      instance.experience.navigation.container.style.display = "flex";
      instance.experience.navigation.next.classList.add("focused");
      instance.experience.navigation.next.classList.remove("less-focused");
      instance.experience.navigation.next.innerHTML =
        instance.experience.icons.next;

      if (this.options.gameLevel == mazeArr.length - 1)
        this.options.gameLevel = 1;
    }

    setTimeout(() => {
      document.querySelector(".maze-game").classList.add("popup-visible");
      document.querySelector(".game-popup").style.display = "block";
    }, 500);
  }

  onTimeElapsed() {
    instance.options.gameState = "fade out";
    instance.options.gameRepeat = true;
  }

  checkCollision() {
    this.bibleBoxBody.addEventListener("collide", (event) => {
      if (event.body === this.playerBody) {
        bibleBox = event.body;
        this.options.gameState = "fade out";
      }
    });
  }

  endAnimation() {
    this.bibleBoxAnimation.actions.open.play();

    this.bibleBoxAnimation.mixer.addEventListener("finished", (e) => {
      new TWEEN.Tween(instance.mazeMesh.position)
        .to({ y: -0.5 }, 300)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

      new TWEEN.Tween(instance.bibleBoxMesh.scale)
        .to({ x: 0, y: 0, z: 0 }, 300)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
          if (this.options.gameRepeat) {
            this.options.gameState = "repeat";
            this.options.gameRepeat = false;
          } else {
            // If player wants to play more than 5 levels
            if (this.options.gameLevel < this.options.gameLevels) {
              this.options.gameState = "congrats";
            } else {
              this.options.gameState = "end game";
            }
          }
        })
        .start();
    });
  }

  update() {
    if (this.options.gameState)
      switch (this.options.gameState) {
        case "initialize":
          // Setup
          this.initCannon();
          this.initScene();
          this.startTimer();
          this.initCannonDebugger();
          this.checkCollision();
          this.endAnimation();

          this.light.intensity = 0;
          this.bibleBoxMesh.scale.set(1, 1, 1);

          document
            .querySelector(".maze-game")
            .classList.remove("popup-visible");
          document.querySelector(".game-popup").style.display = "none";

          if (this.options.gameLevel < this.options.gameLevels) {
            // Main 5 levels
            document.querySelector(".game-rounds").innerHTML = `
            ${_s.miniGames.level} ${this.options.gameLevel + 1} / 5`;
          } else {
            // Extra levels levels
            document.querySelector(".game-rounds").innerHTML = `
            ${_s.miniGames.level} ${this.options.gameLevel + 1}`;
          }
          this.options.gameState = "fade in";
          break;

        case "fade in":
          this.updateWorld();

          this.light.intensity += 0.1 * (1.0 - this.light.intensity);
          if (Math.abs(this.light.intensity - 1.0) < 0.05) {
            this.light.intensity = 1.0;
            this.options.gameState = "play";
          }

          this.renderer.render(this.scene, this.camera);
          break;

        case "play":
          this.updateWorld();

          if (this.timerWithTimeElapsed()) this.onTimeElapsed();

          this.renderer.render(this.scene, this.camera);
          break;

        case "fade out":
          this.updateWorld();

          this.light.intensity += 0.1 * (0.0 - this.light.intensity);

          if (Math.abs(this.light.intensity - 0.0) < 0.1) {
            this.light.intensity = 0.2;
          }

          TWEEN.update();
          this.bibleBoxAnimation.mixer.update(this.time.delta * 0.005);

          this.endLevel();

          this.renderer.render(this.scene, this.camera);
          break;
      }
  }
}

const mazeArr = [
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [2, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 3],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 3],
    [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    [2, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 3],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [2, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [2, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 3],
    [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
    [2, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

// Movement keys
let keys = {
  arrowleft: false,
  arrowdown: false,
  arrowright: false,
  arrowup: false,
  a: false,
  s: false,
  d: false,
  w: false,
};

document.body.addEventListener("keydown", (e) => {
  const key = e.code.replace("Key", "").toLowerCase();
  if (keys[key] !== undefined) keys[key] = true;
});

document.body.addEventListener("keyup", (e) => {
  const key = e.code.replace("Key", "").toLowerCase();
  if (keys[key] !== undefined) keys[key] = false;
});
