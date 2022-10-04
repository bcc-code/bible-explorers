import Experience from "../Experience.js"

let instance = null

export default class ProgressBar {
    constructor() {
        this.experience = new Experience()
        this.debug = this.experience.debug
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

        instance.el.steps.forEach(function (step, index) {
            step.addEventListener("click", () => {
                let clickedStep = step.innerText - 1
                if (instance.debug.developer || instance.debug.onQuickLook() || clickedStep <= instance.program.chapterProgress())
                    instance.program.advance(clickedStep)
            })

            if (index == instance.program.currentStep)
                step.setAttribute('currentStep', '')

        });

    }

    refresh() {
        instance.el.passed.style.width = instance.stepWidth * instance.program.currentStep + '%';

        instance.el.steps.forEach(step => {
            step.removeAttribute('currentStep')
        })

        if (instance.program.currentStep < instance.el.steps.length) {
            instance.el.steps[instance.program.currentStep].classList.remove('locked')
            instance.el.steps[instance.program.currentStep].setAttribute('currentStep', '')
        }
    }

    static generateHtml() {
        let html = '<div class="progress-bar__steps">'
        for (let i = 0; i < instance.program.totalSteps; i++) {
            html += `<div class="progress-bar__step ${i > instance.program.chapterProgress() ? 'locked' : ''}">${i + 1}</div>`
        }
        html += `<div class="progress-bar__step">#</div>`

        html += `</div>
            <div class="progress-bar__percentage">
                <div class="passed" style="width: ${instance.stepWidth * instance.program.currentStep}%"></div>
            </div>
        `;

        return html;
    }
}