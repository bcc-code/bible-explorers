import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _e from '../Utils/Events.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class TaskDescription {
    constructor() {
        this.offline = new Offline()
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
            instance.audio = instance.world.audio

            let currentStep = instance.program.currentStep
            let selectedChapter = instance.world.selectedChapter

            instance.currentStepTaskType = selectedChapter.program[currentStep].taskType
            instance.text = selectedChapter.program[currentStep].description

            let html = instance.getModalHtml(instance.currentStepTaskType, instance.text)
            instance.modal = new Modal(html, 'modal__task')

            const backBTN = document.getElementById("back")
            const continueBTN = document.getElementById("continue")
            instance.playBTN = document.getElementById("play")
            instance.irisPlaying = document.querySelector('.iris-playing')

            backBTN.innerText = _s.journey.back
            continueBTN.innerText = _s.task.next

            backBTN.style.display = "block"
            continueBTN.style.display = "block"

            backBTN.addEventListener('click', (e) => {
                e.stopPropagation()
                instance.destroy()
            })

            continueBTN.addEventListener("click", () => {
                instance.destroy()

                if (instance.currentStepTaskType == 'code') {
                    const code = selectedChapter.program[currentStep].codeToUnlock
                    instance.program.codeUnlock.toggleCodeUnlock(code)
                }

                else if (instance.currentStepTaskType == 'code_and_iris') {
                    const code = selectedChapter.program[currentStep].codeAndIris.code
                    instance.program.codeUnlock.toggleCodeUnlock(code, true)
                }

                else if (instance.currentStepTaskType == 'picture_and_code') {
                    instance.program.pictureAndCode.togglePictureAndCode()
                }

                else if (instance.currentStepTaskType == 'question_and_code') {
                    instance.program.questionAndCode.toggleQuestionAndCode()
                }

                else if (instance.currentStepTaskType == 'questions') {
                    instance.program.questions.toggleQuestions()
                }

                else if (instance.currentStepTaskType == 'cables') {
                    instance.program.cableConnectorGame.toggleCableConnector()
                }

                else if (instance.currentStepTaskType == 'sorting') {
                    instance.program.sortingGame.toggleSortingGame()
                }

                else if (instance.currentStepTaskType == 'simon_says') {
                    instance.program.simonSays.toggleSimonSays()
                }

                else if (instance.currentStepTaskType == 'quiz') {
                    instance.program.quiz.toggleQuiz()
                }

                else if (instance.program.stepType() == 'iris') {
                    instance.program.advance()
                }
            })

            document.addEventListener(_e.ACTIONS.AUDIO_TASK_DESCRIPTION_ENDED, instance.changePauseBtnToPlay)

            instance.currentStepData = selectedChapter.program[currentStep]
            if (instance.currentStepData.audio) {
                // Fetch audio from blob or url
                instance.offline.fetchChapterAsset(instance.currentStepData, "audio", (data) => {
                    instance.taskAudio = data.audio
                })

                instance.playBTN.addEventListener("click", () => {
                    instance.audio.togglePlayTaskDescription(instance.taskAudio)
                    instance.playBTN.hasAttribute('playing')
                        ? instance.changePauseBtnToPlay()
                        : instance.changePlayBtnToPause()
                })
            }
            else {
                instance.playBTN.remove()
            }

            if (selectedChapter.program[currentStep].descriptionMedia) {
                // Fetch description media from blob or url
                instance.offline.fetchChapterAsset(selectedChapter.program[currentStep], "descriptionMedia", (data) => {
                    instance.world.selectedChapter.program[currentStep].descriptionMedia = data.descriptionMedia
                    document.querySelector('.task__tips > *').src = data.descriptionMedia
                })
            }

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

                continueBTN.classList.add('disabled')
                input.addEventListener("input", (event) => {
                    if (event.target.value == noOfCorrectIcons) {
                        continueBTN.classList.remove('disabled')
                    } else {
                        continueBTN.classList.add('disabled')
                    }
                })
            }
        }
    }

    changePauseBtnToPlay() {
        instance.playBTN.removeAttribute("playing")
        instance.playBTN.classList.add('icon-play-solid', 'pulsate')
        instance.playBTN.classList.remove('icon-stop-solid')
        instance.irisPlaying.style.display = 'none'
    }
    changePlayBtnToPause() {
        instance.playBTN.setAttribute("playing", '')
        instance.playBTN.classList.remove('icon-play-solid', 'pulsate')
        instance.playBTN.classList.add('icon-stop-solid')
        instance.irisPlaying.style.display = 'flex'
    }

    getModalHtml(type, title, additionalContent = '') {
        let html = `<div class="modal__content task ${type}">
            <div class="task__video">
                <video id="irisVideoBg" src="/textures/iris.mp4" autoplay loop></video>
                <button id="play" class="width height button rounded--full bg--secondary border--5 border--solid border--transparent pulsate | icon-play-solid"></button>
                <div class="iris-playing">
                    <div class="line line1"></div>
                    <div class="line line2"></div>
                    <div class="line line3"></div>
                    <div class="line line4"></div>
                    <div class="line line5"></div>
                </div>
            </div>

            <div class="task__content">`
                const mediaUrl = instance.world.selectedChapter.program[instance.program.currentStep].descriptionMedia
                if (type != 'iris-and-code' && mediaUrl) {
                    const domEl = instance.getDomElement(mediaUrl)
                    if (domEl) {
                        html += `<div class="task__tips">${ domEl }</div>`
                    }
                }

                html += `${title}
                ${additionalContent}
            </div>
        </div>`

        return html
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()

        if (['jpg','jpeg','png','gif','tiff','jfif','bmp'].includes(ext)) return `<img src="" />`
        if (['mp4','mov','avi','wmv','flv','mkv','webm','mpeg','m4v','3gp'].includes(ext)) return `<video src="" autoplay loop></video>`
    }

    destroy() {
        instance.modal.destroy()
        instance.audio.stopTaskDescription(instance.taskAudio)
    }
}