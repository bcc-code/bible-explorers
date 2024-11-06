export default class Button {
    constructor(text, id = '', enabled = true) {
        this.button = `<button class="button-grid" id="${id}" role="button" ${enabled ? '' : 'disabled'}>
            <div class="corner top-left"></div>
            <div class="edge top"></div>
            <div class="corner top-right"></div>
            <div class="edge left"></div>
            <div class="content">${text}</div>
            <div class="edge right"></div>
            <div class="corner bottom-left"></div>
            <div class="edge bottom"></div>
            <div class="corner bottom-right"></div>
        </button>`
    }

    getHtml() {
        return this.button
    }
}
