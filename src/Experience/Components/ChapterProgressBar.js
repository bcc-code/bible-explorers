import Experience from "../Experience.js"
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

let instance = null

export default class ChapterProgressBar {
    constructor() {

        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world

        instance.init()
    }

    init() {
        instance.program = instance.world.program

        const currentCheckpoint = parseInt(instance.program.currentCheckpoint) + 1

        const progress = _gl.elementFromHtml(`
            <div class="chapter-progress">
                <div class="bar">
                    <progress max="${instance.program.totalCheckpoints}" value="${currentCheckpoint}"></progress>
                </div>
            </div>
        `)

        const labelList = _gl.elementFromHtml(`<ul data-value="${instance.program.totalCheckpoints}"></ul>`)
        labelList.style.gridTemplateColumns = `repeat(${(instance.program.totalCheckpoints + 1)}, 1fr)`
        progress.querySelector('.bar').append(labelList)

        for (let i = 0; i < instance.program.totalCheckpoints; i++) {
            const item = _gl.elementFromHtml(`
                <li step-label="video">
                    <svg viewBox="0 0 29 29">
                        <use href="#star"></use>
                    </svg>
                </li>
            `)

            labelList.append(item)

            if (i < currentCheckpoint)
                item.classList.add('filled')

        }

        document.querySelector('.ui-container').append(progress)
        instance.setEventListeners()
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.querySelector('.chapter-progress')?.remove()
    }

}