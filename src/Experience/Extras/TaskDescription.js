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
            instance.currentStepTaskType = selectedChapter.program[currentStep].taskType
            instance.text = selectedChapter.program[currentStep].description

            let html = `
                <div class="modal__content task">
                    <div class="task__video">
                        <video id="irisVideoBg" src="/textures/iris.mp4" autoplay loop></video>
                    </div>
                    <div class="task__content">
                        <div class="modal__extras">
                            <span class="left"></span>
                            <span class="bottomLeft"></span>
                            <span class="bottomLeftSmall"></span>
                        </div>
                        ${instance.text}
                    </div>
                    <div id="get-task" class="button button__goToTask"><div class="button__bg"></div><span>${_s.task.getTask}</span></div>
                </div>
            `;

            instance.modal = new Modal(html)
            const getTaskBtn = document.getElementById("get-task")

            document.querySelector('.modal').classList.add('modal__task')

            getTaskBtn.addEventListener("click", () => {
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

                else if (instance.currentStepTaskType == 'cables') {
                    instance.program.cableConnectorGame.toggleCableConnector()
                }

                else if (instance.program.stepType() == 'iris') {
                    instance.program.advance()
                }
            })

            if (instance.currentStepTaskType == 'sorting') {
                const noOfIcons = instance.program.getCurrentStepData().sorting.length
                getTaskBtn.classList.add('disabled')

                var input = document.createElement("input")
                input.classList.add("no-of-icons")
                input.setAttribute("type", "number")
                input.setAttribute("placeholder", "0")
                input.setAttribute("min", "0")
                input.setAttribute("max", "12")
                input.setAttribute("maxLength", "2")

                const div = document.createElement("div")
                div.classList.add('numberOfIcons')
                const label = document.createElement("span")

                label.innerText = "Icons found:"

                div.appendChild(label)
                div.appendChild(input)
                document.querySelector('.task__content').appendChild(div)

                input.addEventListener("input", (event) => {
                    if (event.target.value == noOfIcons) {
                        getTaskBtn.classList.remove('disabled')
                    } else {
                        getTaskBtn.classList.add('disabled')
                    }
                })
            }
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