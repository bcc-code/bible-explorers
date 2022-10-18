import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _e from '../Utils/Events.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'

let instance = null

export default class CodeAndIris {
    constructor() {
        this.offline = new Offline()
        this.experience = new Experience()
        instance = this
    }

    toggleCodeAndIris() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.world = instance.experience.world
            instance.audio = instance.world.audio
            instance.program = instance.world.program
            instance.currentStep = instance.program.currentStep
            instance.selectedChapter = instance.world.selectedChapter
            instance.data = instance.selectedChapter.program[instance.currentStep].codeAndIris
            instance.currentStepData = instance.selectedChapter.program[instance.currentStep]

            instance.toggleIris()
        }
    }

    toggleIris() {
        const html = instance.program.taskDescription.getModalHtml('iris-and-code', instance.data.iris)
        instance.modal = new Modal(html, 'modal__task')

        instance.playBTN = document.getElementById("play")
        instance.irisPlaying = document.querySelector('.iris-playing')

        if (instance.data.audio) {
            // Fetch audio from blob or url
            instance.offline.fetchChapterAsset(instance.data, "audio", (data) => {
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

        document.addEventListener(_e.ACTIONS.AUDIO_TASK_DESCRIPTION_ENDED, instance.changePauseBtnToPlay)

        const back = document.getElementById("back")
        back.style.display = 'block'
        back.innerText = _s.journey.back
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.codeUnlock.toggleCodeUnlock(instance.data.code, true)
        })

        const next = document.getElementById('continue')
        next.style.display = 'block'
        next.innerText = _s.task.next
        next.addEventListener("click", () => {
            instance.modal.destroy()
            instance.world.program.advance()
        })
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
}