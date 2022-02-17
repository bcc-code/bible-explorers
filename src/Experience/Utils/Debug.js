import GUI from 'lil-gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'

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

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom)
    }

    update() {
        this.stats.update()
    }
}

export { Debug, StatsModule }