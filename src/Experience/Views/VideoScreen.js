import Experience from '../Experience.js'
import _gl from '../Utils/Globals.js'

let instance = null

export default class VideoScreen {
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
            <div class="view" id="video-screen">
                <div class="container">
                    <span class="title">Title</span>
                    <video controls>
                        <source src="movie.mp4" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
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