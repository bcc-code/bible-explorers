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

        instance.chapters.backBtn.children[0].innerText = _s.journey.back
        this.chapters.backBtn.addEventListener("click", this.goToLandingScreen)

        instance.welcome.landingScreen.classList.add('visible')

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
        const episodeActions = document.querySelector('.episode.selected')
        episodeActions.classList.add('visible')

        this.buttons.completed = document.getElementById("completed")


        if (this.episodeProgress() == 0) {
            instance.buttons.restart.classList.remove('visible')
        }
        else {
            instance.buttons.restart.classList.add('visible')
        }

        if (this.episodeProgress() == this.selectedEpisode.program.length) {
            instance.buttons.completed.classList.add('visible')
            instance.buttons.start.classList.remove('visible')
        }
        else {
            instance.buttons.start.classList.add('visible')
            instance.buttons.completed.classList.remove('visible')
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
            instance.welcome.landingScreen.classList.add('visible')
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
            <div class="episode__number">${index + 1}</div>
            <div class="episode__thumbnail">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 961 160" class="episode__image" preserveAspectRatio="none">
                    <defs>
                        <clipPath id="maskImage" clipPathUnits="userSpaceOnUse">
                            <path
                                d="M961 54.91v78.94c0 4.35-1.77 8.43-4.99 11.51l-10.36 9.88c-3.22 3.07-7.5 4.76-12.05 4.76H.98L0 0h673.95c4.55 0 8.83 1.69 12.04 4.76l13.63 13c4.17 3.98 9.71 6.17 15.61 6.17h213.31c4.55 0 8.82 1.69 12.05 4.77l15.42 14.71c3.22 3.07 4.99 7.16 4.99 11.5Z" />
                        </clipPath>
                    </defs>
                    <g clip-path="url(#maskImage)">
                        <image width="100%" fill="none" y="-50%" class="" href="${episode.thumbnail}"/>
                    </g>
                </svg>
                <div class="button button__round episode__status">
                    <i class="icon icon-play-solid"></i>
                    <i class="icon icon-lock-solid"></i>
                </div>
                <div class="episode__heading">
                    <span class="episode__title">${episode.title}</span>
                    <span class="episode__completed" id="completed">${_s.journey.congratulations}</span>
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