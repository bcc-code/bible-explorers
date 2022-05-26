import Experience from "../Experience.js";
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let instance = null

export default class CodeUnlock {
    constructor() {
        instance = this
        this.experience = new Experience()
        this.world = this.experience.world
    }

    toggleCodeUnlock() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            let html = `
                <div class="modal__content code-unlock">
                    <div class="code-unlock__header heading"><h1>${_s.task.codeUnlock}</h1></div>
                    <div class="code-unlock__sidebar">
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
                                <button type="button" class="code-unlock__btn code-unlock__btn--number">0</button>
                                <button type="button" class="code-unlock__btn code-unlock__btn--backspace"><i class="icon icon-arrow-left-long-to-line-solid"></i></button>
                                <button type="button" class="code-unlock__btn code-unlock__btn--confirm"><i class="icon icon-check-solid"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            instance.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__code-unlock')

            instance.el = {
                code: document.querySelector(".code-unlock__input"),
                numbers: document.querySelectorAll(".code-unlock__btn--number"),
                backspace: document.querySelector(".code-unlock__btn--backspace"),
                confirm: document.querySelector(".code-unlock__btn--confirm")
            }
            instance.secretCode = instance.world.selectedChapter.program[instance.world.program.currentStep].codeToUnlock

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
        if (instance.el.code.textContent == instance.secretCode) {
            instance.world.program.timer.destroy()
            instance.world.audio.playCodeUnlockedSound()
            instance.world.program.advance()
            instance.destroy()
        } else {
            // console.log("Incorrect code")
            instance.world.audio.playWrongSound()
        }
    }

    destroy() {
        instance.modal.destroy()
        document.onkeydown = null
    }
}