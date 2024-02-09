import * as THREE from 'three'
import confetti from 'canvas-confetti'
import { Debug, StatsModule } from './Utils/Debug.js'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Resources from './Utils/Resources.js'
import MouseMove from './Utils/MouseMove.js'
import sources from './Sources.js'
import Menu from './Components/Menu.js'
import World from './World/World.js'
import FAQ from './Components/FAQ.js'
import _gl from './Utils/Globals.js'
import FlappyBird from './Games/FlappyBirdV3.js'

let instance = null
let flappyBirdGame = null // Variable to hold the game instance

export default class Experience {
    constructor() {
        // Singleton
        if (instance) return instance

        instance = this

        // Global access
        window.experience = this

        // Options
        this.faq = new FAQ()

        // Setup
        this.settings = new Menu()
        this.debug = new Debug()
        this.stats = new StatsModule()
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.resources = new Resources(sources)
        this.pointer = new MouseMove()
        this.world = new World()
        this.auth0 = {}

        // Time animation event
        this.videoIsPlaying = false
        this.gameIsOn = false

        // Get the button element
        const tryButton = document.getElementById('try-game')

        tryButton.addEventListener('click', () => {
            if (flappyBirdGame) {
                flappyBirdGame.remove()
                flappyBirdGame = null
                tryButton.textContent = 'Try flappy bird'
            } else {
                flappyBirdGame = new FlappyBird()
                tryButton.textContent = 'Exit the game'
            }
        })

        this.navigation = {
            prev: document.querySelector('#prev-step'),
            next: document.querySelector('#next-step'),
            container: document.querySelector('#chapter-navigation'),
        }

        this.icons = {
            prev: `<svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#arrow-left-long-solid" fill="currentColor"></use></svg>`,
            next: `<svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#arrow-right-long-solid" fill="currentColor"></use></svg>`,
        }

        this.interface = {
            bigScreen: document.querySelector('#big-screen'),
            smallScreen: document.querySelector('#small-screen'),
            closedCaption: document.querySelector('#closed-caption'),
            gameContainer: document.querySelector('#games-wrapper'),
            chaptersList: document.querySelector('#chapters-list'),
            chaptersDescription: document.querySelector('#chapters-description'),
        }

        const celebrateCanvas = _gl.elementFromHtml(`<canvas class="celebrate" width="${this.sizes.width}"  height="${this.sizes.height}"></canvas>`)
        document.querySelector('#app').appendChild(celebrateCanvas)

        this.celebrate = confetti.create(celebrateCanvas, {
            resize: true,
            useWorker: true,
        })
    }

    setAppView(attr) {
        document.querySelector('#app').setAttribute('data-view', attr)
    }

    update() {
        this.world.update()
        this.stats.update()
    }
}
