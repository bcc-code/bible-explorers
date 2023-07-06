import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import Audio from '../Extras/Audio.js'
import Program from '../Progress/Program.js'
import ProgressBar from "../Components/ProgressBar.js"
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
import gsap from 'gsap'

let instance = null
export default class World {
    constructor() {
        instance = this
        this.offline = new Offline()
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.page = this.experience.page
        this.time = this.experience.time


        // Wait for resources
        this.resources.on('ready', () => {
            this.page.createIntro()
            this.resources.fetchApiThenCache(_api.getBiexChapters(), this.setCategories)

            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.points = new Points()
            this.highlight = new Highlight()
            this.audio = new Audio()

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
            // contact: document.querySelector('[aria-label="Contact"]'),
            home: document.querySelector('[aria-label="Home"]'),
            guide: document.querySelector('[aria-label="Guide"]')
        }

        this.buttons.home.style.display = 'none'
        this.buttons.home.addEventListener("click", this.goHome)
    }

    placeholderChapterData() {
        instance.selectedChapter = {
            id: 0,
            program: null,
            data: null
        }
    }

    showIntro() {
        instance.placeholderChapterData()
        instance.removeDescriptionHtml()
        instance.page.removeLobby()
        instance.page.createIntro()

        !instance.menu.chaptersData
            ? instance.resources.fetchApiThenCache(_api.getBiexChapters(), instance.setCategories)
            : instance.setCategories(instance.menu.chaptersData)
    }

    showLobby() {
        instance.page.removeIntro()
        instance.page.createLobby()
        instance.setChapters()
        instance.experience.navigation.prev.addEventListener('click', instance.showIntro)
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
        const categoryBtn = _gl.elementFromHtml(`<button class="category btn default" data-slug="${category.slug}">${category.name}</button>`)
        document.querySelector('.categories').appendChild(categoryBtn)
    }

    selectCategoryListeners() {
        document.querySelectorAll(".category").forEach(function (category) {
            category.addEventListener("click", () => {
                instance.selectedCategory = category.getAttribute('data-slug')
                instance.showLobby()
                instance.audio.changeBgMusic()
            })
        })
    }

    setChapters() {
        instance.menu.chaptersData[instance.selectedCategory]['chapters'].forEach(chapter => {
            instance.setChapterHtml(chapter)
        })

        instance.experience.navigation.next.disabled = true
        instance.chapterEventListeners()
    }

    setChapterHtml(chapter) {
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
            <div class="coming-soon">Coming soon</div>
            <div class="chapter__states">
                <div class="chapter__offline">
                    <svg class="download-icon" viewBox="0 0 24 24">
                        <use href="#download"></use>
                    </svg>
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
                    <svg class="check-mark-icon" viewBox="0 0 23 16">
                        <use href="#check-mark"></use>
                    </svg>
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
                    <button class="btn default next" aria-label="Preview chapter">
                        <svg class="preview-icon icon" viewBox="0 0 28 22">
                            <use href="#preview"></use>
                        </svg>
                        <span>${_s.journey.preview.title}</span>
                    </button>
                </header>
                
            </section>
        `)

        const attachments = _gl.elementFromHtml(`<div class="attachments"></div>`)
        const guide = _gl.elementFromHtml(`
            <a class="link asset" href="https://biblekids.io/${localStorage.getItem('lang')}/explorers-mentor-guide/" target="_blank">
                <svg class="book-icon icon" viewBox="0 0 21 24">
                    <use href="#book"></use>
                </svg>
                <span>${_s.chapter.activityDescLabel}</span>
            </a>`
        )

        if (!chapter.is_beta)
            attachments.append(guide)

        details.append(attachments)

        const description = _gl.elementFromHtml(`<div class="description">${chapter.content}</div>`)
        details.append(description)

        if (numberOfEpisodes > 0 || numberOfTasks > 0 || numberOfQuizes > 0) {
            const info = _gl.elementFromHtml(`<div class="info"></div>`)

            details.append(info)

            if (numberOfEpisodes != 1) {
                const videoLabel = _gl.elementFromHtml(`<div><svg class="film-icon icon" viewBox="0 0 24 22"><use href="#film"></use></svg><span>${numberOfEpisodes} ${_s.chapter.infoPlural.video}</span></div>`)
                info.append(videoLabel)
            } else {
                const videoLabel = _gl.elementFromHtml(`<div><svg class="film-icon icon" viewBox="0 0 24 22"><use href="#film"></use></svg><span>${numberOfEpisodes} ${_s.chapter.infoSingular.video}</span></div>`)
                info.append(videoLabel)
            }

            if (numberOfTasks != 1) {
                const taskLabel = _gl.elementFromHtml(`<div><svg class="task-icon icon" viewBox="0 0 24 24"><use href="#pen-to-square"></use></svg><span>${numberOfTasks} ${_s.chapter.infoPlural.task}</span></div>`)
                info.append(taskLabel)
            } else {
                const taskLabel = _gl.elementFromHtml(`<div><svg class="task-icon icon" viewBox="0 0 24 24"><use href="#pen-to-square"></use></svg><span>${numberOfTasks} ${_s.chapter.infoSingular.task}</span></div>`)
                info.append(taskLabel)
            }

            if (numberOfQuizes != 1) {
                const quizLabel = _gl.elementFromHtml(`<div><svg class="question-mark icon" viewBox="0 0 15 22"><use href="#question-mark"></use></svg><span>${numberOfQuizes} ${_s.chapter.infoPlural.quiz}</span></div>`)
                info.append(quizLabel)
            } else {
                const quizLabel = _gl.elementFromHtml(`<div><svg class="question-mark icon" viewBox="0 0 15 22"><use href="#question-mark"></use></svg><span>${numberOfQuizes} ${_s.chapter.infoSingular.quiz}</span></div>`)
                info.append(quizLabel)
            }
        }

        document.querySelector('.lobby').append(details)
        document.querySelector('.chapters').classList.add('chapter-selected')

        const previewBtn = document.querySelector('[aria-label="Preview chapter"]')
        previewBtn.addEventListener("click", instance.previewChapter)

        tippy('[aria-label="Preview chapter"]', {
            theme: 'explorers',
            content: _s.journey.preview.info,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom-end',
        })

        instance.experience.navigation.next.addEventListener("click", instance.startChapter)
    }

    removeDescriptionHtml() {
        document.querySelector('.chapters').classList.remove('chapter-selected')
        if (document.querySelector('.chapter-details'))
            document.querySelector('.chapter-details').remove()
    }

    chapterEventListeners() {
        document.querySelectorAll(".chapter").forEach((chapter) => {
            chapter.addEventListener("click", () => {
                if (document.querySelector('.chapter-details'))
                    document.querySelector('.chapter-details').remove()

                instance.updateSelectedChapterData(chapter)
                instance.addClassToSelectedChapter(chapter)
                instance.loadChapterTextures()
                instance.showActionButtons()
                instance.setDescriptionHtml()

                instance.experience.navigation.next.disabled = false
            })
        })

        document.querySelectorAll(".chapter__offline").forEach(function (chapter) {
            chapter.addEventListener("click", (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })

        document.querySelectorAll(".chapter__downloaded").forEach(function (button) {
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
            placement: 'right',
        })

        tippy('.chapter__downloaded', {
            theme: 'explorers',
            content: _s.offline.availableOffline.info,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'right',
        })
    }

    setChapterBgImage(chapter) {
        document.querySelector('.chapter[data-id="' + chapter.id + '"]').style.backgroundImage = 'url("' + chapter.thumbnail + '")'
    }

    // Download

    setDownloadHtml(button) {
        button.innerHTML = `
        <svg class="check-mark-icon" viewBox="0 0 23 16">
            <use href="#check-mark"></use>
        </svg>
        <span>${_s.offline.availableOffline.title}</span>
        `
        button.addEventListener("click", instance.confirmRedownload)
    }

    confirmRedownload(event) {
        const button = event.currentTarget
        button.removeEventListener("click", instance.confirmRedownload)

        button.innerHTML = `<span style="margin-right: 0.25rem">${_s.offline.redownloadConfirmation}</span>
            <svg class="refuse | xmark-icon icon"  viewBox="0 0 17 16"><use href="#xmark"></use></svg>
            <span class="separator">/</span>
            <svg class="redownload | check-mark-icon icon" viewBox="0 0 23 16"><use href="#check-mark"></use></svg>`

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

    redownloadChapter(chapter) {
        instance.removeDownload(chapter)
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

            if (instance.resources.videoPlayers.hasOwnProperty(fileName))
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

        this.offline.downloadScreenTextures(selectedChapter)
        this.offline.downloadEpisodes(chapterId, selectedChapter['episodes'])
    }

    removeDownload(chapter) {
        let chapterEl = chapter.closest(".chapter")
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.menu.chaptersData[categorySlug]['chapters'].find((chapter) => { return chapter.id == chapterId })

        selectedChapter['episodes'].forEach(episode => this.offline.deleteEpisodeFromDb(episode.type + '-' + episode.id))
        chapterEl.classList.remove('downloaded')
    }

    fetchLobbyVideoLoop() {
        const videoName = instance.selectedChapter.lobby_video_loop
        if (videoName)
            instance.offline.fetchScreenTexture(videoName)
    }

    fetchBgMusic() {
        if (instance.selectedChapter.background_music) {
            instance.offline.fetchChapterAsset(instance.selectedChapter, "background_music", (chapter) => {
                if (instance.selectedChapter.lobby_video_loop)
                    instance.audio.fadeOutBgMusic()
                else
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

    cacheChapterAssets(chapter) {
        instance.cacheChapterThumbnail(chapter.thumbnail)
        instance.cacheChapterBgMusic(chapter.background_music)
        instance.cacheChapterArchiveImages(chapter.archive)

        chapter['program'].forEach(checkpoint => {
            instance.cacheTaskDescriptionAudios(checkpoint.steps.filter(step => step.message && step.message.audio))
            instance.cacheTaskDescriptionVideos(checkpoint.steps.filter(step => step.message && step.message.video))
            instance.cacheTaskDescriptionMedia(checkpoint.steps.filter(step => step.message && step.message.media))
            instance.cacheSortingGameIcons(checkpoint.steps.filter(step => step.details && step.details.task_type == "sorting"))
            instance.cachePictureAndCodeImage(checkpoint.steps.filter(step => step.details && step.details.task_type == "picture_and_code"))
            instance.cacheDialogueAudios(checkpoint.steps.filter(step => step.details && step.details.task_type == "dialog"))
            instance.cacheGameDescriptionTutorials(checkpoint.steps.filter(step => step.details && step.details.tutorial))
            instance.cacheFlipCardsMedia(checkpoint.steps.filter(step => step.details && step.details.task_type == "flip_cards"))
            instance.cacheDavidsRefugeImages(checkpoint.steps.filter(step => step.details && step.details.task_type == "davids_refuge"))
            instance.cacheQuestionWithPictureImages(checkpoint.steps.filter(step => step.details && step.details.task_type == "question_with_picture"))
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

    cacheChapterLobbyVideoLoop(url) {
        if (!url) return
        instance.fetchAndCacheAsset(url)
    }

    cacheChapterArchiveImages(facts) {
        if (facts.length == 0) return
        facts.forEach(fact => instance.fetchAndCacheAsset(fact.image.url))
    }

    cacheTaskDescriptionAudios(steps) {
        if (steps.length == 0) return
        steps.forEach(step => instance.fetchAndCacheAsset(step.message.audio))
    }

    cacheTaskDescriptionVideos(steps) {
        if (steps.length == 0) return
        steps.forEach(step => instance.fetchAndCacheAsset(step.message.video))
    }

    cacheTaskDescriptionMedia(steps) {
        if (steps.length == 0) return
        steps.forEach(step => instance.fetchAndCacheAsset(step.message.media))
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

    cacheDialogueAudios(steps) {
        if (steps.length == 0) return
        steps.forEach(step => {
            step.dialog.forEach(dialog => instance.fetchAndCacheAsset(dialog.audio))
        })
    }

    cacheGameDescriptionTutorials(steps) {
        if (steps.length == 0) return
        steps.forEach(step => instance.fetchAndCacheAsset(step.details.tutorial))
    }

    cacheFlipCardsMedia(steps) {
        if (steps.length == 0) return
        steps.forEach(step => {
            instance.fetchAndCacheAsset(step.flip_cards.glitchs_voice.audio)
            instance.fetchAndCacheAsset(step.flip_cards.gods_voice.audio)

            if (!step.flip_cards.cards) return

            step.flip_cards.cards.forEach(card => {
                instance.fetchAndCacheAsset(card.image_back)
                instance.fetchAndCacheAsset(card.image_front)
                instance.fetchAndCacheAsset(card.sound_effect)
            })
        })
    }

    cacheDavidsRefugeImages(steps) {
        if (steps.length == 0) return
        steps.forEach(step => {
            step.davids_refuge.characters.forEach(character => instance.fetchAndCacheAsset(character.image))
        })
    }

    cacheQuestionWithPictureImages(steps) {
        if (steps.length == 0) return
        steps.forEach(step => {
            if (step.question_with_picture)
                instance.fetchAndCacheAsset(step.question_with_picture.image)
        })
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

    previewChapter() {
        instance.debug.addPreviewMode()
        instance.startChapter()
    }

    startChapter() {
        // Reset chapter if completed
        if (instance.chapterProgress() == instance.selectedChapter.program.length)
            instance.resetChapter()

        instance.page.removeLobby()
        instance.removeLobbyEventListeners()

        instance.setUpChapter()
        instance.fetchLobbyVideoLoop()
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

        document.querySelector('.fullscreen-section input').checked = true
        if (!document.fullscreenElement)
            document.documentElement.requestFullscreen()

        document.querySelector('.page').className = 'page page-home'
        document.querySelector('.cta').style.display = 'none'
    }

    currentChapterLabel() {
        const el = _gl.elementFromHtml(`
            <div class="page-title">
                <p>Chapter: <span>${instance.selectedChapter.title}</span></p>
                <p>Age: <span>${instance.selectedChapter.category}</span></p>
            </div>`)

        document.querySelector('.app-header').append(el)

        const tl = gsap.timeline()

        tl
            .set(el, { autoAlpha: 0, x: -20 })
            .to(el, { autoAlpha: 1, x: 0, })

        setTimeout(() => {
            tl.to(el, { autoAlpha: 0, x: -20 })
        }, 10000)
    }

    removeLobbyEventListeners() {
        instance.experience.navigation.prev.removeEventListener('click', instance.showIntro)
        instance.experience.navigation.next.removeEventListener("click", instance.startChapter)
    }

    setUpChapter() {
        instance.hideMenu()
        instance.program = new Program()
        instance.progressBar = new ProgressBar()
        instance.buttons.home.style.display = 'flex'
    }

    resetChapter() {
        localStorage.removeItem("progress-theme-" + instance.selectedChapter.id)
        localStorage.removeItem("answers-theme-" + instance.selectedChapter.id)
    }

    goHome() {
        document.body.classList.add('freeze')
        instance.program.destroy()
        instance.program.video.defocus()
        instance.program.removeInteractivity()
        instance.buttons.home.style.display = 'none'
        // instance.buttons.contact.style.display = 'flex'
        instance.buttons.guide.style.display = 'flex'

        document.querySelector('.cta').style.display = 'flex'
        instance.experience.navigation.prev.disabled = false

        instance.camera.updateCameraTo(null)
        instance.controlRoom.irisTextureTransition()
        instance.audio.stopAllTaskDescriptions()
        instance.audio.changeBgMusic()
        instance.debug.removePreviewMode()
        instance.showLobby()
        instance.preselectChapter()

        document.querySelector('.page-title')?.remove()

        if (instance.program.archive)
            instance.program.archive.remove()

        if (instance.program.pause)
            instance.program.pause.destroy()

        document.querySelector('.fullscreen-section input').checked = false
        if (document.fullscreenElement)
            document.exitFullscreen()
    }

    preselectChapter() {
        document.querySelector(".chapter[data-id='" + instance.selectedChapter.id + "']").click()
    }

    showActionButtons() {
        instance.experience.navigation.next.disabled = this.chapterProgress() == this.selectedChapter.program.length
    }

    hideMenu() {
        document.body.classList.remove('freeze')
        document.querySelector('.page').className = 'page page-home'

        // instance.buttons.contact.style.display = 'none'
        instance.buttons.guide.style.display = 'none'
    }

    hideLoading() {

        // instance.welcome.loading.style.display = "none"
        // instance.welcome.topBar.style.display = "flex"
        // instance.welcome.loadingScreen.classList.add('visible')

    }

    finishJourney() {
        instance.audio.changeBgMusic()

        if (instance.debug.onPreviewMode())
            return

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

    getId() {
        return "progress-theme-" + this.selectedChapter.id
    }

    resize() {
        if (this.points)
            this.points.resize()

    }

    update() {
        if (this.controlRoom)
            this.controlRoom.update()

        if (this.points)
            this.points.update()
  
    }
}