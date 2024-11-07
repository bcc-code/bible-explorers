import Frame from './Frame.js'

export default class Button {
    constructor(btn) {
        this.content = btn.content ? btn.content : ''
        this.id = btn.id ? btn.id : ''
        this.class = btn.class ? btn.class : ''
        this.type = btn.type ? btn.type : 'button'
        this.title = btn.title ? btn.title : ''
        this.enabled = btn.hasOwnProperty('enabled') ? btn.enabled : true
        this.data = ''

        if (btn.hasOwnProperty('data')) {
            for (const [key, value] of Object.entries(btn.data)) {
                this.data += `data-${key}="${value}" `
            }
        }
    }

    getHtml() {
        const frame = new Frame({
            content: this.content,
        })
        return `<button class="button-grid ${this.class}" id="${this.id}" type="${this.type}" title="${this.title}" ${this.enabled ? '' : 'disabled'} ${this.data} role="button">
            ${frame.getHtml()}
        </button>`
    }
}
