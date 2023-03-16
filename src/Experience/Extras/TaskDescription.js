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
            instance.currentStepData = instance.program.getCurrentStepData()
            instance.message = instance.currentStepData.message

            let html = instance.getModalHtml(instance.program.stepType(), instance.message.text)
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
                instance.program.previousStep()
            })

            continueBTN.addEventListener("click", () => {
                instance.destroy()
                instance.program.nextStep()
            })

            document.addEventListener(_e.ACTIONS.AUDIO_TASK_DESCRIPTION_ENDED, instance.changePauseBtnToPlay)

            if (instance.message.audio) {
                // Fetch audio from blob or url
                instance.offline.fetchChapterAsset(instance.message, "audio", (data) => {
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

            if (instance.message.media) {
                // Fetch message media from blob or url
                instance.offline.fetchChapterAsset(instance.message, "media", (data) => {
                    instance.program.updateAssetInProgramData('message', data)
                    document.querySelector('.task__tips > *').src = data.media
                })
            }

            if (instance.program.stepType() == 'sorting') {
                const noOfCorrectIcons = instance.currentStepData.sorting.filter(i => i.correct_wrong === true).length

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
        let html = `<div class="modal__content task ${type ? type : ''}">
            <div class="task__video">
                <video id="irisVideoBg" src="/textures/${instance.message.character}.mp4" autoplay loop></video>
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
                const mediaUrl = instance.message.media
                if (mediaUrl) {
                    html += `<div class="task__tips">${instance.getDomElement(mediaUrl)}</div>`
                }

                html += `<div class="task__content-text">${title}</div>`

                if (instance.message.open_question === true) {
                    html += `<textarea class="question__textarea" rows="8" placeholder="${_s.task.openQuestion}"></textarea>`
                }

                html += `${additionalContent}
            </div>
        </div>`

        return html
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()

        if (['mp4', 'mov', 'webm'].includes(ext)) return `<video src="" autoplay loop></video>`
        else return `<img src="" />`
    }

    destroy() {
        instance.modal.destroy()
        instance.audio.stopAllTaskDescriptions()
    }
}