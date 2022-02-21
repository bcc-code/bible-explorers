import Experience from "./Experience.js";

let codeUnlock = null

export default class CodeUnlock {
    constructor() {
        // Singleton
        if (codeUnlock)
            return codeUnlock

        codeUnlock = this
        codeUnlock.experience = new Experience()

        codeUnlock.htmlEl = document.createElement("div");
        codeUnlock.htmlEl.className = "overlay visible";
        codeUnlock.htmlEl.innerHTML = CodeUnlock.getHTML();
        document.body.appendChild(codeUnlock.htmlEl);
        
        codeUnlock.el = {
            code: codeUnlock.htmlEl.querySelector(".code-unlock__input"),
            numbers: codeUnlock.htmlEl.querySelectorAll(".code-unlock__btn--number"),
            backspace: codeUnlock.htmlEl.querySelector(".code-unlock__btn--backspace"),
            confirm: codeUnlock.htmlEl.querySelector(".code-unlock__btn--confirm")
        };
        codeUnlock.secretCode = "1234"
        
        codeUnlock.el.numbers.forEach(function(number) {
            number.addEventListener("click", () => {
                codeUnlock.add(number.textContent)
            })
        });
        
        codeUnlock.el.backspace.addEventListener("click", codeUnlock.remove);
        codeUnlock.el.confirm.addEventListener("click", codeUnlock.checkCode);

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
                codeUnlock.add(e.key)
            }
            else if (e.key === 'Backspace') {
                codeUnlock.remove()
            }
            else if (e.key === 'Enter') {
                codeUnlock.checkCode()
            }
        }
    }

    add(number) {
        if (codeUnlock.el.code.textContent.length == codeUnlock.secretCode.length) return;
        codeUnlock.el.code.textContent += number;
    }

    remove() {
        if (codeUnlock.el.code.textContent == "") return;
        codeUnlock.el.code.textContent = codeUnlock.el.code.textContent.slice(0, -1);
    }

    checkCode() {
        if (codeUnlock.el.code.textContent == codeUnlock.secretCode) {
            codeUnlock.experience.player.playCodeUnlockedSound()
            codeUnlock.destroy();
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
        codeUnlock.htmlEl.remove();
        codeUnlock = null;
    }
}