import Experience from '../Experience.js'
import _e from '../Utils/Events.js'

let instance = null

export default class ProgressBar {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.program = instance.experience.world.program

        instance.init()
        instance.setEventListeners()
    }

    init() {
        instance.checkpointWidth = 100 / instance.program.totalCheckpoints

        instance.htmlEl = document.querySelector('.progress-bar')
        instance.htmlEl.innerHTML = ProgressBar.HTML()

        instance.el = {
            passed: instance.htmlEl.querySelector('.percentageBar .passed'),
            checkpoints: instance.htmlEl.querySelectorAll("[aria-label='checkpoint']:not(:last-child)"),
        }

        instance.el.checkpoints.forEach(function (checkpoint, index) {
            checkpoint.addEventListener('click', () => {
                let clickedCheckpoint = checkpoint.getAttribute('data-index')
                instance.program.goToCheckpoint(clickedCheckpoint)
            })

            if (index == instance.program.currentCheckpoint) checkpoint.setAttribute('currentCheckpoint', '')
        })
    }

    show() {
        instance.htmlEl.classList.add('is-visible')
    }

    hide() {
        instance.htmlEl.classList.remove('is-visible')
    }

    refresh() {
        instance.el.passed.style.width = instance.checkpointWidth * instance.program.currentCheckpoint + '%'

        instance.el.checkpoints.forEach((checkpoint) => {
            checkpoint.removeAttribute('currentCheckpoint')
        })

        if (instance.program.currentCheckpoint < instance.el.checkpoints.length) {
            instance.el.checkpoints[instance.program.currentCheckpoint].classList.remove('locked')
            instance.el.checkpoints[instance.program.currentCheckpoint].setAttribute('currentCheckpoint', '')
        }
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.refresh)
    }

    static HTML() {
        let generatedHTML = `<div class="percentageBar transition">
                <div class="passed" style="width: ${instance.checkpointWidth * instance.program.currentCheckpoint}%"></div>
            </div>
            <div class="checkpoints">`

        for (let i = 0; i < instance.program.totalCheckpoints; i++) {
            if (instance.program.programData[i].steps.some((step) => step.details.step_type == 'video')) {
                generatedHTML += `<button class="button-round focused" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-4 w-4"><use href="#film-solid" fill="currentColor"></use></svg>
                          </button>`
            } else if (instance.program.programData[i].steps.some((step) => step.details.step_type == 'quiz')) {
                generatedHTML += `<button class="button-round focused" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-4 w-4"><use href="#question-solid" fill="currentColor"></use></svg>
                          </button>`
            } else if (instance.program.programData[i].steps.some((step) => step.details.step_type == 'pause')) {
                generatedHTML += `<button class="button-round focused" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-4 w-4"><use href="#pause-solid" fill="currentColor"></use></svg
                          </button>`
            } else {
                generatedHTML += `<button class="button-round focused" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-4 w-4"><use href="#pen-to-square-solid" fill="currentColor"></use></svg
                          </button>`
            }
        }

        generatedHTML += `<button class="button-round focused" aria-label="checkpoint">
                          <svg class="h-4 w-4"><use href="#star-solid" fill="currentColor"></use></svg
                      </button>
                  </div>`

        return generatedHTML
    }
}
