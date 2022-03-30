import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let taskDescription = null

export default class TaskDescription {
    constructor() {
        this.experience = new Experience()
        taskDescription = this
    }
  
    toggleTaskDescription() {
        if (document.querySelector('.modal')) {
            taskDescription.modal.destroy()
        }
        else {
            taskDescription.text = this.experience.world.selectedEpisode.program[this.experience.world.program.currentStep].description
            console.log(taskDescription.text)
            let html = `
                <div class="modal__content task-description">
                    <div class="task-description__header"><i></i><h1>${ _s.taskDescription }</h1></div>
                    <div class="task-description__content">${ taskDescription.text }</div>
                </div>
                <div id="get-task" class="btn">${ _s.solveTask }</div>
            `;

            taskDescription.modal = new Modal(html)
            document.getElementById("get-task").addEventListener("mousedown", () => {
                taskDescription.modal.destroy()
                taskDescription.experience.world.program.advance()
                taskDescription.experience.world.program.updateIrisTexture('READY')
            })
        }
    }
}