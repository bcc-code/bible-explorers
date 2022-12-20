import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let dialog = null

export default class Dialog {
    constructor() {
        this.experience = new Experience()
        dialog = this
    }

    toggleDialog() {
        if (document.querySelector('.modal__dialog')) {
            dialog.modal.destroy()
        }
        else {
            dialog.correctAnswers = 0

            let world = this.experience.world
            let debug = this.experience.debug
            dialog.program = world.program
            let data = dialog.program.getCurrentStepData()

            const accordion = data.dialog

            let html = `<div class="modal__content dialog">
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
                <div class="task__content">
                    <div class="accordion">`
                        accordion.forEach(item => {
                            html += `<div class="accordion_item">
                                        <button class="accordion_item-section">${item.question}</button>
                                        <div class="accordion_item-panel">
                                            <p>${item.answer}<p>
                                            <div class="backToQuestions"> <i class="icon-arrow-left-long-solid"></i> all questions</div>
                                            <audio>
                                                <source src="sounds/congrats.mp3" type="audio/mpeg">
                                            </audio>
                                        </div>
                                    </div>`
                        })
                    html += `</div>
                </div>
            </div>`

            dialog.modal = new Modal(html, 'modal__dialog')

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'Dialog'
            document.querySelector('.modal__dialog').prepend(title)

            const back = document.getElementById("back")
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', (e) => {
                dialog.modal.destroy()
                dialog.program.previousStep()
            })

            const next = document.getElementById('continue')
            next.style.display = 'block'
            next.innerText = _s.task.next
            next.addEventListener('click', dialog.completeDialog)

            const accButton = document.querySelectorAll('.accordion_item-section')

            function showHide(item) {
                const parent = item.parentElement
                const panel = item.nextElementSibling
                const audio = item.nextElementSibling.querySelector('audio')

                parent.classList.toggle('active')

                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null

                    parent.classList.add('read')

                    for (let sibling of item.closest('.accordion').children) {
                        sibling.classList.remove('hide')
                    }

                    audio.pause()
                    audio.currentTime = 0

                } else {
                    panel.style.maxHeight = panel.scrollHeight + 'px'

                    for (let sibling of item.closest('.accordion').children) {
                        sibling.classList.add('hide')
                    }
                    parent.classList.remove('hide')

                    setTimeout(() => {
                        audio.play()
                    }, 1300)
                }
            }

            accButton.forEach(item => {
                item.addEventListener('click', () => {
                    showHide(item)
                })

                const backToQuestions = item.nextElementSibling.querySelector('.backToQuestions')

                backToQuestions.addEventListener('click', () => {
                    showHide(item)
                })
            })
        }
    }

    completeDialog() {
        dialog.modal.destroy()
        dialog.program.nextStep()
    }
}