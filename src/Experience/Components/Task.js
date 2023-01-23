import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"

let instance = null
export default class Task {
    constructor() {

        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
    }

    init() {
        const taskModal = _gl.elementFromHtml(`
            <section class="task">
                <div class="container">
                    <div class="content">
                        <header class="task-header">
                            <h2>Task title</h2>
                        </header>
                        <div class="task-image">
                            <div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/VdR17Tv5sM2xIYqOQS" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div>
                        </div>
                        <div class="task-description">
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
                            <p> Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                            <img src="./games/heart-defense/good-thought1.png" />
                            <img src="./games/heart-defense/good-thought2.png" />
                            <img src="./games/heart-defense/good-thought3.png" />
                        </div>
                    </div>
                </div>
            </section>
        `)

        document.querySelector('.ui-container').append(taskModal)

    }

    toggle() {
        instance.init()
    }

}