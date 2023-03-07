import Experience from "../Experience.js"
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

let instance = null
const showSkipAfterNoOfTries = 3

export default class CodeUnlock {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.debug = instance.experience.debug
    }

    toggleCodeUnlock() {
        instance.audio = instance.world.audio
        instance.program = instance.world.program
        instance.secretCode = instance.program.getCurrentStepData().code_to_unlock
        instance.experience.navigation.next.disabled = true

        instance.data = {
            codeLength: instance.secretCode.length,
            fails: 0,
            currentNumberIndex: 0,
            enteredCode: [],
        }

        instance.unlockScreenHTML()
        instance.setEventListeners()
    }

    unlockScreenHTML() {
        const unlockScreen = _gl.elementFromHtml(`
            <section class="code-unlock">
                <div class="container">
                    <header class="game-header">
                        <h2>${_s.task.codeUnlock}</h2>
                    </header>
                    <div class="code-unlock-device">
                        <div class="code-unlock-code"></div>
                        <div class="code-unlock-keyboard"></div>
                    </div>
                </div>
                <div class="overlay"></div>
            </section>
        `)

        for (let i = 1; i <= 12; i++) {
            if (i == 10) {
                const deleteKey = _gl.elementFromHtml(`
                    <button class="code-unlock-key delete-number">
                        <svg class="delete-icon icon" viewBox="0 0 27 18">
                            <use href="#delete-left"></use>
                        </svg>
                    </button>
                `)
                deleteKey.disabled = true
                unlockScreen.querySelector('.code-unlock-keyboard').append(deleteKey)
            }

            else if (i == 11) {
                const key = _gl.elementFromHtml(`<button class="code-unlock-key">0</button>`)
                unlockScreen.querySelector('.code-unlock-keyboard').append(key)
            }

            else if (i == 12) {
                const confirmKey = _gl.elementFromHtml(`
                    <button class="code-unlock-key confirm-code">
                        <svg class="confirm-icon icon" viewBox="0 0 23 16">
                            <use href="#check-mark"></use>
                        </svg>
                    </button>
                `)

                confirmKey.disabled = true
                unlockScreen.querySelector('.code-unlock-keyboard').append(confirmKey)
            }

            else {
                const key = _gl.elementFromHtml(`<button class="code-unlock-key">${i}</button>`)
                unlockScreen.querySelector('.code-unlock-keyboard').append(key)
            }
        }

        for (let j = 0; j < instance.secretCode.length; j++) {
            const asterix = _gl.elementFromHtml(`
                <div>
                    <svg class="asterisk-icon icon" width="20" height="22" viewBox="0 0 20 22">
                        <use href="#asterisk"></use>
                    </svg>
                </div>
            `)
            unlockScreen.querySelector('.code-unlock-code').append(asterix)
        }

        document.querySelector('.ui-container').append(unlockScreen)

        instance.el = {
            code: unlockScreen.querySelector(".code-unlock-code"),
            numbers: unlockScreen.querySelectorAll(".code-unlock-key"),
            backspace: document.querySelector('.delete-number'),
            confirm: document.querySelector('.confirm-code')
        }

        instance.el.numbers.forEach(function (number) {

            number.addEventListener("click", () => {

                if (number.matches('.delete-number') || number.matches('.confirm-code')) return
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
                if (instance.data.currentNumberIndex > 0)
                    instance.remove()
            }
            else if (e.key === 'Enter') {
                if (instance.data.currentNumberIndex == instance.data.codeLength)
                    instance.checkCode()
            }
        }

        const skipBTN = _gl.elementFromHtml(`
            <button class="btn default" aria-label="skip-button">${_s.miniGames.skip}</button>
        `)

        if (instance.debug.developer || instance.debug.onQuickLook())
            unlockScreen.querySelector('.container').append(skipBTN)

        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })
    }

    add(num) {
        if (instance.data.currentNumberIndex == instance.data.codeLength) return

        if (instance.data.currentNumberIndex == instance.data.codeLength - 1)
            instance.el.confirm.disabled = false

        if (instance.data.currentNumberIndex == 1)
            instance.el.backspace.disabled = false

        const numbers = instance.el.code.querySelectorAll('div')
        numbers[instance.data.currentNumberIndex].textContent = num
        instance.data.enteredCode.push(num)
        instance.data.currentNumberIndex++
    }

    remove() {
        if (instance.data.currentNumberIndex == 0) return

        document.querySelector('.code-unlock.correct-code')?.classList.remove('correct-code')

        const asterisk = _gl.elementFromHtml(`
                <svg class="asterisk-icon icon" width="20" height="22" viewBox="0 0 20 22">
                    <use href="#asterisk"></use>
                </svg>
            `)

        const numbers = instance.el.code.querySelectorAll('div')
        numbers[instance.data.currentNumberIndex - 1].textContent = ''
        numbers[instance.data.currentNumberIndex - 1].appendChild(asterisk)

        if (instance.data.currentNumberIndex == 1)
            instance.el.backspace.disabled = true

        instance.data.enteredCode.splice(instance.data.currentNumberIndex - 1, 1)
        instance.data.currentNumberIndex--

        if (instance.data.currentNumberIndex != instance.data.codeLength)
            instance.el.confirm.disabled = true
    }

    checkCode() {
        const wrapper = document.querySelector('.code-unlock')

        if (instance.data.enteredCode.join('') == instance.secretCode) {
            wrapper.classList.add('correct-code')
            instance.audio.playSound('task-completed')
            instance.data.fails = 0

            instance.experience.navigation.next.disabled = false
        }
        else {
            instance.data.fails++
            instance.data.currentNumberIndex = 0
            instance.data.enteredCode = []
            instance.el.backspace.disabled = true
            instance.el.confirm.disabled = true

            const numbers = instance.el.code.querySelectorAll('div')
            numbers.forEach(item => {
                const asterisk = _gl.elementFromHtml(`
                    <svg class="asterisk-icon icon" width="20" height="22" viewBox="0 0 20 22">
                        <use href="#asterisk"></use>
                    </svg>
                `)
                item.textContent = ''
                item.appendChild(asterisk)
            })

            wrapper.classList.add('wrong-code')
            setTimeout(() => {
                wrapper.classList.remove('wrong-code')
            }, 500)
            instance.audio.playSound('wrong')
        }
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.onkeydown = null
        document.querySelector('.code-unlock')?.remove()
    }
}