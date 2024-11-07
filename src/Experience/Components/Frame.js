export default class Frame {
    constructor(frame) {
        this.content = frame.content ? frame.content : ''
        this.edgeTop = frame.edgeTop ? frame.edgeTop : ''
    }

    getHtml() {
        return `
            <div class="corner top-left"></div>
            <div class="edge top">${this.edgeTop}</div>
            <div class="corner top-right"></div>
            <div class="edge left"></div>
            <div class="content">${this.content}</div>
            <div class="edge right"></div>
            <div class="corner bottom-left"></div>
            <div class="edge bottom"></div>
            <div class="corner bottom-right"></div>
        `
    }
}
