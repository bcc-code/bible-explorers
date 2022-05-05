import Experience from "../Experience.js"

let instance = null

export default class ProgressBar {
    constructor() {
        instance = this

        this.experience = new Experience()
        this.program = this.experience.world.program
        this.stepWidth = 100 / this.program.totalSteps;

        instance.htmlEl = document.querySelector("#progress-bar");
        instance.htmlEl.innerHTML = ProgressBar.generateHtml();

        instance.el = {
            passed: instance.htmlEl.querySelector(".progress-bar__percentage .passed"),
            steps: instance.htmlEl.querySelectorAll(".progress-bar__step:not(:last-child)")
        };

        instance.el.steps.forEach(function(step) {
            step.addEventListener("click", () => {
                let clickedStep = step.innerText - 1
                if (clickedStep <= instance.program.chapterProgress())
                    instance.program.advance(clickedStep)
            })
        });
    }

    refresh() {
        instance.el.passed.style.width = instance.stepWidth * instance.program.currentStep + '%';
        if (instance.program.currentStep < instance.el.steps.length)
            instance.el.steps[instance.program.currentStep].classList.remove('locked')
    }

    static generateHtml() {
        var leftAdjustment = 21;
        let html = '<div class="progress-bar__steps">'
            for (let i = 0; i < instance.program.totalSteps; i++) {
                var left = 'calc(' + i * instance.stepWidth + '% - ' + leftAdjustment + 'px)';
                html += `<div class="progress-bar__step ${ i > instance.program.chapterProgress() ? 'locked' : '' }" style="left: ${ left }">${ i+1 }</div>`
            }
            html += `<div class="progress-bar__step" style="left: calc(100% - ${ leftAdjustment }px)">#</div>`

        html += `</div>
            <div class="progress-bar__percentage">
                <div class="passed" style="width: ${ instance.stepWidth * instance.program.currentStep }%"></div>
            </div>
        `;

        return html;
    }
}