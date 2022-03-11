import * as THREE from 'three'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import Audio from '../Extras/Audio.js'
import ProgressBar from '../Extras/ProgressBar.js'
import Program from '../Progress/Program.js'
import Highlight from './Highlight.js'
import Info from '../Extras/Info.js'

let instance = null

export default class World {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        instance = this

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.controlRoom = new ControlRoom()
            this.highlight = new Highlight()
            this.audio = new Audio()
            this.environment = new Environment()

            this.welcome.startJourney.addEventListener("mousedown", this.startJourney)
            this.welcome.restartJourney.addEventListener("mousedown", this.restartJourney)
        })

        // Welcome screen
        this.welcome = {
            landingScreen: document.querySelector("#landing-screen"),
            congratulations: document.querySelector("#congratulations"),
            startJourney: document.querySelector("#start-journey"),
            restartJourney: document.querySelector("#restart-journey"),
        }

        // TODO: make this dynamic
        this.selectedEpisode = 1
        this.currentStep = localStorage.getItem(this.getId()) || 0

        if (this.currentStep == 0) {
            instance.welcome.startJourney.innerText = "Start tidsreise"
            instance.welcome.restartJourney.style.display = "none"
        } else {
            if (this.currentStep == 5) {
                instance.welcome.congratulations.style.display = "block"
                instance.welcome.startJourney.style.display = "none"
            } else {
                instance.welcome.startJourney.innerText = "Fortsett tidsreise"
            }
        }

        // Debug
        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    startJourney() {
        instance.welcome.landingScreen.style.display = "none"
        instance.audio.removeBgMusicElement()

        instance.program = new Program()
        instance.progressBar = new ProgressBar()
        instance.info = new Info()
    }

    restartJourney() {
        localStorage.removeItem("progress-episode-" + instance.selectedEpisode)
        instance.startJourney()
    }

    finishJourney() {
        instance.welcome.landingScreen.style.display = "flex"
        instance.welcome.congratulations.style.display = "block"
        instance.welcome.startJourney.style.display = "none"
    }

    getId() {
        return "progress-episode-" + this.selectedEpisode
    }

    update() {
        if (this.controlRoom) {
            this.controlRoom.update()
        }

        if (this.program) {
            this.program.video.update()
        }
    }

    addGUIControls() {
        const axesHelper = new THREE.AxesHelper(40)
        const gridHelper = new THREE.GridHelper(36, 36);
        axesHelper.visible = false
        gridHelper.visible = false
        this.scene.add(gridHelper, axesHelper);

        const helper = this.debug.ui.addFolder('Helpers')
        helper.close()
        helper.add(axesHelper, 'visible').name('Axes helper')
        helper.add(gridHelper, 'visible').name('Grid helper')
    }
}