import Experience from "../Experience.js"

let info = null

export default class Info {
    constructor() {
        this.tooltips = {
            "video": "Se på video",
            "iris": "Hør på oppgavebeskrivelse fra Iris",
            "task": "Fulfør oppgaven",
        }

        this.experience = new Experience()
        this.world = this.experience.world
        this.program = this.world.program

        info = this

        this.htmlEl = document.createElement("div");
        this.htmlEl.setAttribute("id", "info");
        this.htmlEl.addEventListener("click", this.toggleInfo);
        this.htmlEl.addEventListener("mouseenter", this.getInfo);
        this.htmlEl.addEventListener("mouseout", this.removeInfo);

        document.body.appendChild(this.htmlEl);
    }

    toggleInfo() {
        info.htmlEl.innerHTML
            ? info.removeInfo()
            : info.getInfo()
    }

    getInfo() {
        info.htmlEl.innerHTML = `<div class="tooltip">
            <div class="tooltip__title">Info:</div>
            <div class="tooltip__content">${ info.tooltips[info.program.stepType()] }</div>
        </div>`;
    }

    removeInfo() {
        info.htmlEl.innerHTML = '';
    }
}