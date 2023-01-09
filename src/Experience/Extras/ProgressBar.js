import Experience from "../Experience.js"

let instance = null

export default class ProgressBar {
    constructor() {
        this.experience = new Experience()
        this.debug = this.experience.debug
        instance = this

        this.program = this.experience.world.program
        this.checkpointWidth = 100 / this.program.totalCheckpoints;

        instance.htmlEl = document.querySelector("#progress-bar");
        instance.htmlEl.innerHTML = ProgressBar.generateHtml();

        instance.el = {
            passed: instance.htmlEl.querySelector(".progress-bar__percentage .passed"),
            checkpoints: instance.htmlEl.querySelectorAll(".progress-bar__checkpoint:not(:last-child)")
        };

        instance.el.checkpoints.forEach(function (checkpoint, index) {
            checkpoint.addEventListener("click", () => {
                let clickedCheckpoint = checkpoint.getAttribute('data-index')
                if (instance.debug.developer || instance.debug.onQuickLook() || clickedCheckpoint <= instance.program.chapterProgress())
                    instance.program.advance(clickedCheckpoint)
            })

            if (index == instance.program.currentCheckpoint)
                checkpoint.setAttribute('currentCheckpoint', '')
        });
    }

    refresh() {
        instance.el.passed.style.width = instance.checkpointWidth * instance.program.currentCheckpoint + '%';

        instance.el.checkpoints.forEach(checkpoint => {
            checkpoint.removeAttribute('currentCheckpoint')
        })

        if (instance.program.currentCheckpoint < instance.el.checkpoints.length) {
            instance.el.checkpoints[instance.program.currentCheckpoint].classList.remove('locked')
            instance.el.checkpoints[instance.program.currentCheckpoint].setAttribute('currentCheckpoint', '')
        }
    }

    static generateHtml() {
        let html = '<div class="progress-bar__checkpoints">'
        for (let i = 0; i < instance.program.totalCheckpoints; i++) {
            let taskTypeClass = 'icon-pen-to-square-solid'

            if (instance.program.programData[i].steps.some(step => step.details.step_type == 'video'))
                taskTypeClass = 'icon-film-solid'
            else if (instance.program.programData[i].steps.some(step => step.details.step_type == 'quiz'))
                taskTypeClass = 'icon-question-solid'
            else if (instance.program.programData[i].steps.some(step => step.details.step_type == 'pause'))
                taskTypeClass = 'icon-pause-solid'

            html += `<div class="progress-bar__checkpoint ${i > instance.program.chapterProgress() ? 'locked' : ''} ${taskTypeClass}" data-index="${i}" ></div>`
        }
        html += `<div class="progress-bar__checkpoint">#</div>`

        html += `</div>
            <div class="progress-bar__percentage">
                <div class="passed" style="width: ${instance.checkpointWidth * instance.program.currentCheckpoint}%"></div>
            </div>
        `;

        return html;
    }
}