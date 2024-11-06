import * as THREE from 'three'
import confetti from 'canvas-confetti'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Resources from './Utils/Resources.js'
import sources from './Sources.js'
import Menu from './Components/Menu.js'
import World from './World.js'
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

        // Setup
        this.settings = new Menu()
        this.sizes = new Sizes()
        this.time = new Time()

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
            mainScreen: document.querySelector('.screen-bottom_content'),
            helperScreen: document.querySelector('.screen-right_content'),
            closedCaption: document.querySelector('#closed-caption'),
            gameContainer: document.querySelector('#games-wrapper'),
            tasksDescription: document.querySelector('#tasks-description'),
            chaptersList: document.querySelector('#chapters-list'),
            chaptersDescription: document.querySelector('#chapters-description'),
        }

        const celebrateCanvas = _gl.elementFromHtml(
            `<canvas class="celebrate" width="${this.sizes.width}" height="${this.sizes.height}"></canvas>`
        )
        document.querySelector('#app').appendChild(celebrateCanvas)

        this.celebrate = confetti.create(celebrateCanvas, {
            resize: true,
            useWorker: true,
        })

        this.getUrlParameter = (sParam) => {
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

        const redirectToLanguage = instance.getUrlParameter('language')
        if (redirectToLanguage) {
            const requiredToLogin = instance.getUrlParameter('login')
            const redirectUrl =
                window.location.href.split('?')[0] + (requiredToLogin === true ? '?login' : '')
            window.history.replaceState({}, document.title, redirectUrl)
            _lang.updateLanguage(redirectToLanguage)
        }

        this.addEventListeners()
    }

    addEventListeners() {
        document.addEventListener(_e.ACTIONS.CHAPTER_STARTED, instance.freezeNavigation)
        document.addEventListener(_e.ACTIONS.LOADING_SONG, instance.freezeNavigation)

        document.addEventListener(_e.ACTIONS.BG_MUSIC_LOADED, instance.releaseNavigation)
        document.addEventListener(_e.ACTIONS.SONG_LOADED, instance.releaseNavigation)
    }

    freezeNavigation() {
        instance.navigation.prev.disabled = true
        instance.navigation.next.disabled = true
    }

    releaseNavigation() {
        instance.navigation.prev.disabled = false
        instance.navigation.next.disabled = false
    }

    setAppView(attr) {
        document.querySelector('#app').setAttribute('data-view', attr)
    }

}
