import Experience from '../Experience'
import _gl from '../Utils/Globals'

export default class Calculator {
    constructor() {
        this.experience = new Experience()

        this.createRootElement()
        this.displayElement = this.rootElement.querySelector('#display')
    }

    createRootElement() {
        this.rootElement = _gl.elementFromHtml(
            `<div class="p-4 bg-bke-darkpurple border border-white  absolute top-20 left-20" id="calculator">
                <div class="display font-bold text-4xl bg-white text-bke-darkpurple p-2 mb-4 rounded-md" id="display">0</div>
                <div class="grid grid-cols-4">
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">7</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">8</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">9</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl" data-operation="/">/</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">4</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">5</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">6</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl" data-operation="*">*</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">1</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">2</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">3</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl" data-operation="+">+</button>
                    <button class="button bg-white/60 rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl" id="clear">C</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl digit">0</button>
                    <button class="button bg-white rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl" data-operation="-">-</button>
                    <button class="button bg-bke-orange rounded-full text-bke-darkpurple font-bold w-12 h-12 m-2 text-xl" id="equals">=</button>
                </div>
            </div>`
        )
    }

    bindEvents() {
        this.rootElement.querySelectorAll('.digit').forEach((button) => {
            button.addEventListener('click', () => this.appendNumber(button.textContent))
        })

        this.rootElement.querySelectorAll('[data-operation]').forEach((button) => {
            button.addEventListener('click', () => this.setOperator(button.dataset.operation))
        })

        this.rootElement.querySelector('#equals').addEventListener('click', () => this.calculate())
        this.rootElement.querySelector('#clear').addEventListener('click', () => this.clear())
        this.rootElement.querySelector('#decimal').addEventListener('click', () => this.appendDecimal())
    }

    appendNumber(number) {
        if (this.waitForSecondNumber) {
            this.displayElement.textContent = number
            this.waitForSecondNumber = false
        } else {
            this.displayElement.textContent = this.displayElement.textContent === '0' ? number : this.displayElement.textContent + number
        }
    }

    appendDecimal() {
        if (!this.displayElement.textContent.includes('.')) {
            this.displayElement.textContent += '.'
        }
    }

    setOperator(operator) {
        if (!this.waitForSecondNumber) {
            this.firstOperand = parseFloat(this.displayElement.textContent)
            this.operator = operator
            this.waitForSecondNumber = true

            this.displayElement.textContent = `${this.firstOperand} ${operator}`
        }
    }

    calculate() {
        let result
        const secondOperand = parseFloat(this.displayElement.textContent)
        switch (this.operator) {
            case '+':
                result = this.firstOperand + secondOperand
                break
            case '-':
                result = this.firstOperand - secondOperand
                break
            case '*':
                result = this.firstOperand * secondOperand
                break
            case '/':
                result = this.firstOperand / secondOperand
                break
            default:
                return
        }
        this.displayElement.textContent = result
        this.operator = null
        this.waitForSecondNumber = false
    }

    clear() {
        this.displayElement.textContent = '0'
        this.firstOperand = null
        this.operator = null
        this.waitForSecondNumber = false
    }

    show() {
        document.querySelector('#app').append(this.rootElement)

        this.clear()
        this.bindEvents()
    }

    remove() {
        if (this.rootElement) this.rootElement.remove()
        this.rootElement = null
    }
}
