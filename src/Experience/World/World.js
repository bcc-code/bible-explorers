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
import _e from '../Utils/Events.js'
import _appInsights from '../Utils/AppInsights.js'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/shift-away.css'

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
        this.page = this.experience.page

        instance = this

        this.placeholderChapterData()
        this.chapterProgress = () => parseInt(localStorage.getItem(this.getId())) || 0

        // Chapters
        this.menu = {
            categories: document.querySelector(".categories.list"),
            chapters: document.querySelector(".chapters"),
            chaptersData: [],
        }

        this.buttons = {
            archive: document.querySelector('[aria-label="Archive"]'),
            contact: document.querySelector('[aria-label="Contact"]'),
            home: document.querySelector('[aria-label="Home"]'),
        }

        this.navigation = {
            prev: document.querySelector('[aria-label="Prev page"]'),
            next: document.querySelector('[aria-label="Next page"]')
        }

        this.buttons.archive.style.display = 'none'
        this.buttons.home.style.display = 'none'

        this.selectedQuality = this.experience.settings.videoQuality

        // Wait for resources
        this.resources.on('ready', () => {
            this.resources.fetchApiThenCache(_api.getBiexChapters(), this.setCategories)

            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.points = new Points()
            this.highlight = new Highlight()
            this.audio = new Audio()

            this.navigation.next.addEventListener('click', this.startChapter)
            // this.buttons.restart.addEventListener('click', this.restartChapter)

        })

        // this.buttons.restart.innerText = _s.journey.restart
        // this.buttons.back.innerText = _s.journey.back

        this.buttons.home.addEventListener("click", this.goHome)
        this.navigation.prev.addEventListener("click", this.goToLandingScreen)

        if (window.location.hostname == 'explorers.biblekids.io') {
            instance.buttons.contact.addEventListener('click', function () {
                document.getElementById('deskWidgetMain').classList.toggle('widget-open')
                instance.buttons.contact.toggleAttribute('is-open')
            })
        }
    }

    hideLoading() {

    }

    placeholderChapterData() {
        instance.selectedChapter = {
            id: 0,
            program: null,
            data: null
        }
    }

    goHome() {
        instance.showMenu()
        instance.program.video.defocus()
        instance.camera.updateCameraTo()
        instance.audio.playWhoosh()
        instance.audio.changeBgMusic()
        instance.debug.removeQuickLookMode()
        instance.experience.world.progressBar.show()

        if (!instance.experience.settings.fullScreen) {
            document.exitFullscreen()
        }
    }

    showActionButtons() {
        if (this.chapterProgress() == 0) {
            // instance.buttons.restart.style.display = 'none'
        } else {
            instance.buttons.restart.style.display = 'block'
        }

        if (this.chapterProgress() == this.selectedChapter.program.length) {
            instance.navigation.next.style.display = 'none'
        } else {
            instance.navigation.next.style.display = 'block'
        }

        if (this.chapterProgress() > 0 && this.chapterProgress() < this.selectedChapter.program.length) {
            // instance.buttons.start.innerText = _s.journey.continue
        } else {
            // instance.buttons.start.innerText = _s.journey.start
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
        const categoryHtml = document.createElement("button")
        categoryHtml.className = "category | btn default bordered"
        categoryHtml.setAttribute("data-slug", category.slug)
        categoryHtml.innerText = category.name

        document.querySelector('.categories').appendChild(categoryHtml)
    }

    selectCategoryListeners() {
        document.querySelectorAll(".category").forEach(function (category) {
            category.addEventListener("click", () => {

                const categorySlug = category.getAttribute('data-slug')
                instance.setChapters(instance.menu.chaptersData[categorySlug]['chapters'])

                instance.audio.changeBgMusic()

                tippy('[aria-label="Preview chapter"]', {
                    theme: 'explorers',
                    content: _s.journey.quickLook.info,
                    duration: [500, 200],
                    animation: 'shift-away',
                    arrow: false
                })
            })
        })
    }

    goToLandingScreen() {
        instance.unselectAllChapters()
        instance.placeholderChapterData()
        instance.removeDescriptionHtml()

        document.querySelector('.page').setAttribute('page', 'intro')
        document.querySelector('.chapters').innerHTML = ''

        instance.navigation.prev.style.display = 'none'
        instance.navigation.next.style.display = 'none'
    }

    setChapters(data) {
        instance.page.lobby()

        data.forEach((chapter, index) => {
            instance.setChapterHtml(chapter, index)
        })

        instance.selectChapterListeners()
    }

    setChapterHtml(chapter, index) {
        let chapterHtml = document.createElement("article")

        let chapterClasses = "chapter"
        chapterClasses += chapter.status == "future" ? " locked" : ""
        chapterClasses += chapter.is_beta === true ? " beta" : ""
        chapterHtml.className = chapterClasses

        chapterHtml.setAttribute("data-id", chapter.id)
        chapterHtml.setAttribute("data-slug", chapter.category)

        chapterHtml.innerHTML = `
            <header class="chapter__heading">
                <h2 class="chapter__title">${chapter.title}</h2>
                <span class="chapter__date">${chapter.date}</span>
            </header>
            <div class="chapter__states">
                <div class="chapter__offline">
                    <span>${_s.offline.download.title}</span>
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
                </div>
                <div class="chapter__downloaded">
                    <span>${_s.offline.availableOffline.title}</span>
                </div>
            </div>
            `

        const chapters = document.querySelector('.chapters')
        chapters.appendChild(chapterHtml)

        instance.offline.fetchChapterAsset(chapter, "thumbnail", instance.setChapterBgImage)

        instance.markChapterIfCompleted(chapter)
        instance.offline.markChapterIfAvailableOffline(chapter)

        instance.navigation.prev.style.display = 'block'

        instance.setStatesTooltips()
    }


    setDescriptionHtml() {
        let chapter = instance.selectedChapter

        let numberOfEpisodes = 0
        let numberOfTasks = 0
        let numberOfQuizes = 0

        chapter.program.forEach(checkpoint => {
            if (checkpoint.steps.some(step => step.details.step_type == 'video'))
                numberOfEpisodes++

            else if (checkpoint.steps.some(step => step.details.step_type == 'quiz'))
                numberOfQuizes++

            else if (checkpoint.steps.some(step => step.details.step_type == 'task'))
                numberOfTasks++
        })

        let detailsHTML =
            `<header>
                <h2>${chapter.title}</h2>
                <button class="btn default with-icon next" aria-label="Preview chapter">
                    <div class="icon-eye-solid"></div>
                    <span>Preview</span>
                </button>
            </header>`

        if (chapter.attachments.length) {
            detailsHTML += `<div class="attachments">`
            chapter.attachments.forEach((item) => {
                detailsHTML += `<a href="${item.url}" target="_blank" class="link asset icon"><i class="icon-download-solid"></i><span>${item.title}</span></a>`
            })
            detailsHTML += `</div>`
        }

        detailsHTML += `<div class="description">${chapter.content}</div>`


        if (numberOfEpisodes > 0 || numberOfTasks > 0 || numberOfQuizes > 0) {
            detailsHTML +=
                `<div class="info">
                    <div><i class="icon-film-solid"></i><span>${numberOfEpisodes} films</span></div>
                    <div><i class="icon-pen-to-square-solid"></i><span>${numberOfEpisodes} tasks</span></div>`

            if (numberOfQuizes > 0) {
                detailsHTML += `<div><i class="icon-question-solid"></i><span>${numberOfQuizes} quiz</span></div>`
            }

            detailsHTML += `</div>`
        }


        const details = document.querySelector('.chapter-details')
        details.innerHTML = detailsHTML
        details.classList.add('is-open')

        const previewBtn = document.querySelector('[aria-label="Preview chapter"]')
        previewBtn.addEventListener("click", instance.previewChapter)

        document.querySelector('.chapters').classList.add('chapter-selected')
    }


    removeDescriptionHtml() {
        document.querySelector('.chapters').classList.remove('chapter-selected')
    }

    selectChapterListeners() {
        document.querySelectorAll(".chapter:not(.locked), body.ak_leder .chapter").forEach((chapter) => {
            chapter.addEventListener("click", () => {
                instance.addClassToSelectedChapter(chapter)
                instance.updateSelectedChapterData(chapter)
                instance.loadChapterTextures()
                instance.showActionButtons()
                instance.setDescriptionHtml()
            })
        })

        document.querySelectorAll(".chapter:not(.locked) .chapter__offline, body.ak_leder .chapter__offline").forEach(function (chapter) {
            chapter.addEventListener("click", (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })

        document.querySelectorAll(".chapter:not(.locked) .chapter__downloaded, body.ak_leder .chapter__downloaded").forEach(function (button) {
            button.addEventListener("click", instance.confirmRedownload)
        })

        document.querySelectorAll(".chapter__download-failed").forEach(function (chapter) {
            chapter.addEventListener("click", (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })
    }

    setStatesTooltips() {
        tippy('.chapter__offline', {
            theme: 'explorers',
            content: _s.offline.download.info,
            duration: [500, 200],
            animation: 'shift-away',
            arrow: false
        })

        tippy('.chapter__downloaded', {
            theme: 'explorers',
            content: _s.offline.availableOffline.info,
            duration: [500, 200],
            animation: 'shift-away',
            arrow: false
        })
    }

    setChapterBgImage(chapter) {
        document.querySelector('.chapter[data-id="' + chapter.id + '"]').style.backgroundImage = 'url("' + chapter.thumbnail + '")'
    }

    markChapterIfCompleted(chapter) {
        const chapterProgress = localStorage.getItem("progress-theme-" + chapter.id) || 0

        if (chapterProgress == chapter.program.length && chapterProgress > 0)
            document.querySelector('.chapter[data-id="' + chapter.id + '"]').classList.add('completed')
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
        button.innerHTML = `<span>${_s.offline.availableOffline.title}</span>`
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

        this.offline.downloadEpisodes(chapterId, selectedChapter['episodes'])
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

        chapter['program'].forEach(checkpoint => {
            instance.cacheTaskDescriptionAudios(checkpoint.steps.filter(step => step.message && step.message.audio))
            instance.cacheTaskDescriptionMedia(checkpoint.steps.filter(step => step.message && step.message.media))
            instance.cacheSortingGameIcons(checkpoint.steps.filter(step => step.details && step.details.task_type == "sorting"))
            instance.cachePictureAndCodeImage(checkpoint.steps.filter(step => step.details && step.details.task_type == "picture_and_code"))
        })
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
        if (facts.length == 0) return
        facts.forEach(fact => instance.fetchAndCacheAsset(fact.image.url))
    }

    cacheTaskDescriptionAudios(tasks) {
        if (tasks.length == 0) return
        tasks.forEach(task => instance.fetchAndCacheAsset(task.message.audio))
    }

    cacheTaskDescriptionMedia(tasks) {
        if (tasks.length == 0) return
        tasks.forEach(task => instance.fetchAndCacheAsset(task.message.media))
    }

    cacheSortingGameIcons(sortingTasks) {
        if (sortingTasks.length == 0) return
        sortingTasks.forEach(task => task.sorting.forEach(s => {
            instance.fetchAndCacheAsset(s.icon)
        }))
    }

    cachePictureAndCodeImage(pictureAndCodeTasks) {
        if (pictureAndCodeTasks.length == 0) return
        pictureAndCodeTasks.forEach(task => instance.fetchAndCacheAsset(task.picture_and_code.picture))
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
        instance.setUpChapter()
        instance.fetchBgMusic()
        instance.fetchArchiveImage()

        _appInsights.trackEvent({
            name: "Start chapter",
            properties: {
                title: instance.selectedChapter.title,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality
            }
        })

        if (!instance.experience.settings.fullScreen && !document.fullscreenElement) {
            // document.documentElement.requestFullscreen()
        }

        document.querySelector('.lobby').remove()
        document.querySelector('.page').setAttribute('page', '')


    }

    previewChapter() {
        instance.setUpChapter()
        instance.fetchBgMusic()
        instance.fetchArchiveImage()
        instance.debug.addQuickLookMode()

        if (!instance.experience.settings.fullScreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        }
    }

    restartChapter() {
        localStorage.removeItem("progress-theme-" + instance.selectedChapter.id)
        localStorage.removeItem("answers-theme-" + instance.selectedChapter.id)
        instance.startChapter()
    }

    finishJourney() {
        instance.audio.changeBgMusic()

        if (!instance.debug.onQuickLook()) {
            document.querySelector('.chapter[data-id="' + instance.selectedChapter.id + '"]').classList.add('completed')

            _appInsights.trackEvent({
                name: "Finish chapter",
                properties: {
                    title: instance.selectedChapter.title,
                    category: instance.selectedChapter.category,
                    language: _lang.getLanguageCode(),
                    quality: instance.selectedQuality
                }
            })
        }
    }

    showMenu() {
        document.body.classList.add('freeze')
        document.querySelector('.page').classList.add('is-visible')
        instance.points.delete()
        instance.buttons.home.style.display = 'none'
        instance.buttons.archive.style.display = 'none'
        instance.buttons.contact.style.display = 'block'
        instance.showActionButtons()
        instance.experience.world.progressBar.hide()
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        document.querySelector('.page').classList.remove('is-visible')

        instance.buttons.contact.style.display = 'none'
    }

    setUpChapter() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()
        instance.buttons.home.style.display = 'block'
        instance.buttons.archive.style.display = 'block'
        instance.experience.world.progressBar.show()
    }

    fetchBgMusic() {
        if (instance.selectedChapter.background_music) {
            instance.offline.fetchChapterAsset(instance.selectedChapter, "background_music", (chapter) => {
                instance.audio.changeBgMusic(chapter.background_music)
            })
        }
    }

    fetchArchiveImage() {
        instance.selectedChapter.archive.forEach(fact => {
            instance.offline.fetchChapterAsset(fact.image, "url", (data) => {
                fact.image = data
            })
        })
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