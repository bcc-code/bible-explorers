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

        instance.htmlEl = document.querySelector('#progress-bar')
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

    refresh() {
        instance.el.passed.style.width = instance.checkpointWidth * instance.program.currentCheckpoint + '%'

        instance.el.checkpoints.forEach((checkpoint) => {
            checkpoint.removeAttribute('currentCheckpoint')
            instance.htmlEl.setAttribute('data-checkpoint', '')
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
        let generatedHTML = `<div class="percentageBar bg-bke-purple h-1 w-full">
                <div class="passed bg-bke-orange w-0 h-full transition-[width]" style="width: ${instance.checkpointWidth * instance.program.currentCheckpoint}%"></div>
            </div>
            <div class="flex gap-4 xl:gap-6 tv:gap-8 -mx-6 -mt-6 tv:-mt-8">`

        for (let i = 0; i < instance.program.totalCheckpoints; i++) {
            if (instance.program.programData[i].steps.some((step) => step.details.step_type == 'video')) {
                generatedHTML += `<button class="button-normal duration-300" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#film-solid" fill="currentColor"></use></svg>
                          </button>`
            } else if (instance.program.programData[i].steps.some((step) => step.details.step_type == 'quiz')) {
                generatedHTML += `<button class="button-normal duration-300" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#question-solid" fill="currentColor"></use></svg>
                          </button>`
            } else if (instance.program.programData[i].steps.some((step) => step.details.step_type == 'pause')) {
                generatedHTML += `<button class="button-normal duration-300" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#pause-solid" fill="currentColor"></use></svg
                          </button>`
            } else {
                generatedHTML += `<button class="button-normal duration-300" aria-label="checkpoint" data-index="${i}">
                              <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#pen-to-square-solid" fill="currentColor"></use></svg
                          </button>`
            }
        }

        generatedHTML += `<button class="button-normal" aria-label="checkpoint">
                          <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#star-solid" fill="currentColor"></use></svg
                      </button>
                  </div>`

        return generatedHTML
    }
}
