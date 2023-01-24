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
import _gl from '../Utils/Globals.js'
import Task from '../Components/Task.js'

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

        // Wait for resources
        this.resources.on('ready', () => {
            this.resources.fetchApiThenCache(_api.getBiexChapters(), this.setCategories)

            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.points = new Points()
            this.highlight = new Highlight()
            this.audio = new Audio()
            this.task = new Task()
        })

        this.placeholderChapterData()
        this.chapterProgress = () => parseInt(localStorage.getItem(this.getId())) || 0

        this.selectedQuality = this.experience.settings.videoQuality

        // Chapters
        this.menu = {
            categories: document.querySelector(".categories.list"),
            chapters: document.querySelector(".chapters"),
            chaptersData: []
        }

        this.buttons = {
            contact: document.querySelector('[aria-label="Contact"]'),
            home: document.querySelector('[aria-label="Home"]')
        }

        this.buttons.home.style.display = 'none'
        this.buttons.home.addEventListener("click", this.goHome)

        document.querySelector('[aria-label="prev page"]').addEventListener('click', this.goToWelcomeMessage)

        if (window.location.hostname == 'explorers.biblekids.io') {
            instance.buttons.contact.addEventListener('click', () => {
                document.getElementById('deskWidgetMain').classList.toggle('widget-open')
                instance.buttons.contact.toggleAttribute('is-open')
            })
        }
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
        // instance.experience.world.progressBar.show()

        if (document.querySelector('.archive'))
            instance.program.archive.remove()

        if (!instance.experience.settings.fullScreen) {
            // document.exitFullscreen()
        }
    }

    showActionButtons() {
        if (this.chapterProgress() == 0) {
            // instance.buttons.restart.style.display = 'none'
        } else {
            // instance.buttons.restart.style.display = 'block'
        }

        instance.experience.navigation.next.disabled = this.chapterProgress() == this.selectedChapter.program.length

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
        const categoryBtn = _gl.elementFromHtml(`<button class="category btn default bordered" data-slug="${category.slug}">${category.name}</button>`)
        document.querySelector('.categories').appendChild(categoryBtn)
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

    goToWelcomeMessage() {
        instance.unselectAllChapters()
        instance.placeholderChapterData()
        instance.removeDescriptionHtml()

        document.querySelector('.lobby').remove()
        instance.resources.fetchApiThenCache(_api.getBiexChapters(), instance.setCategories)
        instance.page.intro()
    }

    setChapters(data) {
        document.querySelector('.intro').remove()
        instance.page.lobby()

        data.forEach((chapter, index) => {
            instance.setChapterHtml(chapter, index)
        })

        instance.experience.navigation.next.disabled = true
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
        instance.offline.markChapterIfAvailableOffline(chapter)
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

        const details = _gl.elementFromHtml(`
            <section class="chapter-details">
                <header>
                    <h2>${chapter.title}</h2>
                    <button class="btn default with-icon next" aria-label="Preview chapter">
                        <div class="icon-eye-solid"></div>
                        <span>Preview</span>
                    </button>
                </header>
            </section>
        `)

        if (chapter.attachments.length) {
            const attachments = _gl.elementFromHtml(`<div class="attachments"></div>`)

            chapter.attachments.forEach((item) => {
                const attachment = _gl.elementFromHtml(`<a href="${item.url}" target="_blank" class="link asset icon"><i class="icon-download-solid"></i><span>${item.title}</span></a>`)
                attachments.append(attachment)
            })

            details.append(attachments)
        }

        const description = _gl.elementFromHtml(`<div class="description">${chapter.content}</div>`)
        details.append(description)

        if (numberOfEpisodes > 0 || numberOfTasks > 0 || numberOfQuizes > 0) {
            const info = _gl.elementFromHtml(`
                <div class="info">
                    <div><i class="icon-film-solid"></i><span>${numberOfEpisodes} films</span></div>
                    <div><i class="icon-pen-to-square-solid"></i><span>${numberOfEpisodes} tasks</span></div>
                </div>
            `)

            details.append(info)

            if (numberOfQuizes > 0) {
                const quizLabel = _gl.elementFromHtml(`<div><i class="icon-question-solid"></i><span>${numberOfQuizes} quiz</span></div>`)
                info.append(quizLabel)
            }
        }

        document.querySelector('.lobby').append(details)
        document.querySelector('.chapters').classList.add('chapter-selected')

        const previewBtn = document.querySelector('[aria-label="Preview chapter"]')
        previewBtn.addEventListener("click", instance.previewChapter)

        instance.experience.navigation.next.addEventListener("click", instance.startChapter)
    }

    removeDescriptionHtml() {
        document.querySelector('.chapters').classList.remove('chapter-selected')

        if (document.querySelector('.chapter-details'))
            document.querySelector('.chapter-details').remove()
    }

    selectChapterListeners() {
        document.querySelectorAll(".chapter:not(.locked), body.ak_leder .chapter").forEach((chapter) => {
            chapter.addEventListener("click", () => {
                if (document.querySelector('.chapter-details'))
                    document.querySelector('.chapter-details').remove()

                instance.addClassToSelectedChapter(chapter)
                instance.updateSelectedChapterData(chapter)
                instance.loadChapterTextures()
                instance.showActionButtons()
                instance.setDescriptionHtml()

                instance.experience.navigation.next.disabled = false
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
        document.querySelector('.page').className = 'page page-home'

        instance.experience.navigation.next.removeEventListener("click", instance.startChapter)
    }

    previewChapter() {
        instance.setUpChapter()
        instance.fetchBgMusic()
        instance.fetchArchiveImage()
        instance.debug.addQuickLookMode()

        if (!instance.experience.settings.fullScreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        }

        instance.experience.navigation.next.removeEventListener("click", instance.startChapter)
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
        instance.page.lobby()

        instance.points.delete()
        instance.buttons.home.style.display = 'none'
        instance.buttons.contact.style.display = 'block'

        instance.showActionButtons()
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        document.querySelector('.page').className = 'page page-home'

        instance.buttons.contact.style.display = 'none'
    }

    setUpChapter() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()
        instance.buttons.home.style.display = 'block'

        if (instance.program.archive.facts.length > 0) {
            instance.program.archive.init()
        }
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