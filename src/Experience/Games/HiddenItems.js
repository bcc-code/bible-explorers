import Experience from "../Experience.js";
import _s from "../Utils/Strings.js";
import _lang from "../Utils/Lang.js";
import _api from "../Utils/Api.js";
import _gl from "../Utils/Globals.js";
import _e from "../Utils/Events.js";

let instance = null;
const circleSize = 96;
export default class HiddenItems {
  constructor() {
    instance = this;

    instance.experience = new Experience();
    instance.debug = instance.experience.debug;
  }

  togglePictureAndCode() {
    instance.world = instance.experience.world;
    instance.offline = instance.world.offline;
    instance.program = instance.world.program;
    instance.selectedChapter = instance.world.selectedChapter;
    instance.stepData = instance.program.getCurrentStepData();
    instance.data = instance.stepData.picture_and_code;
    instance.circlesVisible =
      instance.program.gamesData.pictureAndCode.circles.length;
    instance.lastKnownScrollPosition = 0;

    instance.togglePicture();
    instance.setEventListeners();
  }

  togglePicture() {
    instance.offline.fetchChapterAsset(instance.data, "picture", (data) =>
      instance.setPicture(data.picture)
    );

    const game = _gl.elementFromHtml(`
            <section class="game hidden-items">
                <div class="container">
                    <div class="box">
                        <img class="lazyload">
                        <div class="img-loader"></div>
                    </div>
                </div>
                <div class="overlay"></div>
            </section>`);

    document.querySelector(".ui-container").append(game);

    instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    instance.experience.navigation.next.classList.add("less-focused");
    instance.experience.navigation.container.style.display = "flex";
  }

  setEventListeners() {
    document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy);

    if (instance.circlesVisible == 4) {
      instance.experience.navigation.container.style.display = "flex";
      instance.experience.navigation.next.classList.add("focused");
      instance.experience.navigation.next.innerHTML =
        instance.experience.icons.next;
    } else {
      instance.experience.navigation.next.classList.remove("focused");
      instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    }

    instance.addExistingCircles();

    document
      .querySelector(".hidden-items .box")
      .addEventListener("scroll", (e) => {
        instance.lastKnownScrollPosition = e.target.scrollTop;
      });

    document
      .querySelector(".hidden-items .box")
      .addEventListener("click", instance.addCirclesOnClick);
  }

  setPicture(url) {
    instance.data.picture = url;
    document
      .querySelector(".hidden-items img")
      .setAttribute("data-src", instance.data.picture);
  }

  addExistingCircles() {
    instance.program.gamesData.pictureAndCode.circles.forEach((circle) =>
      instance.addCircle(circle.x, circle.y)
    );
  }

  newScrollPosition(scrollPos) {
    return scrollPos;
  }

  addCirclesOnClick(event) {
    const maxCirclesToAdd = 4;

    if (event.target.classList.contains("circle")) {
      instance.removeCircle(event);
      instance.circlesVisible--;
    } else if (instance.circlesVisible < maxCirclesToAdd) {
      instance.addCircle(event.x, event.y + instance.lastKnownScrollPosition);
      instance.program.gamesData.pictureAndCode.circles.push({
        x: event.x,
        y: event.y + instance.lastKnownScrollPosition,
      });
      instance.circlesVisible++;
    }

    if (instance.circlesVisible == maxCirclesToAdd) {
      instance.experience.navigation.container.style.display = "flex";
      instance.experience.navigation.next.classList.add("focused");
      instance.experience.navigation.next.innerHTML =
        instance.experience.icons.next;
    } else {
      instance.experience.navigation.next.classList.remove("focused");
      instance.experience.navigation.next.innerHTML = _s.miniGames.skip;
    }
  }

  addCircle = (x, y) => {
    const el = _gl.elementFromHtml(`<div class="circle"></div>`);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.querySelector(".hidden-items .box").appendChild(el);
  };

  removeCircle = (mouseClick) => {
    mouseClick.target.remove();
    const index = instance.program.gamesData.pictureAndCode.circles.findIndex(
      (circle) => instance.intersected(mouseClick, circle)
    );
    instance.program.gamesData.pictureAndCode.circles.splice(index, 1);
  };

  intersected(r1, r2) {
    return !(
      r2.x > r1.x + circleSize ||
      r2.x + circleSize < r1.x ||
      r2.y > r1.y + circleSize ||
      r2.y + circleSize < r1.y
    );
  }

  destroy() {
    document.querySelector(".game")?.remove();

    instance.experience.navigation.next.classList.add("focused");
    instance.experience.navigation.next.classList.remove("less-focused");
    instance.experience.navigation.next.innerHTML =
      instance.experience.icons.next;
  }
}
