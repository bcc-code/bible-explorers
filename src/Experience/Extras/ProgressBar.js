import Experience from "../Experience.js"

let instance = null

export default class ProgressBar {
    constructor() {
        this.experience = new Experience()
        this.debug = this.experience.debug
        instance = this

        this.program = this.experience.world.program
        this.checkpointWidth = 100 / this.program.totalCheckpoints;

        instance.htmlEl = document.querySelector(".progress-bar");
        instance.htmlEl.innerHTML = ProgressBar.HTML()

        instance.el = {
            passed: instance.htmlEl.querySelector(".percentageBar .passed"),
            checkpoints: instance.htmlEl.querySelectorAll("[aria-label='checkpoint']:not(:last-child)")
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

    elementFromHtml(html) {
        const template = document.createElement('template')

        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    refresh() {
        instance.el.passed.style.width = instance.checkpointWidth * instance.program.currentCheckpoint + '%';

        instance.el.checkpoints.forEach(checkpoint => {
            checkpoint.removeAttribute('currentCheckpoint')
        })

        console.log(instance.program.currentCheckpoint);

        if (instance.program.currentCheckpoint < instance.el.checkpoints.length) {
            instance.el.checkpoints[instance.program.currentCheckpoint].classList.remove('locked')
            instance.el.checkpoints[instance.program.currentCheckpoint].setAttribute('currentCheckpoint', '')
        }
    }

    static HTML() {

        let generatedHTML =
            `<div class="percentageBar">
                <div class="passed" style="width: ${instance.checkpointWidth * instance.program.currentCheckpoint}%"></div>
            </div>
            <div class="checkpoints">`

        for (let i = 0; i < instance.program.totalCheckpoints; i++) {
            let taskTypeClass = 'icon-pen-to-square-solid'

            if (instance.program.programData[i].steps.some(step => step.details.step_type == 'video'))
                taskTypeClass = 'icon-film-solid'
            else if (instance.program.programData[i].steps.some(step => step.details.step_type == 'quiz'))
                taskTypeClass = 'icon-question-solid'
            else if (instance.program.programData[i].steps.some(step => step.details.step_type == 'pause'))
                taskTypeClass = 'icon-pause-solid'

            generatedHTML +=
                `<button class="btn bordered rounded ${i > instance.program.chapterProgress() ? 'locked' : ''}" aria-label="checkpoint" data-index="${i}">
                    <div class="${taskTypeClass}"></div>
                </button>`

        }

        generatedHTML +=
            `<button class="btn bordered rounded" aria-label="checkpoint">
                <div class="icon-star-solid"></div>
            </button>`

        generatedHTML += '</div>'


        return generatedHTML

    }

    hide() {
        instance.htmlEl.classList.remove('is-visible')
    }

    show() {
        instance.htmlEl.classList.add('is-visible')
    }
}