import Experience from '../Experience.js'
import _e from '../Utils/Events.js'

let instance = null

export default class ProgressBar {
    constructor() {
        // Singleton
        if (instance) {
            // Re-set reference to program
            instance.program = instance.experience.world.program
            instance.checkpointWidth = 100 / instance.program.totalCheckpoints

            return instance
        }

        instance = this

        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.program = instance.experience.world.program
        instance.checkpointWidth = 100 / instance.program.totalCheckpoints
        instance.htmlEl = document.querySelector('#progress-bar')
        instance.el = {}

        instance.init()
        instance.refresh()
        instance.setEventListeners()
    }

    init() {
        instance.htmlEl.querySelector('div').innerHTML = ProgressBar.HTML(instance.checkpointWidth, instance.program)
        instance.el = instance.getElements()
    }

    refresh = () => {
        instance.el.passed.style.width = `${instance.checkpointWidth * instance.program.currentCheckpoint}%`

        instance.el.checkpoints.forEach((checkpoint, index) => {
            checkpoint.removeAttribute('currentCheckpoint')

            if (index === instance.program.currentCheckpoint) {
                checkpoint.setAttribute('currentCheckpoint', '')
            }
        })
    }

    setEventListeners() {
        instance.el.checkpoints.forEach((checkpoint, index) => {
            checkpoint.addEventListener('click', instance.handleCheckpointClick)
        })

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.refresh)
        document.addEventListener(_e.ACTIONS.GO_HOME, instance.resetProgress)
    }

    handleCheckpointClick = (event) => {
        const clickedCheckpointIndex = parseInt(event.currentTarget.getAttribute('data-index'))

        // Update the program's current checkpoint
        if (instance.program.currentCheckpoint !== clickedCheckpointIndex) {
            instance.program.goToCheckpoint(clickedCheckpointIndex)
        }
    }

    getElements() {
        return {
            passed: instance.htmlEl.querySelector('.percentageBar .passed'),
            checkpoints: instance.htmlEl.querySelectorAll("[aria-label='checkpoint']:not(:last-child)"),
        }
    }

    resetProgress = () => {
        instance.program.currentCheckpoint = 0
        instance.program.currentStep = 0
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
                <button class="button-circle button-circle-default duration-300 grid" aria-label="checkpoint" data-index="${index}">
                    <svg><use href="${icon}" fill="currentColor"></use></svg>
                </button>`
        })

        return `${generatedHTML}
            <button class="button-circle button-circle-default mb-0 grid" aria-label="checkpoint">
                <svg><use href="#star-solid" fill="currentColor"></use></svg>
            </button>
        </div>`
    }
}
