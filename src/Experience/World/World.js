import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'

export default class World {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {

            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
        })
    }

    update() {
        if (this.controlRoom) {
            this.controlRoom.update()
        }
    }
}