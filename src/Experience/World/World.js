import * as THREE from 'three'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import PointsOfInterests from '../Extras/PointsOfInterests.js'
import Video from '../Extras/Video.js'
import Audio from '../Extras/Audio.js'
import ProgressBar from '../Extras/ProgressBar.js'
import Program from '../Progress/Program.js'

let instance = null

export default class World {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.resources = this.experience.resources

        instance = this

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
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
        })

        // Start journey
        this.welcome = {
            landingScreen: document.querySelector("#landing-screen"),
            startJourney: document.querySelector("#start-journey"),
            restartJourney: document.querySelector("#restart-journey"),
        }
        this.welcome.startJourney.addEventListener("mousedown", this.startJourney)
        this.welcome.restartJourney.addEventListener("mousedown", this.restartJourney)

        this.selectedEpisode = 1
    }

    startJourney() {
        instance.welcome.landingScreen.remove()

        instance.program = new Program()
        instance.progressBar = new ProgressBar()
    }

    restartJourney() {
        localStorage.removeItem("progress-episode-" + instance.selectedEpisode)
        instance.startJourney()
    }

    update() {
        if (this.controlRoom) {
            this.controlRoom.update()
        }
    }
}