import gsap from "gsap";
import Offline from "../Utils/Offline.js";
import Experience from "../Experience.js";
import _s from "../Utils/Strings.js";
import _gl from "../Utils/Globals.js";
import _e from "../Utils/Events.js";

let instance = null;

export default class DavidsRefuge {
  constructor() {
    instance = this;
    instance.offline = new Offline();
    instance.experience = new Experience();
    instance.world = instance.experience.world;
    instance.audio = instance.world.audio;
    instance.debug = instance.experience.debug;
  }

  toggleGame() {
    instance.program = instance.world.program;
    instance.stepData = instance.program.getCurrentStepData();
    instance.data = instance.stepData.davids_refuge;

    instance.gameHTML();
    instance.useCorrectAssetsSrc();

    if (instance.data.hints.length > 0) instance.hintsHTML();

    instance.setEventListeners();
  }

  gameHTML() {
    const game = _gl.elementFromHtml(`
            <section class="game davids-refuge">
                <div class="container">
                    <div class="goats"></div>
                    <button class="btn default" aria-label="select goat" disabled><span>${_s.miniGames.davidsRefuge.chooseGoat}</span></button>
                </div>
                <div class="overlay"></div>
            </section>
        `);

    document.querySelector(".ui-container").append(game);

    instance.data.characters.forEach((goat) => {
      const url = goat.image.split("/");
      const fileName = url[url.length - 1].replace("goat-", "");
      const color = fileName.split(".")[0];

      const item = _gl.elementFromHtml(`
                <article class="goat" data-color="${color}">
                    <p class="tooltip top">${goat.text}</p>
                    <picture>
                        <source srcset="${goat.image}">
                        <img src="${goat.image}"/>
                    </picture>
                </article>
            `);

      game.querySelector(".goats").append(item);

      gsap.to(item, { scale: 0.85 });

      if (color === "blue") {
        gsap.set(item, { x: "-100%" });
      } else if (color === "yellow") {
        gsap.set(item, { x: "100%" });
      }
    });

    instance.experience.navigation.next.classList.remove("focused");

    if (instance.debug.developer || instance.debug.onPreviewMode()) {
      instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
      instance.experience.navigation.next.classList.add("less-focused");
      instance.experience.navigation.container.style.display = "flex";
    } else {
      instance.experience.navigation.container.style.display = "none";
    }
  }

  useCorrectAssetsSrc() {
    instance.data.characters.forEach((character, index) => {
      instance.offline.fetchChapterAsset(character, "image", (data) => {
        document.querySelectorAll("article.goat img")[index].src = data.image;
      });
    });
  }

  hintsHTML() {
    if (!instance.data.hints.length) return;

    const hints = _gl.elementFromHtml(`
            <aside class="hints">
                <h4>Hints</h4>
                <ul>
                    <li>${instance.data.hints[0].text}</li>
                </ul>
                <button class="btn default next">Get more hints</button>
            </aside>
        `);

    const hintsToggle = _gl.elementFromHtml(`
            <button class="btn rounded" aria-label="toggle hints">
                <svg class="question-icon icon" width="15" height="22" viewBox="0 0 15 22">
                    <use href="#question-mark"></use>
                </svg>
            </button>
        `);

    document
      .querySelector(".davids-refuge .container")
      .append(hintsToggle, hints);

    const hintsList = hints.querySelector("ul");

    gsap.set(hints, { scale: 0, autoAlpha: 0, transformOrigin: "top left" });

    const showHints = gsap
      .timeline({ paused: true })
      .to(hints, { scale: 1, autoAlpha: 1 });

    hintsToggle.addEventListener("click", () => {
      hints.style.opacity === "0" ? showHints.play() : showHints.reverse();
    });

    document.addEventListener("click", (event) => {
      if (
        !hints.contains(event.target) &&
        !hintsToggle.contains(event.target) &&
        !getHint.contains(event.target)
      )
        showHints.reverse();
    });

    let index = 1;

    const getHint = hints.querySelector("button");
    getHint.addEventListener("click", () => {
      if (index < instance.data.hints.length) {
        const hint = _gl.elementFromHtml(
          `<li>${instance.data.hints[index].text}</li>`
        );
        hintsList.appendChild(hint);
      }

      if (++index == instance.data.hints.length) getHint.remove();
    });
  }

  setEventListeners() {
    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);

    // Goat selection
    const selectGoat = document.querySelector('[aria-label="select goat"]');

    gsap.utils.toArray(".goat").forEach((item, index) => {
      const q = gsap.utils.selector(item);
      const tooltip = q(".tooltip");

      item.addEventListener("click", () => {
        selectGoat.disabled = false;

        if (item.classList.contains("is-active")) return;
        document.querySelectorAll(".goat").forEach((goat) => {
          goat.classList.remove("is-active");
          gsap.to(goat, { scale: 0.85 });
        });

        item.classList.add("is-active");
        gsap.to(item, { scale: 1 });
      });

      selectGoat.addEventListener("click", () => {
        if (item.classList.contains("is-active")) {
          item.classList.add("is-selected");
          gsap.to(item, { x: "-50%" });

          tooltip[0].className = "tooltip right";

          if (instance.data.characters[index].tells_the_truth) {
            tooltip[0].innerText = instance.data.correct_character_message;

            instance.audio.playSound("correct");
            instance.experience.celebrate({
              particleCount: 100,
              spread: 160,
            });

            gsap.to(selectGoat, { autoAlpha: 0 });

            instance.experience.navigation.container.style.display = "flex";
            instance.experience.navigation.next.classList.add("focused");
            instance.experience.navigation.next.innerHTML =
              instance.experience.icons.next;
          } else {
            tooltip[0].innerText = instance.data.wrong_character_message;

            selectGoat.innerText = _s.miniGames.tryAgain;
            selectGoat.addEventListener("click", () => {
              instance.destroy();
              instance.toggleGame();
            });
          }
        } else {
          item.remove();
        }
      });
    });
  }

  toggleQuestion() {
    const overlay = document.createElement("div");
    overlay.setAttribute("id", "overlay");

    const message = this.messageModal(instance.data.start_message);
    document.body.append(overlay, message);

    gsap.to("#dialogue", { y: 0, autoAlpha: 1 });
  }

  destroy() {
    document.querySelector(".game")?.remove();

    instance.experience.navigation.next.classList.add("focused");
    instance.experience.navigation.next.innerHTML =
      instance.experience.icons.next;
  }
}
