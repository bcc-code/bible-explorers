import Experience from "../Experience.js";

export default class MouseMove {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes

        this.position = {
            x: 0,
            y: 0
        }

        document.addEventListener('mousemove', (event) => {
            this.position.x = (event.clientX / this.sizes.width) * 2 - 1;
            this.position.y = - (event.clientY / this.sizes.height) * 2 + 1;
        })

    }
}