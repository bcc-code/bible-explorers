import Experience from '../Experience.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class QuestionScreen {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.debug = instance.experience.debug

    }

    eventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    show() {
        const container = _gl.elementFromHtml(`
            <div class="view" id="question-screen">
                <div class="container">
                    <span class="title">Title</span>
                    <div class="row">
                        <div class="col">
                            <img src="https://picsum.photos/200/300" alt="picture" />
                        </div>
                        <div class="col">
                            <textarea placeholder="This is a placeholder"></textarea>
                            <button class="btn default" type="submit">submit</button>
                        </div>
                    </div>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(container)
    }

    destroy() {
        document.querySelector('.view')?.remove()
    }
}