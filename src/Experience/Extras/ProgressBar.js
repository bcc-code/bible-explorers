import Experience from "../Experience.js"

let progressBar = null

export default class ProgressBar {
    constructor() {
        this.experience = new Experience()
        this.program = this.experience.world.program
        this.stepWidth = 100 / this.program.totalSteps;
        progressBar = this

        progressBar.htmlEl = document.querySelector("#progress-bar");
        progressBar.htmlEl.innerHTML = ProgressBar.generateHtml();

        progressBar.el = {
            passed: progressBar.htmlEl.querySelector(".progress-bar__percentage .passed")
        };
    }

    refresh() {
        progressBar.el.passed.style.width = progressBar.stepWidth * progressBar.program.currentStep;
    }

    static generateHtml() {
        var leftAdjustment = 21;
        let html = '<div class="progress-bar__steps">'
            for (let i = 0; i < progressBar.program.totalSteps; i++) {
                var left = 'calc(' + i * progressBar.stepWidth + '% - ' + leftAdjustment + 'px)';
                html += `<div class="progress-bar__step" style="left: ${ left }">${ i+1 }</div>`
            }
            html += `<div class="progress-bar__step" style="left: calc(100% - ${ leftAdjustment }px)">#</div>`

        html += `</div>
            <div class="progress-bar__percentage">
                <div class="passed" style="width: ${ progressBar.stepWidth * progressBar.program.currentStep }%"></div>
            </div>
        `;

        return html;
    }
}