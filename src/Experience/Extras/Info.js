import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'

let info = null

export default class Info {
    constructor() {
        if (info)
            return info

        this.experience = new Experience()
        this.world = this.experience.world
        this.program = this.world.program

        info = this

        this.htmlEl = document.getElementById("info");
        this.htmlEl.addEventListener("click", this.toggleInfo);
        // this.htmlEl.addEventListener("mouseenter", this.getInfo);
        // this.htmlEl.addEventListener("mouseout", this.removeInfo);
    }

    toggleInfo() {
        info.htmlEl.innerHTML
            ? info.removeInfo()
            : info.getInfo()
    }

    getInfo() {
        info.htmlEl.innerHTML = `<div class="tooltip">
            <div class="tooltip__title">${ _s.info }:</div>
            <div class="tooltip__content">${ _s.tooltips[info.program.stepType()] }</div>
        </div>`;
    }

    removeInfo() {
        info.htmlEl.innerHTML = '';
    }
}