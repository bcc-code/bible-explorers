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
import _lang from './Utils/Lang.js'
import _e from './Utils/Events.js'

let instance = null

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
        this.pointer = new MouseMove()

        document.addEventListener(_e.ACTIONS.USER_DATA_FETCHED, () => {
            this.resources = new Resources(sources)
            this.world = new World()
        })

        // Time animation event
        this.videoIsPlaying = false
        this.gameIsOn = false

        this.navigation = {
            prev: document.querySelector('#prev-step'),
            next: document.querySelector('#next-step'),
            container: document.querySelector('#chapter-navigation'),
        }

        this.interface = {
            mainScreen: document.querySelector('#main-screen_content'),
            helperScreen: document.querySelector('#helper-screen_content'),
            closedCaption: document.querySelector('#closed-caption'),
            gameContainer: document.querySelector('#games-wrapper'),
            tasksDescription: document.querySelector('#tasks-description'),
            chaptersList: document.querySelector('#chapters-list'),
            chaptersDescription: document.querySelector('#chapters-description'),
        }

        const celebrateCanvas = _gl.elementFromHtml(`<canvas class="celebrate" width="${this.sizes.width}" height="${this.sizes.height}"></canvas>`)
        document.querySelector('#app').appendChild(celebrateCanvas)

        this.celebrate = confetti.create(celebrateCanvas, {
            resize: true,
            useWorker: true,
        })

        const redirectToLanguage = this.getUrlParameter('language')
        if (redirectToLanguage) {
            window.history.replaceState({}, document.title, window.location.pathname)
            _lang.updateLanguage(redirectToLanguage)
        }
    }

    setAppView(attr) {
        document.querySelector('#app').setAttribute('data-view', attr)
    }

    update() {
        this.world.update()
        this.stats.update()
    }

    getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=')

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1])
            }
        }
        return false
    }
}
