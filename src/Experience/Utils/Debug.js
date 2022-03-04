import GUI from 'lil-gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import Experience from '../Experience'

class Debug {
    constructor() {
        this.active = window.location.hash === '#debug'

        if (this.active) {
            this.ui = new GUI()
        }
    }
}

class StatsModule {
    constructor() {
        this.experience = new Experience();
        this.stats = new Stats();

        if (this.experience.debug.active) {
            document.body.classList.add('debug')
            document.body.appendChild(this.stats.dom)
        } else {
            document.body.classList.remove('debug')
        }
    }

    update() {
        if (this.experience.debug.active) {
            this.stats.update()
        }
    }
}

export { Debug, StatsModule }