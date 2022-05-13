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
            instance.program = instance.world.program
            instance.camera = instance.program.camera
            instance.highlight = instance.world.highlight
            instance.points = instance.world.points
            let currentStep = instance.program.currentStep
            let selectedChapter = instance.world.selectedChapter

            instance.text = selectedChapter.program[currentStep].description

            let html = `
                <div class="modal__content task">
                <div class="task__header heading"><div class="icon"><i></i></div><span>${_s.task.taskDescription}</span></div>
                    <div class="task__content">${instance.text}</div>
                </div>

                <div id="get-task" class="button button__goToTask"><span>${_s.task.getTask}</span></div>
            `;

            instance.modal = new Modal(html)

            document.getElementById("get-task").addEventListener("click", () => {
                instance.currentStepTaskType = selectedChapter.program[currentStep].taskType

                instance.modal.destroy()

                if (instance.currentStepTaskType == 'questions') {
                    instance.program.questions.toggleQuestions()
                }

                else if (instance.currentStepTaskType == 'code') {
                    instance.program.timer.setMinutes(5)
                    instance.program.codeUnlock.toggleCodeUnlock()
                }

                else if (instance.currentStepTaskType == 'sorting') {
                    instance.program.sortingGame.toggleSortingGame()
                }

                else if (instance.program.stepType() == 'iris') {
                    instance.program.advance()
                }
            })
        }
    }

    startTask(screen) {
        setTimeout(function () {
            instance.program.addCustomInteractiveObj(screen)
            instance.points.add(screen, instance.currentStepTaskType)
            instance.highlight.add(screen)
        }, instance.camera.data.moveDuration)
    }
}