import Experience from "../Experience.js"
import data from "../Progress/episode-1.json";

let info = null

export default class Info {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.program = this.world.program

        this.htmlEl = document.createElement("div");
        this.htmlEl.setAttribute("id", "info");
        this.htmlEl.addEventListener("click", this.toggleInfo);
        this.htmlEl.addEventListener("mouseenter", this.getInfo);
        this.htmlEl.addEventListener("mouseout", this.removeInfo);
        info = this

        document.body.appendChild(this.htmlEl);
    }

    toggleInfo() {
        info.htmlEl.innerHTML
            ? info.removeInfo()
            : info.getInfo()
    }

    getInfo() {
        console.log(info.program.currentStep)
        info.htmlEl.innerHTML = `<div class="tooltip">
            <div class="tooltip__title">Info:</div>
            <div class="tooltip__content">${ data.steps[info.program.currentStep].info }</div>
        </div>`;
    }

    removeInfo() {
        info.htmlEl.innerHTML = '';
    }
}