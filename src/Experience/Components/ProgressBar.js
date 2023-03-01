import Experience from "../Experience.js"

let instance = null

export default class ProgressBar {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.program = instance.experience.world.program

        instance.init()
    }

    init() {
        instance.checkpointWidth = 100 / instance.program.totalCheckpoints

        instance.htmlEl = document.querySelector(".progress-bar")
        instance.htmlEl.innerHTML = ProgressBar.HTML()

        instance.el = {
            passed: instance.htmlEl.querySelector(".percentageBar .passed"),
            checkpoints: instance.htmlEl.querySelectorAll("[aria-label='checkpoint']:not(:last-child)")
        }

        instance.el.checkpoints.forEach(function (checkpoint, index) {
            checkpoint.addEventListener("click", () => {
                let clickedCheckpoint = checkpoint.getAttribute('data-index')

                if (instance.debug.developer || instance.debug.onQuickLook() || clickedCheckpoint <= instance.program.chapterProgress())
                    instance.program.goToCheckpoint(clickedCheckpoint)
            })

            if (index == instance.program.currentCheckpoint)
                checkpoint.setAttribute('currentCheckpoint', '')
        })
    }

    show() {
        instance.refresh()
        instance.htmlEl.classList.add('is-visible')
        document.querySelector('.cta').style.display = 'none'
    }

    hide() {
        instance.htmlEl.classList.remove('is-visible')
        document.querySelector('.cta').style.display = 'flex'
    }

    refresh() {
        instance.el.passed.style.width = instance.checkpointWidth * instance.program.currentCheckpoint + '%'

        instance.el.checkpoints.forEach(checkpoint => {
            checkpoint.removeAttribute('currentCheckpoint')
        })

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

            if (instance.program.programData[i].steps.some(step => step.details.step_type == 'video')) {
                generatedHTML +=
                    `<button class="btn rounded ${i > instance.program.chapterProgress() ? 'locked' : ''}" aria-label="checkpoint" data-index="${i}">
                        <svg class="film-icon icon"viewBox="0 0 24 22">
                            <use href="#film"></use>
                        </svg>
                    </button>`
            }
            else if (instance.program.programData[i].steps.some(step => step.details.step_type == 'quiz')) {
                generatedHTML +=
                    `<button class="btn rounded ${i > instance.program.chapterProgress() ? 'locked' : ''}" aria-label="checkpoint" data-index="${i}">
                        <svg class="question-mark-icon icon" viewBox="0 0 15 22">
                            <use href="#question-mark"></use>
                        </svg>
                    </button>`
            }
            else {
                generatedHTML +=
                    `<button class="btn rounded ${i > instance.program.chapterProgress() ? 'locked' : ''}" aria-label="checkpoint" data-index="${i}">
                    <svg class="task-icon icon" viewBox="0 0 25 25">
                        <use href="#pen-to-square"></use>
                    </svg>
                </button>`
            }
        }

        generatedHTML +=
            `<button class="btn rounded" aria-label="checkpoint">
                <svg class="star-icon icon" viewBox="0 0 25 25">
                    <use href="#star-full"></use>
                </svg>
            </button>`

        generatedHTML += '</div>'

        return generatedHTML
    }
}