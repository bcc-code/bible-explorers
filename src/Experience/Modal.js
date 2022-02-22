let modal = null

export default class Modal {
    constructor(html) {
        modal = this

        modal.htmlEl = document.createElement("div");
        modal.htmlEl.className = "modal";
        modal.htmlEl.innerHTML = Modal.generateHtml(html);
        document.body.appendChild(modal.htmlEl);

        modal.el = {
            overlay: modal.htmlEl.querySelector(".overlay"),
            close: modal.htmlEl.querySelector(".close")
        };

        modal.el.overlay.addEventListener("mousedown", () => {
            modal.destroy();
        });

        modal.el.close.addEventListener("mousedown", () => {
            modal.destroy();
        });
    }

    destroy() {
        modal.htmlEl.remove()
        modal = null
    }

    static generateHtml(html) {
        return `
            <div class="overlay"></div>
            <div class="screen">
                <div class="screen__content">
                    <span class="close">×</span>
                    ${html}
                </div>
            </div>
        `
    }
}