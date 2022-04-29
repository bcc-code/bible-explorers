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
            let camera = program.camera
            let highlight = instance.world.highlight
            let points = instance.world.points
            let currentStep = program.currentStep
            let selectedEpisode = instance.world.selectedEpisode

            instance.text = selectedEpisode.program[currentStep].description

            let html = `
                <div class="modal__content task">
                <div class="task__header heading"><div class="icon"><i></i></div><h3>${_s.taskDescription}</h3></div>
                    <div class="task__content">${instance.text}</div>
                </div>

                <div id="get-task" class="btn">${_s.getTask}</div>
            `;

            instance.modal = new Modal(html)

            document.getElementById("get-task").addEventListener("mousedown", () => {
                if (selectedEpisode.program[currentStep].taskType == 'questions') {
                    camera.updateCameraTo('screensCloseLook')

                    setTimeout(function () {
                        program.addCustomInteractiveObj("tv_16x10_screen")
                        points.addLabel("tv_16x10_screen", selectedEpisode.program[currentStep].taskType)
                        highlight.add("tv_16x10_screen")

                    }, camera.data.moveDuration)
                }

                else if (selectedEpisode.program[currentStep].taskType == 'code') {
                    camera.updateCameraTo('controlBoard')

                    setTimeout(function () {
                        program.addCustomInteractiveObj("panel_screen")
                        points.addLabel("panel_screen", selectedEpisode.program[currentStep].taskType)
                        highlight.add("panel_screen")
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