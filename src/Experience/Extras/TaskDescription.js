import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class TaskDescription {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        instance = this
    }
  
    toggleTaskDescription() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            let program = instance.world.program
            let highlight = program.highlight
            let camera = program.camera
            let currentStep = program.currentStep
            let selectedEpisode = instance.world.selectedEpisode

            instance.text = selectedEpisode.program[currentStep].description

            let html = `
                <div class="modal__content task-description">
                    <div class="task-description__header"><i></i><h1>${ _s.taskDescription }</h1></div>
                    <div class="task-description__content">${ instance.text }</div>
                </div>

                <div id="get-task" class="btn">${ _s.getTask }</div>
            `;

            instance.modal = new Modal(html)

            document.getElementById("get-task").addEventListener("mousedown", () => {
                if (selectedEpisode.program[currentStep].taskType == 'questions') {
                    camera.updateCameraTo('screensCloseLook')

                    setTimeout(function() {
                        highlight.setHightlight(["tv_16x10"])
                        program.addCustomInteractiveObj("tv_16x10")
                    }, camera.data.moveDuration)
                }

                else if (selectedEpisode.program[currentStep].taskType == 'code') {
                    camera.updateCameraTo('controlBoard')

                    setTimeout(function() {
                        highlight.setHightlight(["Panel_Screen"])
                        program.addCustomInteractiveObj("Panel_Screen")
                    }, camera.data.moveDuration)
                }
                
                else if (program.stepType() == 'iris') {
                    program.advance()
                }

                instance.modal.destroy()
                program.updateIrisTexture('READY')
            })
        }
    }
}