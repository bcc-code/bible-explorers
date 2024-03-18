import Experience from '../Experience.js'
import _e from '../Utils/Events.js'

export default class ProgressBar {
    static instance

    experience = new Experience()
    debug = this.experience.debug
    program = this.experience.world.program
    checkpointWidth = 100 / this.program.totalCheckpoints
    htmlEl = document.querySelector('#progress-bar')
    el = {}

    constructor() {
        if (ProgressBar.instance) {
            return ProgressBar.instance
        }
        ProgressBar.instance = this

        this.init()
        this.setEventListeners()
    }

    init() {
        this.htmlEl.querySelector('div').innerHTML = ProgressBar.HTML(this.checkpointWidth, this.program)
        const { passed, checkpoints } = this.getElements()
        this.el = { passed, checkpoints }

        this.el.checkpoints.forEach((checkpoint, index) => {
            checkpoint.addEventListener('click', this.handleCheckpointClick)
            if (index === this.program.currentCheckpoint) checkpoint.setAttribute('currentCheckpoint', '')
        })
    }

    refresh = () => {
        this.el.passed.style.width = `${this.checkpointWidth * this.program.currentCheckpoint}%`

        this.el.checkpoints.forEach((checkpoint, index) => {
            checkpoint.removeAttribute('currentCheckpoint')
            if (index < this.program.currentCheckpoint) {
                checkpoint.classList.remove('locked')
            }
            if (index === this.program.currentCheckpoint) {
                checkpoint.setAttribute('currentCheckpoint', '')
            }
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, this.refresh)
    }

    handleCheckpointClick = (event) => {
        const clickedCheckpointIndex = parseInt(event.currentTarget.getAttribute('data-index'))

        // Update the program's current checkpoint
        if (this.program.currentCheckpoint !== clickedCheckpointIndex) {
            this.program.goToCheckpoint(clickedCheckpointIndex)

            // Refresh the UI to reflect the change
            this.refresh()
        }
    }

    getElements() {
        return {
            passed: this.htmlEl.querySelector('.percentageBar .passed'),
            checkpoints: this.htmlEl.querySelectorAll("[aria-label='checkpoint']:not(:last-child)"),
        }
    }

    static HTML(checkpointWidth, program) {
        let generatedHTML = `
            <div class="percentageBar bg-bke-purple h-1">
                <div class="passed bg-bke-orange w-0 h-full transition-[width]" style="width: ${checkpointWidth * program.currentCheckpoint}%"></div>
            </div>
            <div>`
        program.programData.forEach((data, index) => {
            const stepTypeIcon = {
                video: '#film-solid',
                quiz: '#question-solid',
                pause: '#pause-solid',
                default: '#pen-to-square-solid',
            }

            // Determine the dominant step type for the current data item
            let dominantStepType = 'default'
            for (let step of data.steps) {
                if (stepTypeIcon[step.details.step_type]) {
                    dominantStepType = step.details.step_type
                    break // Assumes the first identifiable step type dictates the icon
                }
            }

            const icon = stepTypeIcon[dominantStepType]
            generatedHTML += `
                <button class="button-circle button-circle-default duration-300 mb-2 grid" aria-label="checkpoint" data-index="${index}">
                    <svg class="h-3 w-3"><use href="${icon}" fill="currentColor"></use></svg>
                </button>`
        })

        return `${generatedHTML}
            <button class="button-circle button-circle-default mb-0 grid" aria-label="checkpoint">
                <svg class="h-3 w-3"><use href="#star-solid" fill="currentColor"></use></svg>
            </button>
        </div>`
    }
}
