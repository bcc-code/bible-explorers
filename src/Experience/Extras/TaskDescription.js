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
            instance.destroy()
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

            let html = instance.getModalHtml(instance.text)
            instance.modal = new Modal(html)
            document.querySelector('.modal').classList.add('modal__task')

            const backBtn = document.getElementById("backBTN")
            const getTaskBtn = document.getElementById("get-task")

            backBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                instance.destroy()
            })

            getTaskBtn.addEventListener("click", () => {
                instance.destroy()

                if (instance.currentStepTaskType == 'questions') {
                    instance.program.questions.toggleQuestions()
                }

                else if (instance.currentStepTaskType == 'code') {
                    const code = selectedChapter.program[currentStep].codeToUnlock
                    instance.program.codeUnlock.toggleCodeUnlock(code)
                }

                else if (instance.currentStepTaskType == 'sorting') {
                    instance.program.sortingGame.toggleSortingGame()
                }

                else if (instance.currentStepTaskType == 'cables') {
                    instance.program.cableConnectorGame.toggleCableConnector()
                }

                else if (instance.currentStepTaskType == 'question_and_code') {
                    instance.program.questionAndCode.toggleQuestionAndCode()
                }

                else if (instance.program.stepType() == 'iris') {
                    instance.program.advance()
                }
            })

            if (instance.currentStepTaskType == 'sorting') {
                const noOfCorrectIcons = instance.program.getCurrentStepData().sorting.filter(i => i.correct_wrong === true).length

                var input = document.createElement("input")
                input.classList.add("no-of-icons")
                input.setAttribute("type", "number")
                input.setAttribute("placeholder", "0")
                input.setAttribute("min", "0")
                input.setAttribute("max", "12")
                input.setAttribute("maxLength", "2")

                const div = document.createElement("div")
                div.classList.add('numberOfIcons')
                div.appendChild(input)
                document.querySelector('.task__content').appendChild(div)
                input.focus()

                getTaskBtn.classList.add('disabled')
                input.addEventListener("input", (event) => {
                    if (event.target.value == noOfCorrectIcons) {
                        getTaskBtn.classList.remove('disabled')
                    } else {
                        getTaskBtn.classList.add('disabled')
                    }
                })
            }
        }
    }

    getModalHtml(title, additionalContent = '') {
        return `<div class="modal__content task">
            <div class="task__video">
                <video id="irisVideoBg" src="/textures/iris.mp4" autoplay loop></video>
            </div>
            <div class="task__wrapper">
                <div class="task__content">
                    <div class="modal__extras">
                        <span class="left"></span>
                        <span class="bottomLeft"></span>
                        <span class="bottomLeftSmall"></span>
                    </div>
                    ${title}
                    ${additionalContent}
                </div>
            </div>
            <div class="modal__actions">
                <div id="backBTN" class="button button__default"><span>${_s.journey.back}</span></div>
                <div id="get-task" class="button button__continue"><div class="button__content"><span>${_s.task.next}</span></div></div>
            </div>
        </div>`
    }

    startTask(screen) {
        setTimeout(function () {
            instance.program.addCustomInteractiveObj(screen)
            instance.points.add(screen, instance.currentStepTaskType)
            instance.highlight.add(screen)
        }, instance.camera.data.moveDuration)
    }

    destroy() {
        document.onkeydown = null
        instance.modal.destroy()
    }
}