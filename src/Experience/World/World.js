import * as THREE from 'three'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import Audio from '../Extras/Audio.js'
import ProgressBar from '../Extras/ProgressBar.js'
import Program from '../Progress/Program.js'
import Info from '../Extras/Info.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import Points from '../Extras/Points.js'

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

        this.placeholderEpisodeData()
        this.episodeProgress = () => localStorage.getItem(this.getId()) || 0

        // Episodes
        this.chapters = {
            container: document.getElementById("chapters"),
            categories: document.querySelector(".categories.list"),
            episodes: document.querySelector(".episodes.list"),
            backBtn: document.querySelector(".back.button"),
            data: []
        }

        // Welcome screen
        this.welcome = {
            landingScreen: document.getElementById("landing-screen"),
            introduction: document.getElementById("introduction"),
        }

        this.resources.httpGetAsync(_api.getBiexEpisodes(), this.setCategories)

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.controlRoom = new ControlRoom()
            this.points = new Points()
            this.environment = new Environment()
            this.audio = new Audio()

            document.addEventListener('click', (el) => {
                const id = el.target.getAttribute('id')

                if (id == 'start-journey') {
                    this.startJourney()
                }

                if (id == 'restart-journey') {
                    this.restartJourney()
                }
            })
        })

        this.welcome.introduction.innerText = _s.introduction

        this.homeButton = document.getElementById('go-home')
        this.homeButton.addEventListener("mousedown", this.goHome)

        instance.chapters.backBtn.innerText = _s.journey.back
        this.chapters.backBtn.addEventListener("click", this.backToCategories)

    }

    placeholderEpisodeData() {
        instance.selectedEpisode = {
            id: 0,
            program: null,
            data: null
        }
    }

    goHome() {
        instance.showMenuButtons()
        instance.showMenu()
        instance.program.video.defocus()
        instance.camera.updateCameraTo()
        instance.program.updateIrisTexture('SLEEP')
    }

    showMenuButtons() {

        const episodeActions = document.querySelector('.episode__actions')
        episodeActions.classList.add('visible')

        this.welcome.startJourney = document.getElementById("start-journey")
        this.welcome.restartJourney = document.getElementById("restart-journey")
        this.welcome.completed = document.getElementById("completed")

        if (this.episodeProgress() == 0) {
            instance.welcome.restartJourney.style.display = "none"
        }
        else {
            instance.welcome.restartJourney.style.display = "block"
        }

        if (this.episodeProgress() == this.selectedEpisode.program.length) {
            instance.welcome.completed.style.display = "block"
            instance.welcome.startJourney.style.display = "none"
        }
        else {
            instance.welcome.startJourney.style.display = "block"
            instance.welcome.completed.style.display = "none"
        }

        if (this.episodeProgress() > 0 && this.episodeProgress() < this.selectedEpisode.program.length) {
            instance.welcome.startJourney.innerText = _s.journey.continue
        }
    }

    setCategories(data) {
        if (!data) return

        instance.chapters.data = JSON.parse(data)

        for (const [category, data] of Object.entries(instance.chapters.data)) {
            instance.setCategoryHtml({ name: data.name, slug: data.slug })
        }

        instance.selectCategoryListeners()

        instance.chapters.container.style.display = 'grid'
    }

    setCategoryHtml(category) {
        let categoryHtml = document.createElement("div")
        categoryHtml.className = "category"
        categoryHtml.setAttribute("data-slug", category.slug)
        categoryHtml.innerHTML = `<h3 class="category__title">${category.name}</h3>`
        instance.chapters.categories.appendChild(categoryHtml)
    }

    selectCategoryListeners() {
        document.querySelectorAll(".category").forEach(function (category) {
            category.addEventListener("mousedown", () => {
                instance.chapters.categories.style.display = 'none'

                const categorySlug = category.getAttribute('data-slug')
                instance.setEpisodes(instance.chapters.data[categorySlug]['episodes'])
            })
        })
    }

    backToCategories() {
        instance.chapters.categories.style.display = 'grid'
        instance.chapters.episodes.style.display = 'none'
        instance.chapters.episodes.innerHTML = ''
        instance.chapters.backBtn.style.display = 'none'
        instance.welcome.introduction.style.display = 'block'
        instance.unselectAllEpisode()
        instance.placeholderEpisodeData()
    }

    setEpisodes(data) {
        data.forEach((episode, index) => {
            instance.setEpisodeHtml(episode, index)
        })

        instance.selectEpisodeListeners()

        instance.chapters.backBtn.style.display = 'block'
        instance.chapters.episodes.style.display = 'grid'
        instance.welcome.introduction.style.display = 'none'
    }

    setEpisodeHtml(episode, index) {
        let episodeHtml = document.createElement("div")
        let episodeClasses = "episode"
        episodeClasses += episode.status == "future" ? " locked" : ""
        episodeHtml.className = episodeClasses
        episodeHtml.setAttribute("data-id", episode.id)
        episodeHtml.setAttribute("data-slug", episode.category)
        episodeHtml.innerHTML = `
            <div class="episode__number">${index + 1}</div>
            <div class="episode__thumbnail">
                <img src="${episode.thumbnail}" /> 
                <div class="episode__icon"><i class="icon icon-play-solid"></i> <i class="icon icon-lock-solid"></i> <i class="icon icon-download-solid"></i></div>
                <div class="episode__heading">
                    <span class="episode__title">${episode.title}</span>
                    <span class="episode__completed" id="completed">${_s.journey.congratulations}</span>
                </div>
            </div>
            <div class="episode__actions">
                <div class="button__restart-journey" id="restart-journey">${_s.journey.restart}</div>
                <div class="button__start-new-journey" id="start-journey">${_s.journey.start}</div>
            </div>
        `
        instance.chapters.episodes.appendChild(episodeHtml)
    }

    selectEpisodeListeners() {
        document.querySelectorAll(".episode:not(.locked)").forEach(function (episode) {
            episode.addEventListener("mousedown", () => {
                instance.addClassToSelectedEpisode(episode)
                instance.updateSelectedEpisodeData(episode)
                instance.loadEpisodeTextures()
                instance.showMenuButtons()
            })
        })

        document.querySelectorAll(".episode:not(.locked) .download").forEach(function (episode) {
            episode.addEventListener("mousedown", () => {
                instance.downloadEpisode(episode)
            })
        })
    }

    addClassToSelectedEpisode(episode) {
        instance.unselectAllEpisode()
        episode.classList.add('selected')
    }

    unselectAllEpisode() {
        document.querySelectorAll(".episode").forEach(function (thisEpisode) {
            thisEpisode.classList.remove('selected')
        })
    }

    updateSelectedEpisodeData(episode) {
        const episodeId = episode.getAttribute('data-id')
        const categorySlug = episode.getAttribute('data-slug')
        instance.selectedEpisode = instance.chapters.data[categorySlug]['episodes'].filter((episode) => { return episode.id == episodeId })[0]
    }

    loadEpisodeTextures() {
        instance.selectedEpisode.data.forEach((animationFilm) => {
            const fileName = animationFilm.type + '-' + animationFilm.id

            if (instance.resources.textureItems.hasOwnProperty(fileName))
                return

            instance.resources.loadVideosThumbnail(fileName, animationFilm.thumbnail)
            instance.resources.loadThemeVideos(fileName)
        })
    }

    async downloadEpisode(episode) {
        const episodeId = episode.closest(".episode").getAttribute('data-id')
        const claims = await experience.auth0.getIdTokenClaims();
        const idToken = claims.__raw;

        let videoUrls = []
        instance.chapters.categories.filter(episode => {
            return episode.id == episodeId
        })[0].data.forEach(async (animationFilm) => {
            const url = await this.getEpisodeDownloadUrl(animationFilm.id, idToken)
            console.log('downloadEpisode from ' + url)

            videoUrls.push(url)
        })
    }

    async getEpisodeDownloadUrl(videoName, token) {
        const episodeId = videoName.replace('episode-', '')
        const locale = _lang.getLanguageCode()

        var btvplayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale,
            access_token: token
        })

        const allLanguagesVideos = await btvplayer.api.getDownloadables('episode', episodeId)
        const myLanguageVideos = allLanguagesVideos.filter(video => { return video.language.code == locale })
        const bestQualityVideo = myLanguageVideos.reduce((prev, current) => (prev.sizeInMB > current.sizeInMB) ? prev : current)

        return await btvplayer.api.getDownloadable('episode', episodeId, bestQualityVideo.id)
    }

    startJourney() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()
        // instance.controlRoom.updateTextureScreen4x4()
    }

    restartJourney() {
        localStorage.removeItem("progress-theme-" + instance.selectedEpisode.id)
        localStorage.removeItem("answers-theme-" + instance.selectedEpisode.id)
        instance.startJourney()
    }

    finishJourney() {
        instance.showMenu()
        instance.welcome.congratulations.style.display = "block"
        instance.welcome.startJourney.style.display = "none"
        instance.welcome.restartJourney.style.display = "block"

        instance.welcome.congratulations.innerText = _s.journey.congratulations
    }

    showMenu() {
        document.body.classList.add('freeze')
        instance.audio.addBgMusicElement()
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        instance.audio.removeBgMusicElement()
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

        if (this.points) {
            this.points.update()
        }
    }

}