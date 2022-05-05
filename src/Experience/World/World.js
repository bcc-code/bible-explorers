import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import Audio from '../Extras/Audio.js'
import ProgressBar from '../Extras/ProgressBar.js'
import Program from '../Progress/Program.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import Points from './Points.js'
import Highlight from './Highlight.js'
import Offline from '../Utils/Offline.js'

let instance = null

export default class World {
    constructor() {
        this.offline = new Offline()
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
            categories: document.querySelector(".categories.list"),
            episodes: document.querySelector(".episodes.list"),
            backBtn: document.querySelector(".back_to"),
            data: []
        }

        // Welcome screen
        this.welcome = {
            loadingScreen: document.getElementById("loading-screen"),
            landingScreen: document.getElementById("landing-screen"),
            episodeScreen: document.getElementById("episodes-screen"),
            introduction: document.getElementById("introduction"),
            topBar: document.getElementById("topBar")
        }

        this.buttons = {
            start: document.getElementById("start-journey"),
            restart: document.getElementById("restart-journey")
        }

        this.resources.fetchApiThenCache(_api.getBiexEpisodes(), this.setCategories)

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.points = new Points()
            this.highlight = new Highlight()
            this.audio = new Audio()

            this.buttons.start.addEventListener('click', this.startJourney)
            this.buttons.restart.addEventListener('click', this.restartJourney)
        })

        this.welcome.introduction.innerText = _s.introduction
        this.buttons.start.innerHTML = "<span>" + _s.journey.start + "</span>"
        this.buttons.restart.innerHTML = "<span>" + _s.journey.restart + "</span>"

        this.homeButton = document.getElementById('go-home')
        this.homeButton.addEventListener("click", this.goHome)

        this.chapters.backBtn.addEventListener("click", this.goToLandingScreen)
        this.chapters.backBtn.children[0].innerText = _s.journey.back
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
        console.log('s');

        if (this.episodeProgress() == 0) {
            instance.buttons.restart.classList.remove('visible')
        }
        else {
            instance.buttons.restart.classList.add('visible')
        }

        if (this.episodeProgress() == this.selectedEpisode.program.length) {
            instance.buttons.start.classList.remove('visible')
        }
        else {
            instance.buttons.start.classList.add('visible')
        }

        if (this.episodeProgress() > 0 && this.episodeProgress() < this.selectedEpisode.program.length) {
            instance.buttons.start.innerHTML = "<span>" + _s.journey.continue + "</span>"
        }
    }

    setCategories(data) {
        if (!data) return

        instance.chapters.data = data

        for (const [category, data] of Object.entries(instance.chapters.data)) {
            instance.setCategoryHtml({ name: data.name, slug: data.slug })
        }

        instance.selectCategoryListeners()
    }

    setCategoryHtml(category) {

        const categoryHtml = document.createElement("div")
        categoryHtml.className = "category button button__default"
        categoryHtml.setAttribute("data-slug", category.slug)
        categoryHtml.innerHTML = "<span>" + category.name + "</span>"
        instance.chapters.categories.appendChild(categoryHtml)

        const getDivider = document.querySelector('.categories .divider')

        if (!getDivider) {
            const divider = document.createElement("span")
            divider.className = "divider"
            instance.chapters.categories.appendChild(divider)
        }
    }

    selectCategoryListeners() {
        document.querySelectorAll(".category").forEach(function (category) {
            category.addEventListener("click", () => {
                const categorySlug = category.getAttribute('data-slug')
                instance.setEpisodes(instance.chapters.data[categorySlug]['episodes'])
            })
        })
    }

    goToLandingScreen() {
        instance.unselectAllEpisode()
        instance.placeholderEpisodeData()

        instance.chapters.episodes.innerHTML = ''
        instance.welcome.landingScreen.classList.add('visible')
        instance.welcome.episodeScreen.classList.remove('visible')
    }

    setEpisodes(data) {
        data.forEach((episode, index) => {
            instance.setEpisodeHtml(episode, index)
            instance.welcome.landingScreen.classList.remove('visible')
            instance.welcome.episodeScreen.classList.add('visible')
        })

        instance.selectEpisodeListeners()

    }

    setEpisodeHtml(episode, index) {
        let episodeHtml = document.createElement("div")

        let episodeClasses = "episode"
        episodeClasses += episode.status == "future" ? " locked" : ""
        episodeHtml.className = episodeClasses

        this.offline.markEpisodeIfAvailableOffline(episode)

        episodeHtml.setAttribute("data-id", episode.id)
        episodeHtml.setAttribute("data-slug", episode.category)

        episodeHtml.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" id="a" viewBox="0 0 990.75 176.94" class="episode__background">
                <defs>
                    <linearGradient id="gradient" x1="5.02" x2="961.72" y1="88.47" y2="88.47" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#131a43"/>
                        <stop offset="1" stop-color="#412251"/>
                    </linearGradient>
                    <clipPath id="maskImage" clipPathUnits="userSpaceOnUse">
                        <path d="M961.72 62.29v82.37c0 4.53-1.76 8.79-4.97 12l-10.31 10.31a16.853 16.853 0 0 1-12 4.97H6L5.02 5h670.93c4.53 0 8.79 1.76 11.99 4.97l13.57 13.56c4.15 4.15 9.67 6.44 15.54 6.44H929.4c4.53 0 8.79 1.76 12 4.97l15.35 15.35c3.21 3.21 4.97 7.47 4.97 12Z" />
                    </clipPath>
                </defs>

                <path class="box" d="M961.72 62.29v82.37c0 4.53-1.76 8.79-4.97 12l-10.31 10.31a16.853 16.853 0 0 1-12 4.97H6L5.02 5h670.93c4.53 0 8.79 1.76 11.99 4.97l13.57 13.56c4.15 4.15 9.67 6.44 15.54 6.44H929.4c4.53 0 8.79 1.76 12 4.97l15.35 15.35c3.21 3.21 4.97 7.47 4.97 12Z"/>
                
                <g clip-path="url(#maskImage)">
                    <image width="100%" fill="none" y="-50%" class="" href="${episode.thumbnail}"/>
                </g>

                <rect width="120" height="176.94" x="1"></rect>
                <text class="episode__number" x="50" y="88.47" fill="white" font-size="36" font-weight="bold">${index + 1}</text>
                <rect class="outline" width="5" height="176.94" x="120"></rect>

                <path class="outline" d="m973.97 150.09-.23-85.55c-.01-3.18 3.77-4.84 6.11-2.69l5.96 5.48c2.62 2.41 4.15 5.79 4.22 9.35l.72 59.05c.07 3.36-1.15 6.61-3.41 9.09l-7.03 7.7c-2.24 2.45-6.32.88-6.33-2.44ZM713.46.5l212.55.22c3.18 0 4.82 3.79 2.66 6.12l-5.51 5.93a13.094 13.094 0 0 1-9.37 4.17l-186.06.41a13.09 13.09 0 0 1-9.07-3.46l-7.67-7.07c-2.44-2.25-.84-6.32 2.47-6.32Z"/>

                <path class="outline" d="M960.29 46.76 944.93 31.4c-4.15-4.15-9.66-6.43-15.53-6.43H717.05c-4.54 0-8.8-1.77-12-4.97L691.48 6.43A21.823 21.823 0 0 0 675.95 0H0l1.02 176.94h933.42c5.87 0 11.38-2.28 15.53-6.43l10.32-10.32c4.15-4.14 6.43-9.66 6.43-15.53V62.29c0-5.87-2.28-11.38-6.43-15.53Zm1.43 97.9c0 4.53-1.76 8.79-4.97 12l-10.31 10.31a16.853 16.853 0 0 1-12 4.97H6L5.02 5h670.93c4.53 0 8.79 1.76 11.99 4.97l13.57 13.56c4.15 4.15 9.67 6.44 15.54 6.44H929.4c4.53 0 8.79 1.76 12 4.97l15.35 15.35c3.21 3.21 4.97 7.47 4.97 12v82.37Z"/>

                <path class="outline" d="M194.67 147.44H2.01v29h224.85l-12.63-20.38c-4.12-6.86-10.97-8.62-19.55-8.62ZM250.84 147.6l-2.7-.15c-7.05-.39-11.69 6.25-8.03 11.49l11.9 17.5h22l-16.24-25.2c-1.48-2.12-4.07-3.48-6.92-3.64ZM290.84 147.6l-2.7-.15c-7.05-.39-11.69 6.25-8.03 11.49l11.9 17.5h22l-16.24-25.2c-1.48-2.12-4.07-3.48-6.92-3.64ZM337.77 151.24c-1.48-2.12-4.07-3.48-6.92-3.64l-2.7-.15c-7.05-.39-11.69 6.25-8.03 11.49l11.9 17.5h22l-16.24-25.2Z" />

                <text class="episode__heading" x="160" y="88.47" fill="white" font-size="36" font-weight="bold">${episode.title}</text>

            </svg>
            
            <div class="button button__round episode__status">
                <i class="icon icon-play-solid"></i>
                <i class="icon icon-lock-solid"></i>
            </div>
            <div class="episode__download">
                <div class="button episode__offline">
                    <i class="icon icon-download-solid"></i>
                    <span>${_s.download}</span>
                </div>
                <div class="downloading-progress"><div class="progress-line"></div></div>
                <span class="downloading-label"></span>
                <span class="downloading-complete">${_s.offline}</span>
            </div>
            
        `
        instance.chapters.episodes.appendChild(episodeHtml)
    }


    setDescriptionHTML() {
        const episode = instance.selectedEpisode
        let descriptionHTML = document.createElement("div")
        descriptionHTML.classList.add('episode__description')
        descriptionHTML.setAttribute('data-id', episode.id)
        descriptionHTML.setAttribute('data-slug', episode.category)

        descriptionHTML.innerHTML = `
                <h2>${episode.title}</h2>
                <p>${episode.content}</p>
        `

        document.querySelector('.episodes__content').prepend(descriptionHTML)
    }

    selectEpisodeListeners(item) {
        document.querySelectorAll(".episode:not(.locked)").forEach((episode) => {
            episode.addEventListener("click", () => {

                const description = document.querySelector(".episode__description");

                if (description)
                    description.remove()

                instance.addClassToSelectedEpisode(episode)
                instance.updateSelectedEpisodeData(episode)
                instance.loadEpisodeTextures()
                instance.showMenuButtons()

                instance.setDescriptionHTML(episode)
            })
        })

        document.querySelectorAll(".episode:not(.locked) .episode__offline").forEach(function (episode) {
            episode.addEventListener("click", (event) => {
                instance.downloadEpisode(episode)
                event.stopPropagation()
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
            instance.resources.loadThemeVideos(instance.selectedEpisode.id, fileName)
        })
    }

    async downloadEpisode(episode) {
        if (!this.experience.auth0.isAuthenticated) return

        let episodeEl = episode.closest(".episode")
        const chapterId = episodeEl.getAttribute('data-id')
        const categorySlug = episodeEl.getAttribute('data-slug')
        const selectedEpisode = instance.chapters.data[categorySlug]['episodes'].filter((episode) => { return episode.id == chapterId })[0]

        episodeEl.classList.remove('download')
        episodeEl.classList.add('downloading')
        episodeEl.querySelector('.episode__offline span').innerText = _s.downloading

        await this.downloadAnimationFilms(selectedEpisode['data'], chapterId)
    }

    async downloadAnimationFilms(animationFilms, chapterId) {
        let episodesDownload = []

        animationFilms.forEach(async (film) => {
            const downloadUrl = await this.getEpisodeDownloadUrl(film)
            episodesDownload.push({ downloadUrl: downloadUrl, data: { name: film.id + '_video', episodeId: chapterId }})

            if (episodesDownload.length == animationFilms.length) {
                this.offline.downloadFromWeb(episodesDownload)
            }
        })
    }

    async getEpisodeDownloadUrl(film) {
        const claims = await this.experience.auth0.getIdTokenClaims();
        const idToken = claims.__raw;
        const locale = _lang.getLanguageCode()
        const episodeId = film.id.replace('episode-', '')

        var btvplayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale,
            access_token: idToken
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
    }

    restartJourney() {
        localStorage.removeItem("progress-theme-" + instance.selectedEpisode.id)
        localStorage.removeItem("answers-theme-" + instance.selectedEpisode.id)
        instance.startJourney()
    }

    finishJourney() {
        instance.showMenu()
        instance.buttons.start.classList.remove('visible')
        instance.buttons.restart.classList.add('visible')
    }

    showMenu() {
        document.body.classList.add('freeze')
        instance.audio.addBgMusicElement()
        instance.welcome.episodeScreen.classList.add('visible')
        instance.points.delete()
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        instance.welcome.episodeScreen.classList.remove('visible')
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