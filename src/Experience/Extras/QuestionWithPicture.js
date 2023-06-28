import Experience from '../Experience.js'
import _gl from '../Utils/Globals.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class QuestionWithPicture {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
    }

    toggleQuestionWithPicture() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData().question_with_picture

        const container = _gl.elementFromHtml(`
            <div class="view" id="question-with-picture">
                <div class="container">
                    <div class="row">
                        <div class="col">
                            <img src="${instance.stepData.image}" alt="picture" />
                        </div>
                        <div class="col">
                            <textarea></textarea>
                            <button class="btn default" type="submit" aria-label="submit question">${_s.task.submit}</button>
                        </div>
                    </div>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(container)

        const submitQuestion = container.querySelector('[aria-label="submit question"')
        submitQuestion.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })
    }

    eventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.getElementById('question-with-picture')?.remove()
    }
}