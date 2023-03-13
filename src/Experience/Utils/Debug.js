import GUI from 'lil-gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import Experience from '../Experience'

class Debug {
    constructor() {
        this.experience = new Experience()

        this.developer = window.location.hash === '#debug'
        this.addPreviewMode = () => document.querySelector('body').classList.add('preview-mode')
        this.removePreviewMode = () => document.querySelector('body').classList.remove('preview-mode')
        this.onPreviewMode = () => document.querySelector('body').classList.contains('preview-mode')

        if (this.developer) {
            this.ui = new GUI()
            this.ui.close()
        }
    }
}

class StatsModule {
    constructor() {
        this.experience = new Experience()
        this.stats = new Stats()

        if (this.experience.debug.developer) {
            document.body.classList.add('debug')
            document.body.appendChild(this.stats.domElement)
        }
        else {
            document.body.classList.remove('debug')
        }
    }

    update() {
        if (this.experience.debug.developer) {
            this.stats.update()
        }
    }
}

export { Debug, StatsModule }