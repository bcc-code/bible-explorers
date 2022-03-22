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
const wpApi = "https://staging-bcckids.kinsta.cloud/wp-json/biex-episodes/get"

export default class World {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        instance = this

        this.selectedEpisode = {
            id: 0,
            program: null,
            data: null
        }
        this.episodeProgress = () => localStorage.getItem(this.getId()) || 0

        // Episodes
        this.episodes = {
            container: document.getElementById("episodes"),
            list: document.querySelector("#episodes .list"),
            data: []
        }
        this.httpGetAsync(wpApi, this.setEpisodes)

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
            landingScreen: document.getElementById("landing-screen"),
            congratulations: document.getElementById("congratulations"),
            startJourney: document.getElementById("start-journey"),
            restartJourney: document.getElementById("restart-journey"),
        }

        this.homeButton = document.getElementById('go-home')
        this.homeButton.addEventListener("mousedown", this.goHome)

        // Debug
        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    goHome() {
        instance.showMenuButtons()
        instance.showMenu()
    }

    setEpisodes(data) {
        instance.episodes.data = JSON.parse(data)
        instance.episodes.data.forEach((episode) => {
            instance.setEpisodeHtml(episode)
        })

        instance.selectEpisodeListeners()
        instance.selectLatestEpisode()
        instance.episodes.container.style.display = 'flex'
    }

    showMenuButtons() {
        if (this.episodeProgress() == 0) {
            instance.welcome.startJourney.innerText = "Start tidsreise"
            instance.welcome.restartJourney.style.display = "none"
        }
        else {
            instance.welcome.restartJourney.style.display = "block"
        }

        if (this.episodeProgress() == this.selectedEpisode.program.length) {
            instance.welcome.congratulations.style.display = "block"
            instance.welcome.startJourney.style.display = "none"
        }
        else {
            instance.welcome.congratulations.style.display = "none"
        }

        if (this.episodeProgress() > 0 && this.episodeProgress() < this.selectedEpisode.program.length) {
            instance.welcome.startJourney.innerText = "Fortsett tidsreise"
        }
    }

    setEpisodeHtml(episode) {
        let episodeHtml = document.createElement("div");
        episodeHtml.className = 'episode'
        episodeHtml.setAttribute("data-id", episode.id)
        episodeHtml.innerHTML = `
            <div class="thumbnail"><img src="${ episode.thumbnail }" /></div>
            <h3 class="title">${ episode.title }</h3>
        `
        this.episodes.list.appendChild(episodeHtml)
    }

    selectLatestEpisode() {
        instance.episodes.list.firstChild.dispatchEvent(new Event('mousedown'))
    }

    selectEpisodeListeners() {
        document.querySelectorAll(".episode").forEach(function(episode) {
            episode.addEventListener("mousedown", () => {
                instance.addClassToSelectedEpisode(episode)
                instance.updateSelectedEpisodeData(episode)
                instance.loadEpisodeTextures()
                instance.showMenuButtons()
            });
        });
    }

    addClassToSelectedEpisode(episode) {
        document.querySelectorAll(".episode").forEach(function(thisEpisode) {
            thisEpisode.classList.remove('selected')
        })
        episode.classList.add('selected')
    }

    updateSelectedEpisodeData(episode) {
        let episodeId = episode.getAttribute('data-id')
        instance.selectedEpisode = instance.episodes.data.filter((episode) => { return episode.id == episodeId })[0]
    }

    loadEpisodeTextures() {
        instance.selectedEpisode.data.forEach((animationFilm) => {
            const episodeId = animationFilm.type + '/' + animationFilm.id
            const fileName = animationFilm.type + '-' + animationFilm.id

            if (instance.resources.textureItems.hasOwnProperty(fileName))
                return

            instance.resources.loadVideosThumbnail(fileName, animationFilm.thumbnail)
            instance.resources.loadThemeVideos(fileName)
        })
    }

    startJourney() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()
        instance.info = new Info()
        instance.controlRoom.setUpTextures()
    }

    restartJourney() {
        localStorage.removeItem("progress-theme-" + instance.selectedEpisode.id)
        instance.startJourney()
    }

    finishJourney() {
        instance.showMenu()
        instance.welcome.congratulations.style.display = "block"
        instance.welcome.startJourney.style.display = "none"
        instance.welcome.restartJourney.style.display = "block"
    }

    showMenu() {
        document.body.classList.add('freeze')
        instance.welcome.landingScreen.style.display = "flex"
        instance.audio.addBgMusicElement()
        instance.homeButton.style.display = "none"
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        instance.welcome.landingScreen.style.display = "none"
        instance.audio.removeBgMusicElement()
        instance.homeButton.style.display = "block"
    }

    getId() {
        return "progress-theme-" + this.selectedEpisode.id
    }

    update() {
        if (this.controlRoom) {
            this.controlRoom.update()
        }

        if (this.program && this.program.video) {
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

    httpGetAsync(theUrl, callback, async = true) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        }
        xmlHttp.open("GET", theUrl, async);
        xmlHttp.send(null);
    }
}