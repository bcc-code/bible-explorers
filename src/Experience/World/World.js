import * as THREE from 'three'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import PointsOfInterests from '../Extras/PointsOfInterests.js'
import Video from '../Extras/Video.js'
import Audio from '../Extras/Audio.js'
import ProgressBar from '../Extras/ProgressBar.js'
import Program from '../Progress/Program.js'


export default class World {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        if (this.experience.debug.active) {
            const axesHelper = new THREE.AxesHelper(20)
            const gridHelper = new THREE.GridHelper(20, 20);
            this.scene.add(gridHelper, axesHelper);
        }

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.video = new Video()
            this.audio = new Audio()
            this.program = new Program()
            this.progressBar = new ProgressBar()
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.pointsOfInterests = new PointsOfInterests()
        })
    }

    update() {
        if (this.controlRoom) {
            this.controlRoom.update()

            if (this.experience.loaded)
                this.pointsOfInterests.update()
        }
    }
}