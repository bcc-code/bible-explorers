import Experience from "../Experience.js";

let instance = null

export default class CodeUnlock {
    constructor() {
        instance = this
        this.experience = new Experience()
        this.world = this.experience.world
    }

    open() {
        this.world.program.canClick = false

        instance.htmlEl = document.createElement("div");
        instance.htmlEl.className = "overlay visible";
        instance.htmlEl.innerHTML = CodeUnlock.getHTML();
        document.body.appendChild(instance.htmlEl);
        
        instance.el = {
            code: instance.htmlEl.querySelector(".code-unlock__input"),
            numbers: instance.htmlEl.querySelectorAll(".code-unlock__btn--number"),
            backspace: instance.htmlEl.querySelector(".code-unlock__btn--backspace"),
            confirm: instance.htmlEl.querySelector(".code-unlock__btn--confirm")
        };
        instance.secretCode = "1234"
        
        instance.el.numbers.forEach(function(number) {
            number.addEventListener("mousedown", () => {
                instance.add(number.textContent)
            })
        });
        
        instance.el.backspace.addEventListener("mousedown", instance.remove);
        instance.el.confirm.addEventListener("mousedown", instance.checkCode);

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

    add(number) {
        if (instance.el.code.textContent.length == instance.secretCode.length) return;
        instance.el.code.textContent += number;
    }

    remove() {
        if (instance.el.code.textContent == "") return;
        instance.el.code.textContent = instance.el.code.textContent.slice(0, -1);
    }

    checkCode() {
        if (instance.el.code.textContent == instance.secretCode) {
            instance.world.program.timer.destroy()
            instance.world.audio.playCodeUnlockedSound()
            instance.world.program.canClick = true
            instance.world.program.advance()
            instance.destroy();
        } else {
            console.log("Incorrect code");
        }
    }
  
    static getHTML() {
        return `
            <div class="code-unlock">
                <div class="code-unlock__container">
                    <div class="code-unlock__screen">
                        <span class="code-unlock__input"></span>
                    </div>
                    <div class="code-unlock__grid">
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">1</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">2</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">3</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">4</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">5</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--backspace">
                            <span class="material-icons">arrow_back</span>
                        </button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">6</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">7</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">8</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">9</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--number">0</button>
                        <button type="button" class="code-unlock__btn code-unlock__btn--confirm">
                            <span class="material-icons">check</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    destroy() {
        instance.htmlEl.remove();
    }
}