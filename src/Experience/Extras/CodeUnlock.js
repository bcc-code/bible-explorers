import Experience from "../Experience.js";
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null
const showSkipAfterNoOfTries = 3

export default class CodeUnlock {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.debug = this.experience.debug

        instance = this
        instance.fails = 0
    }

    toggleCodeUnlock(code, irisMessage = false) {
        this.irisMessage = irisMessage

        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.secretCode = code

            let html = `
                <div class="modal__content code-unlock">
                    <h2>${_s.task.codeUnlock}</h2>
                    <div class="code-unlock__container">
                        <div class="code-unlock__screen">
                            <span class="code-unlock__input"></span>
                        </div>
                        <div class="code-unlock__grid">
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">7</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">8</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">9</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">4</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">5</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">6</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">1</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">2</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">3</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--backspace"><i class="icon icon-arrow-left-long-to-line-solid"></i></button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--number">0</button>
                            <button type="button" class="code-unlock__btn code-unlock__btn--confirm"><i class="icon icon-check-solid"></i></button>
                        </div>
                    </div>
                </div>`

            instance.modal = new Modal(html)
            document.querySelector('.modal').classList.add('modal__code-unlock')

            const back = document.getElementById("back")
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', (e) => {
                instance.modal.destroy()
                instance.world.program.taskDescription.toggleTaskDescription()
            })

            const skip = document.getElementById("skip")
            skip.innerText = _s.miniGames.skip
            skip.style.display = instance.debug.developer || instance.debug.onQuickLook() || instance.fails >= showSkipAfterNoOfTries
                ? 'block'
                : 'none'

            skip.addEventListener('click', (e) => {
                instance.fails = 0
                instance.world.program.advance()
                instance.destroy()
            })

            instance.el = {
                code: document.querySelector(".code-unlock__input"),
                numbers: document.querySelectorAll(".code-unlock__btn--number"),
                backspace: document.querySelector(".code-unlock__btn--backspace"),
                confirm: document.querySelector(".code-unlock__btn--confirm")
            }

            instance.el.numbers.forEach(function (number) {
                number.addEventListener("click", () => {
                    instance.add(number.textContent)
                })
            })

            instance.el.backspace.addEventListener("click", instance.remove)
            instance.el.confirm.addEventListener("click", instance.checkCode)

            document.onkeydown = (e) => {
                if (e.key === '1' ||
                    e.key === '2' ||
                    e.key === '3' ||
                    e.key === '4' ||
                    e.key === '5' ||
                    e.key === '6' ||
                    e.key === '7' ||
                    e.key === '8' ||
                    e.key === '9' ||
                    e.key === '0'
                ) {
                    instance.add(e.key)
                }
                else if (e.key === 'Backspace') {
                    instance.remove()
                }
                else if (e.key === 'Enter') {
                    instance.checkCode()
                }
            }
        }
    }

    add(number) {
        const maxLength = 10
        if (instance.el.code.textContent.length == maxLength) return
        instance.el.code.textContent += number
    }

    remove() {
        if (instance.el.code.textContent == "") return
        instance.el.code.textContent = instance.el.code.textContent.slice(0, -1)
    }

    checkCode() {
        const wrapper = document.querySelector('.code-unlock')

        if (instance.el.code.textContent == instance.secretCode) {
            instance.fails = 0
            instance.world.audio.playTaskCompleted()
            instance.destroy()

            this.irisMessage == true
                ? instance.world.program.codeAndIris.toggleCodeAndIris()
                : instance.world.program.advance()
        }
        else {
            instance.fails++
            if (instance.fails >= showSkipAfterNoOfTries)
                document.getElementById("skip").style.display = 'block'

            wrapper.classList.add('wrong-code')
            setTimeout(() => {
                wrapper.classList.remove('wrong-code')
            }, 2000)
            instance.world.audio.playWrongSound()
        }
    }

    destroy() {
        instance.modal.destroy()
        document.onkeydown = null
    }
}