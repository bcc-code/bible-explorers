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

        this.placeholderChapterData()
        this.chapterProgress = () => localStorage.getItem(this.getId()) || 0

        // Chapters
        this.menu = {
            categories: document.querySelector(".categories.list"),
            chapters: document.querySelector(".chapters.list"),
            chapterItems: document.querySelector(".chapter__items"),
            chapterContent: document.querySelector(".chapter__content"),
            backBtn: document.querySelector(".back_to"),
            chaptersData: []
        }

        // Welcome screen
        this.welcome = {
            loadingScreen: document.getElementById("loading-screen"),
            conceptDescription: document.getElementById("concept-description"),
            loading: document.querySelector(".loader"),
            quality: {
                container: document.querySelector("#quality"),
                title: document.querySelector(".quality__title"),
                low: document.querySelector(".quality[data-name='low'] span"),
                medium: document.querySelector(".quality[data-name='medium'] span"),
                high: document.querySelector(".quality[data-name='high'] span")
            },
            landingScreen: document.getElementById("landing-screen"),
            chaptersScreen: document.getElementById("chapters-screen"),
            introduction: document.getElementById("introduction"),
            topBar: document.getElementById("topBar")
        }

        this.buttons = {
            start: document.getElementById("start-chapter"),
            restart: document.getElementById("restart-chapter")
        }

        this.welcome.loading.querySelector('span').innerText = _s.loading
        this.welcome.conceptDescription.innerText = _s.conceptDescription

        // Quality
        this.welcome.quality.title.innerText = _s.qualities.title
        this.welcome.quality.low.innerText = _s.qualities.low
        this.welcome.quality.medium.innerText = _s.qualities.medium
        this.welcome.quality.high.innerText = _s.qualities.high

        document.querySelectorAll(".qualities.list .quality.button").forEach(function (quality) {
            quality.addEventListener("click", () => {
                quality.classList.add('selected')
                instance.selectedQuality = quality.getAttribute('data-name')
                instance.goToAllChapters()
            })
        })

        this.resources.fetchApiThenCache(_api.getBiexChapters(), this.setCategories)

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.points = new Points()
            this.highlight = new Highlight()
            this.audio = new Audio()

            this.buttons.start.addEventListener('click', this.startChapter)
            this.buttons.restart.addEventListener('click', this.restartChapter)

            setTimeout(function () {
                instance.welcome.loading.style.opacity = 0
                instance.welcome.quality.container.style.display = "block"
                instance.welcome.topBar.style.display = "flex"

                setTimeout(function () {
                    instance.welcome.loading.style.display = "none"
                }, 1000)
            }, 1000)
        })

        this.welcome.introduction.innerText = _s.introduction
        this.buttons.start.innerHTML = "<span>" + _s.journey.start + "</span>"
        this.buttons.restart.innerHTML = "<span>" + _s.journey.restart + "</span>"

        this.homeButton = document.getElementById('go-home')
        this.homeButton.addEventListener("click", this.goHome)

        this.menu.backBtn.addEventListener("click", this.goToLandingScreen)
        this.menu.backBtn.children[0].innerText = _s.journey.back
    }

    goToAllChapters() {
        instance.welcome.loadingScreen.style.display = "none"
        instance.welcome.landingScreen.classList.add('visible')
    }

    placeholderChapterData() {
        instance.selectedChapter = {
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
    }

    showMenuButtons() {
        if (this.chapterProgress() == 0) {
            instance.buttons.restart.classList.remove('visible')
        }
        else {
            instance.buttons.restart.classList.add('visible')
        }

        if (this.chapterProgress() == this.selectedChapter.program.length) {
            instance.buttons.start.classList.remove('visible')
        }
        else {
            instance.buttons.start.classList.add('visible')
        }

        if (this.chapterProgress() > 0 && this.chapterProgress() < this.selectedChapter.program.length) {
            instance.buttons.start.innerHTML = "<span>" + _s.journey.continue + "</span>"
        }
    }

    setCategories(result) {
        if (result.hasOwnProperty('message')) return

        instance.menu.chaptersData = result

        for (const [category, data] of Object.entries(instance.menu.chaptersData)) {
            instance.setCategoryHtml({ name: data.name, slug: data.slug })
        }

        instance.selectCategoryListeners()
    }

    setCategoryHtml(category) {
        const categoryHtml = document.createElement("div")
        categoryHtml.className = "category button button__default"
        categoryHtml.setAttribute("data-slug", category.slug)
        categoryHtml.innerHTML = "<span>" + category.name + "</span>"
        instance.menu.categories.appendChild(categoryHtml)

        const getDivider = document.querySelector('.categories .divider')

        if (!getDivider) {
            const divider = document.createElement("span")
            divider.className = "divider"
            instance.menu.categories.appendChild(divider)
        }
    }

    selectCategoryListeners() {
        document.querySelectorAll(".category").forEach(function (category) {
            category.addEventListener("click", () => {
                const categorySlug = category.getAttribute('data-slug')
                instance.setChapters(instance.menu.chaptersData[categorySlug]['chapters'])
            })
        })
    }

    goToLandingScreen() {
        instance.unselectAllChapters()
        instance.placeholderChapterData()
        instance.removeDescriptionHtml()

        instance.menu.chapters.innerHTML = ''
        instance.welcome.landingScreen.classList.add('visible')
        instance.welcome.chaptersScreen.classList.remove('visible')
    }

    setChapters(data) {
        data.forEach((chapter, index) => {
            instance.setChapterHtml(chapter, index)
            instance.welcome.landingScreen.classList.remove('visible')
            instance.welcome.chaptersScreen.classList.add('visible')
        })

        instance.selectChapterListeners()

    }

    setChapterHtml(chapter, index) {
        let chapterHtml = document.createElement("div")

        let chapterClasses = "chapter"
        chapterClasses += chapter.status == "future" ? " locked" : ""
        chapterHtml.className = chapterClasses

        this.offline.markChapterIfAvailableOffline(chapter)

        chapterHtml.setAttribute("data-id", chapter.id)
        chapterHtml.setAttribute("data-slug", chapter.category)

        chapterHtml.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" id="a" viewBox="0 0 990.75 176.94" class="chapter__background">
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
                    <image width="100%" fill="none" y="-50%" class="" href="${chapter.thumbnail}"/>
                </g>

                <rect width="120" height="176.94" x="1"></rect>
                <text class="chapter__number" x="50" y="88.47" fill="white" font-size="40" font-family="Berlin Sans FB">${index + 1}</text>
                <rect class="outline" width="5" height="175.94" x="120" y="1"></rect>

                <path class="outline" d="m973.97 150.09-.23-85.55c-.01-3.18 3.77-4.84 6.11-2.69l5.96 5.48c2.62 2.41 4.15 5.79 4.22 9.35l.72 59.05c.07 3.36-1.15 6.61-3.41 9.09l-7.03 7.7c-2.24 2.45-6.32.88-6.33-2.44ZM713.46.5l212.55.22c3.18 0 4.82 3.79 2.66 6.12l-5.51 5.93a13.094 13.094 0 0 1-9.37 4.17l-186.06.41a13.09 13.09 0 0 1-9.07-3.46l-7.67-7.07c-2.44-2.25-.84-6.32 2.47-6.32Z"/>

                <path class="outline" d="M960.29 46.76 944.93 31.4c-4.15-4.15-9.66-6.43-15.53-6.43H717.05c-4.54 0-8.8-1.77-12-4.97L691.48 6.43A21.823 21.823 0 0 0 675.95 0H0l1.02 176.94h933.42c5.87 0 11.38-2.28 15.53-6.43l10.32-10.32c4.15-4.14 6.43-9.66 6.43-15.53V62.29c0-5.87-2.28-11.38-6.43-15.53Zm1.43 97.9c0 4.53-1.76 8.79-4.97 12l-10.31 10.31a16.853 16.853 0 0 1-12 4.97H6L5.02 5h670.93c4.53 0 8.79 1.76 11.99 4.97l13.57 13.56c4.15 4.15 9.67 6.44 15.54 6.44H929.4c4.53 0 8.79 1.76 12 4.97l15.35 15.35c3.21 3.21 4.97 7.47 4.97 12v82.37Z"/>

                <path class="outline" d="M194.67 147.44H2.01v29h224.85l-12.63-20.38c-4.12-6.86-10.97-8.62-19.55-8.62ZM250.84 147.6l-2.7-.15c-7.05-.39-11.69 6.25-8.03 11.49l11.9 17.5h22l-16.24-25.2c-1.48-2.12-4.07-3.48-6.92-3.64ZM290.84 147.6l-2.7-.15c-7.05-.39-11.69 6.25-8.03 11.49l11.9 17.5h22l-16.24-25.2c-1.48-2.12-4.07-3.48-6.92-3.64ZM337.77 151.24c-1.48-2.12-4.07-3.48-6.92-3.64l-2.7-.15c-7.05-.39-11.69 6.25-8.03 11.49l11.9 17.5h22l-16.24-25.2Z" />

                <text class="chapter__heading" x="160" y="88.47" font-family="Berlin Sans FB" fill="white" font-size="40">${chapter.title}</text>
                <text class="chapter__date" x="160" y="112.47" font-family="Archivo" fill="white" font-size="16">${chapter.date}</text>

                <foreignObject x="798.75" y="52.94" width="96" height="96">
                    <div class="button button__round chapter__status">
                        <i class="icon icon-play-solid"></i>
                        <i class="icon icon-lock-solid"></i>
                    </div>
                </foreignObject>

                <foreignObject x="352" y="144.94" width="416" height="32">
                    <div class="chapter__download">
                        <div class="button chapter__offline">
                            <i class="icon icon-download-solid"></i>
                            <span>${_s.offline.download}</span>
                        </div>
                        <div class="is-downloading">
                            <span>${_s.offline.downloading}</span>

                            <div class="downloading-progress">
                                <div class="progress-line"></div>
                            </div>
                            <span class="downloading-label"></span>
                        </div>
                        <span class="downloading-complete">${_s.offline.availableOffline}</span>
                    </div>
                </foreignObject>
            </svg>
        `
        instance.menu.chapters.appendChild(chapterHtml)
    }

    setDescriptionHtml() {
        let chapter = instance.selectedChapter
        let chapterDescription = instance.menu.chapterContent.querySelector('.chapter__description')
        let chapterAttachments = instance.menu.chapterContent.querySelector('.chapter__attachments')

        console.log(chapter);

        chapterDescription.setAttribute('data-id', chapter.id)
        chapterDescription.setAttribute('data-slug', chapter.category)
        instance.menu.chapterContent.querySelector('h2').innerText = chapter.title
        instance.menu.chapterContent.querySelector('p').innerText = chapter.content

        if (chapter.attachments.length) {
            chapterAttachments.querySelector('h3').innerText = _s.journey.attachments + ':'
            chapter.attachments.forEach((attachment) => {
                chapterAttachments.querySelector('.attachments').innerHTML += `<div class="attachment">
                    <a href="${attachment.url}" target="_blank">
                        <span class="icon icon-download-solid"></span>
                        <span class="attachment__name">${attachment.title}</span>
                    </a>
                </div>`
            })
        }

        instance.menu.chapterItems.classList.add('chapter-selected')
    }

    removeDescriptionHtml() {
        instance.menu.chapterItems.classList.remove('chapter-selected')
    }

    selectChapterListeners() {
        document.querySelectorAll(".chapter:not(.locked)").forEach((chapter) => {
            chapter.addEventListener("click", () => {
                instance.addClassToSelectedChapter(chapter)
                instance.updateSelectedChapterData(chapter)
                instance.loadChapterTextures()
                instance.showMenuButtons()
                instance.setDescriptionHtml()
            })
        })

        document.querySelectorAll(".chapter:not(.locked) .chapter__offline").forEach(function (chapter) {
            chapter.addEventListener("click", (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })
    }

    addClassToSelectedChapter(chapter) {
        instance.unselectAllChapters()
        chapter.classList.add('selected')
    }

    unselectAllChapters() {
        document.querySelectorAll(".chapter").forEach(function (thisChapter) {
            thisChapter.classList.remove('selected')
        })
    }

    updateSelectedChapterData(chapter) {
        const chapterId = chapter.getAttribute('data-id')
        const categorySlug = chapter.getAttribute('data-slug')
        instance.selectedChapter = instance.menu.chaptersData[categorySlug]['chapters'].filter((chapter) => { return chapter.id == chapterId })[0]
    }

    loadChapterTextures() {
        instance.selectedChapter.episodes.forEach((episode) => {
            const fileName = episode.type + '-' + episode.id

            if (instance.resources.textureItems.hasOwnProperty(fileName))
                return

            instance.resources.loadEpisodeTextures(fileName, episode.thumbnail)
        })
    }

    async downloadChapter(chapter) {
        if (!this.experience.auth0.isAuthenticated) return

        let chapterEl = chapter.closest(".chapter")
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.menu.chaptersData[categorySlug]['chapters'].filter((chapter) => { return chapter.id == chapterId })[0]

        chapterEl.classList.remove('download')
        chapterEl.classList.add('downloading')

        await this.downloadEpisodes(selectedChapter['episodes'], chapterId)
    }

    async downloadEpisodes(episodes, chapterId) {
        let episodesDownloadUrls = []

        episodes.forEach(async (episode) => {
            const downloadUrl = await this.getEpisodeDownloadUrl(episode.id)

            episodesDownloadUrls.push({
                downloadUrl: downloadUrl,
                data: {
                    name: 'episode-' + episode.id,
                    thumbnail: episode.thumbnail,
                    chapterId: chapterId,
                }
            })

            if (episodesDownloadUrls.length == episodes.length) {
                this.offline.downloadFromWeb(episodesDownloadUrls)
            }
        })
    }

    async getEpisodeDownloadUrl(episodeId) {
        const claims = await this.experience.auth0.getIdTokenClaims();
        const idToken = claims.__raw;
        const locale = _lang.getLanguageCode()

        var btvplayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale,
            access_token: idToken
        })

        const allLanguagesVideos = await btvplayer.api.getDownloadables('episode', episodeId)
        const myLanguageVideos = allLanguagesVideos.filter(video => { return video.language.code == locale })
        const selectedQualityVideo = instance.getSelectedQualityVideo(myLanguageVideos)

        return await btvplayer.api.getDownloadable('episode', episodeId, selectedQualityVideo.id)
    }

    getSelectedQualityVideo(arr) {
        switch (instance.selectedQuality) {
            case 'low':
                return arr.reduce((prev, current) => (prev.sizeInMB < current.sizeInMB) ? prev : current)

            case 'medium':
                return median(arr)

            case 'high':
                return arr.reduce((prev, current) => (prev.sizeInMB > current.sizeInMB) ? prev : current)
        }
    }

    startChapter() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()
    }

    restartChapter() {
        localStorage.removeItem("progress-theme-" + instance.selectedChapter.id)
        localStorage.removeItem("answers-theme-" + instance.selectedChapter.id)
        instance.startChapter()
    }

    finishJourney() {
        instance.showMenu()
        instance.buttons.start.classList.remove('visible')
        instance.buttons.restart.classList.add('visible')
    }

    showMenu() {
        document.body.classList.add('freeze')
        instance.audio.addBgMusicElement()
        instance.welcome.chaptersScreen.classList.add('visible')
        instance.points.delete()
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        instance.welcome.chaptersScreen.classList.remove('visible')
        instance.audio.removeBgMusicElement()
    }

    getId() {
        return "progress-theme-" + this.selectedChapter.id
    }

    update() {
        if (this.controlRoom) {
            this.controlRoom.update()
        }

        if (this.points) {
            this.points.update()
        }
    }
}

function median(values) {
    if (values.length === 0) throw new Error("No inputs")

    values.sort(function (a, b) {
        return a.sizeInMB - b.sizeInMB
    })

    var half = Math.floor(values.length / 2)

    if (values.length % 2)
        return values[half]

    return (values[half - 1] + values[half]) / 2.0
}