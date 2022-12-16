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
            let program = world.program
            let currentStep = program.currentStep
            let selectedChapter = world.selectedChapter

            const questions = selectedChapter.program[currentStep].dialog

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
                <div class="task__content">`
                    questions.forEach((q, qIdx) => {
                        html += `<div class="question" data-index="${qIdx + 1}">
                            <div class="question__heading">
                                <p class="question__title">${q.question}</p>
                            </div>
                            <div class="question__answer">${q.answer}</div>
                        </div>`
                    })
                html += `</div>
            </div>`

            dialog.modal = new Modal(html, 'modal__dialog')

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'Dialog'
            document.querySelector('.modal__dialog').prepend(title)

            dialog.htmlQuestions = document.querySelectorAll('.question')
            dialog.htmlQuestions[0].classList.add('visible')

            const back = document.getElementById("back")
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', (e) => {
                dialog.modal.destroy()
                world.program.taskDescription.toggleTaskDescription()
            })

            const prevButton = document.getElementById('prev')
            prevButton.setAttribute('disabled', '')
            prevButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                const currentStep = document.querySelector('.dialog__step.active')

                current.classList.remove('visible')
                currentStep.classList.remove('active')
                current.previousElementSibling?.classList.add('visible')
                currentStep.previousElementSibling?.classList.add('active')

                if (current.previousElementSibling.querySelector('input:checked')) {
                    nextButton.removeAttribute('disabled')
                }

                if (current.getAttribute('data-index') == 2) {
                    prevButton.setAttribute('disabled', '')
                }
            })

            const nextButton = document.getElementById('next')
            nextButton.setAttribute('disabled', '')
            nextButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                const currentStep = document.querySelector('.dialog__step.active')

                current.classList.remove('visible')
                currentStep.classList.remove('active')

                current.nextElementSibling?.classList.add('visible')
                currentStep.nextElementSibling?.classList.add('active')

                if (current.nextElementSibling.querySelector('input:checked')) {
                    nextButton.removeAttribute('disabled')
                } else {
                    nextButton.setAttribute('disabled', '')
                }
                prevButton.removeAttribute('disabled')

                if (current.nextElementSibling.getAttribute('data-index') == questions.length) {
                    nextButton.setAttribute('disabled', '')
                }
            })

            if (debug.developer || debug.onQuickLook()) {
                const skip = document.getElementById('skip')
                skip.style.display = 'block'
                skip.innerText = _s.miniGames.skip
                skip.addEventListener("click", () => {
                    dialog.modal.destroy()
                    program.advance()
                })
            }

            const submitButton = document.getElementById('continue')
            submitButton.innerText = _s.task.submit
            submitButton.addEventListener("click", dialog.completeDialog)

            let questionsAnswered = 0

            dialog.htmlQuestions.forEach((q, i) => {
                const htmlAnswers = q.querySelectorAll('label')
                const objAnswers = questions[i].answers

                htmlAnswers.forEach((a, i) => {
                    a.addEventListener('click', () => {
                        htmlAnswers.forEach(a => {
                            a.parentNode.classList.remove('wrong')
                            a.style.pointerEvents = 'none'
                        })

                        questionsAnswered++

                        const correctIndex = objAnswers.findIndex(a => a.correct_wrong)
                        htmlAnswers[correctIndex].parentNode.classList.add('correct')

                        if (!objAnswers[i].correct_wrong) {
                            a.parentNode.classList.add('wrong')
                        } else {
                            dialog.correctAnswers++
                        }

                        if (q.getAttribute('data-index') == questions.length) {
                            skip.style.display = "none"
                            submitButton.style.display = "block"
                        }
                        else {
                            nextButton.removeAttribute('disabled')
                        }
                    })
                })
            })
        }
    }

    completeDialog() {
        dialog.modal.destroy()
        dialog.experience.world.program.advance()
    }
}