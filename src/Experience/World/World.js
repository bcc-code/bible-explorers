import Offline from '../Utils/Offline.js'
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
import _appInsights from '../Utils/AppInsights.js'

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
            loading: document.getElementById("page-loader"),
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

        instance.selectedQuality = instance.experience.settings.videoQuality

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
                instance.welcome.loading.style.display = "none"
                instance.welcome.topBar.style.display = "flex"
                instance.welcome.loadingScreen.classList.add('visible')
            }, 1000)
        })

        this.start = document.createElement('span')
        this.start.innerText = _s.journey.start
        this.restart = document.createElement('span')
        this.restart.innerText = _s.journey.restart

        this.welcome.introduction.innerText = _s.introduction
        this.buttons.start.children[0].appendChild(this.start)
        this.buttons.restart.appendChild(this.restart)

        this.homeButton = document.getElementById('go-home')
        this.homeButton.addEventListener("click", this.goHome)

        this.menu.backBtn.addEventListener("click", this.goToLandingScreen)
        this.menu.backBtn.children[0].innerText = _s.journey.back
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
        instance.audio.playWhoosh()
        instance.audio.changeBgMusic()
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
            this.start.innerText = _s.journey.continue
        }
    }

    setCategories(result) {
        if (result.length == 0) instance.addNotAvailableInYourLanguageMessage()
        if (result.hasOwnProperty('message')) return

        instance.menu.chaptersData = result

        for (const [category, data] of Object.entries(instance.menu.chaptersData)) {
            instance.setCategoryHtml({ name: data.name, slug: data.slug })
        }

        instance.selectCategoryListeners()
    }

    addNotAvailableInYourLanguageMessage() {
        const notAvailableEl = document.createElement("div")
        notAvailableEl.className = "not-available"
        notAvailableEl.innerText = _s.notAvailable
        instance.menu.categories.appendChild(notAvailableEl)
    }

    setCategoryHtml(category) {
        const categoryHtml = document.createElement("div")
        categoryHtml.className = "category button button__default"
        categoryHtml.setAttribute("data-slug", category.slug)

        const span = document.createElement('span')
        span.innerText = category.name

        instance.menu.categories.appendChild(categoryHtml)
        categoryHtml.appendChild(span)

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

                setFullscreen()
                instance.audio.changeBgMusic()

                instance.welcome.loadingScreen.classList.remove('visible')
            })
        })
    }

    goToLandingScreen() {
        instance.unselectAllChapters()
        instance.placeholderChapterData()
        instance.removeDescriptionHtml()

        instance.menu.chapters.innerHTML = ''
        instance.welcome.loadingScreen.classList.add('visible')
        instance.welcome.chaptersScreen.classList.remove('visible')
    }

    setChapters(data) {
        data.forEach((chapter, index) => {
            instance.setChapterHtml(chapter, index)
            instance.welcome.loadingScreen.classList.remove('visible')
            instance.welcome.chaptersScreen.classList.add('visible')
        })

        instance.selectChapterListeners()
    }

    setChapterHtml(chapter, index) {
        let chapterHtml = document.createElement("div")

        let chapterClasses = "chapter"
        chapterClasses += chapter.status == "future" ? " locked" : ""
        chapterHtml.className = chapterClasses

        chapterHtml.setAttribute("data-id", chapter.id)
        chapterHtml.setAttribute("data-slug", chapter.category)

        chapterHtml.innerHTML = `
            <div class="chapter__box">
                <div class="chapter__extras">
                    <span class="bottomLeft"></span>
                    <span class="bottomLeftSmall"></span>
                    <span class="right"></span>
                    <span class="rightOutside"></span>
                </div>
                <div class="chapter__background"></div>
                <div class="chapter__number">
                    <i class="icon icon-lock-solid"></i>
                    <span>${index + 1}</span>
                    <div class="stars">
                        <i class="icon icon-star-solid"></i>
                        <i class="icon icon-star-solid"></i>
                        <i class="icon icon-star-solid"></i>
                    </div>
                </div>
                <div class="chapter__heading">
                    <h2 class="chapter__title">${chapter.title}</h2>
                    <span class="chapter__date">${chapter.date}</span>
                </div>
            </div>
            <div class="chapter__states">
                <div class="chapter__offline">
                    <i class="icon icon-download-solid"></i>
                    <span>${_s.offline.download}</span>
                </div>
                <div class="chapter__downloading">
                    <span class="title">${_s.offline.downloading}</span>
                    <span class="downloading-progress">
                        <span class="progress-line"></span>
                    </span>
                    <span class="downloading-label"></span>
                </div>
                <div class="chapter__download-failed">
                    <span>${_s.offline.downloadFailed}</span>
                    <span class="separator">/</span>
                    <span class="icon icon-arrows-rotate-solid" title="${_s.offline.tryAgain}"></span>
                </div>
                <div class="chapter__downloaded">
                    <span>${_s.offline.availableOffline}</span>
                    <span class="separator">/</span>
                    <span class="icon icon-arrows-rotate-solid" title="${_s.offline.update}"></span>
                </div>
            </div>
        `
        instance.menu.chapters.appendChild(chapterHtml)
        instance.offline.fetchChapterAsset(chapter, "thumbnail", instance.setChapterBgImage)

        instance.markChapterIfCompleted(chapter)
        instance.offline.markChapterIfAvailableOffline(chapter)
    }

    markChapterIfCompleted(chapter) {
        const chapterProgress = localStorage.getItem("progress-theme-" + chapter.id) || 0

        if (chapterProgress == chapter.program.length && chapterProgress > 0)
            document.querySelector('.chapter[data-id="' + chapter.id + '"]').classList.add('completed')
    }

    setChapterBgImage(chapter) {
        document.querySelector('.chapter[data-id="' + chapter.id + '"] .chapter__background').style.backgroundImage = 'url("' + chapter.thumbnail + '")'
    }

    setDescriptionHtml() {
        let chapter = instance.selectedChapter
        let chapterDescription = instance.menu.chapterContent.querySelector('.chapter__description')
        let chapterAttachments = instance.menu.chapterContent.querySelector('.chapter__attachments')

        chapterDescription.setAttribute('data-id', chapter.id)
        chapterDescription.setAttribute('data-slug', chapter.category)
        instance.menu.chapterContent.querySelector('.chapter__title').innerHTML = chapter.title
        instance.menu.chapterContent.querySelector('.chapter__text').innerHTML = chapter.content

        instance.menu.chapterContent.querySelector('.quick-look__button').addEventListener("click", () => {
            document.querySelector('body').classList.add('quick-look-mode')

            this.chapterProgress() == this.selectedChapter.program.length
                ? instance.restartChapter()
                : instance.startChapter()
        })

        chapterAttachments.querySelector('.attachments').innerHTML = ''

        if (chapter.attachments.length) {
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
        document.querySelectorAll(".chapter:not(.locked), body.admin .chapter").forEach((chapter) => {
            chapter.addEventListener("click", () => {
                instance.addClassToSelectedChapter(chapter)
                instance.updateSelectedChapterData(chapter)
                instance.loadChapterTextures()
                instance.showMenuButtons()
                instance.setDescriptionHtml()
            })
        })

        document.querySelectorAll(".chapter:not(.locked) .chapter__offline, body.admin .chapter__offline").forEach(function (chapter) {
            chapter.addEventListener("click", (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })

        document.querySelectorAll(".chapter:not(.locked) .chapter__downloaded, body.admin .chapter__downloaded").forEach(function (button) {
            button.addEventListener("click", instance.confirmRedownload)
        })

        document.querySelectorAll(".chapter__download-failed").forEach(function (chapter) {
            chapter.addEventListener("click", (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })
    }

    confirmRedownload(event) {
        const button = event.currentTarget
        button.removeEventListener("click", instance.confirmRedownload)

        button.innerHTML = `<span style="margin-right: 0.25rem">${_s.offline.redownloadConfirmation}</span>
            <span class="refuse icon icon-xmark-solid"></span>
            <span class="separator">/</span>
            <span class="redownload icon icon-check-solid"></span>`

        button.querySelector('.refuse').addEventListener("click", (event) => {
            instance.setDownloadHtml(button)
            event.stopPropagation()
        })
        button.querySelector('.redownload').addEventListener("click", (event) => {
            instance.redownloadChapter(button)
            instance.setDownloadHtml(button)
            event.stopPropagation()
        })

        event.stopPropagation()
    }

    setDownloadHtml(button) {
        button.innerHTML = `<span>${_s.offline.availableOffline}</span>
            <span class="separator">/</span>
            <span class="icon icon-arrows-rotate-solid" title="${_s.offline.update}"></span>`
        button.addEventListener("click", instance.confirmRedownload)
    }

    redownloadChapter(chapter) {
        instance.removeChapter(chapter)
        instance.downloadChapter(chapter)
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
        instance.selectedChapter = instance.menu.chaptersData[categorySlug]['chapters'].find((chapter) => { return chapter.id == chapterId })
    }

    loadChapterTextures() {
        instance.selectedChapter.episodes.forEach((episode) => {
            const fileName = episode.type + '-' + episode.id

            if (instance.resources.textureItems.hasOwnProperty(fileName))
                return

            instance.resources.loadEpisodeTextures(fileName)
        })
    }

    async downloadChapter(chapter) {
        if (!this.experience.auth0.isAuthenticated) return

        let chapterEl = chapter.closest(".chapter")
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.menu.chaptersData[categorySlug]['chapters'].find((chapter) => { return chapter.id == chapterId })

        instance.cacheChapterAssets(selectedChapter)

        chapterEl.classList.remove('download')
        chapterEl.classList.remove('failed')
        chapterEl.classList.add('downloading')

        this.offline.downloadEpisodes(selectedChapter['episodes'], { chapterId, chapterTitle: selectedChapter.title, categorySlug })
    }

    removeChapter(chapter) {
        let chapterEl = chapter.closest(".chapter")
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.menu.chaptersData[categorySlug]['chapters'].find((chapter) => { return chapter.id == chapterId })

        selectedChapter['episodes'].forEach(episode => this.offline.deleteEpisodeFromDb(episode.type + '-' + episode.id))
        chapterEl.classList.remove('downloaded')
    }

    cacheChapterAssets(chapter) {
        instance.cacheChapterThumbnail(chapter.thumbnail)
        instance.cacheChapterBgMusic(chapter.background_music)
        instance.cacheChapterArchiveImages(chapter.archive)
        instance.cacheTaskDescriptionAudios(chapter['program'].filter(step => step.audio))
        instance.cacheSortingGameIcons(chapter['program'].filter(step => step.taskType == "sorting"))
    }

    cacheChapterThumbnail(url) {
        if (!url) return
        instance.fetchAndCacheAsset(url)
    }

    cacheChapterBgMusic(url) {
        if (!url) return
        instance.fetchAndCacheAsset(url)
    }

    cacheChapterArchiveImages(facts) {
        facts.forEach(fact => instance.fetchAndCacheAsset(fact.image.url))
    }

    cacheTaskDescriptionAudios(tasks) {
        if (tasks.length == 0) return
        tasks.forEach(task => instance.fetchAndCacheAsset(task.audio))
    }

    cacheSortingGameIcons(sortingTasks) {
        if (sortingTasks.length == 0) return

        sortingTasks.forEach(task => task.sorting.forEach(s => {
            instance.fetchAndCacheAsset(s.icon)
        }))
    }

    fetchAndCacheAsset(url) {
        if (!url) return
        caches.open("chaptersAssets").then((cache) => {
            var request = new Request(url)
            fetch(request)
                .then((fetchedResponse) => {
                    cache.put(url, fetchedResponse)
                })
        })
    }

    startChapter() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()

        _appInsights.trackEvent({
            name: "Start chapter",
            properties: {
                title: instance.selectedChapter.title,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality
            }
        })

        if (instance.selectedChapter.background_music) {
            instance.offline.fetchChapterAsset(instance.selectedChapter, "background_music", (chapter) => {
                instance.audio.changeBgMusic(chapter.background_music)
            })
        }

        instance.selectedChapter.archive.forEach(fact => {
            instance.offline.fetchChapterAsset(fact.image, "url", (data) => {
                fact.image = data
            })
        })
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
        instance.audio.changeBgMusic()

        _appInsights.trackEvent({
            name: "Finish chapter",
            properties: {
                title: instance.selectedChapter.title,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality
            }
        })

        document.querySelector('.chapter[data-id="' + instance.selectedChapter.id + '"]').classList.add('completed')
    }

    showMenu() {
        document.body.classList.add('freeze')
        instance.welcome.chaptersScreen.classList.add('visible')
        instance.points.delete()
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        instance.welcome.chaptersScreen.classList.remove('visible')
    }

    getId() {
        return "progress-theme-" + this.selectedChapter.id
    }

    resize() {
        if (this.points) {
            this.points.resize()
        }
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

function setFullscreen() {
    if (document.body.requestFullscreen) {
        document.body.requestFullscreen()
    } else if (document.body.webkitRequestFullscreen) { /* Safari */
        document.body.webkitRequestFullscreen()
    } else if (document.body.msRequestFullscreen) { /* IE11 */
        document.body.msRequestFullscreen()
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