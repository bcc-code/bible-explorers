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
import { gsap } from "gsap";

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
            chaptersWrapper: document.querySelector(".chapter__items"),
            currentSelectedChapter: (chapters, index) => {
                return Array.from(chapters).filter(chapter => chapter.getAttribute('data-index') == index)
            },
            numbers: document.querySelector(".chapter__number"),
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
            start: document.getElementById("start"),
            back: document.getElementById("back"),
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

            setTimeout(function () {
                instance.welcome.loading.style.display = "none"
                instance.welcome.topBar.style.display = "flex"
                instance.welcome.loadingScreen.classList.add('visible')
            }, 1000)
        })

        this.start = document.createElement('span')
        this.start.innerText = _s.journey.start

        this.welcome.introduction.innerText = _s.introduction
        this.buttons.start.children[0].appendChild(this.start)

        this.homeButton = document.getElementById('go-home')
        this.homeButton.addEventListener("click", this.goHome)

        this.buttons.back.addEventListener("click", this.goToLandingScreen)
        this.buttons.back.innerText = _s.journey.back

    }

    placeholderChapterData() {
        instance.selectedChapter = {
            id: 0,
            program: null,
            data: null
        }
    }

    goHome() {
        instance.changeTextStartButton()
        instance.showMenu()
        instance.program.video.defocus()
        instance.camera.updateCameraTo()
        instance.audio.playWhoosh()
        instance.audio.changeBgMusic()
    }

    changeTextStartButton() {
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

        instance.menu.chaptersWrapper.innerHTML = ''
        instance.menu.numbers.innerHTML = ''
        instance.welcome.loadingScreen.classList.add('visible')
        instance.welcome.chaptersScreen.classList.remove('visible')
    }

    setChapters(data) {
        data.forEach((chapter, index) => {
            instance.setChapterHtml(chapter, index)
            instance.welcome.loadingScreen.classList.remove('visible')
            instance.welcome.chaptersScreen.classList.add('visible')
        })

        const chapters = document.querySelectorAll(".chapter")
        chapters.forEach(chapter => {
            gsap.set(chapter, { autoAlpha: 0 })
        })
        const chaptersPublished = document.querySelectorAll(".chapter:not(.locked)")
        const lastPubished = chaptersPublished[chaptersPublished.length - 1]
        gsap.set(lastPubished, { autoAlpha: 1 })

        const chaptersNumber = document.querySelectorAll(".chapter__number button")
        const activeNumber = Array.from(chaptersNumber)[chaptersPublished.length - 1]
        activeNumber.classList.add('active')

        instance.updateSelectedChapterData(lastPubished)
        instance.changeTextStartButton()

        instance.selectChapterListeners()

        document.querySelectorAll('.chapter__wrapper-content').forEach(chapter => {
            gsap.set(chapter, { autoAlpha: 0, height: 0 })
        })
    }

    setChapterHtml(chapter, index) {
        let chapterHtml = document.createElement("div")
        let chapterClasses = "chapter"
        chapterClasses += chapter.status == "future" ? " locked" : ""
        chapterHtml.className = chapterClasses
        chapterHtml.setAttribute("data-id", chapter.id)
        chapterHtml.setAttribute("data-slug", chapter.category)

        let numberHTML = document.createElement('button')
        let numberClasses = "chapter_no"
        numberClasses += chapter.status == "future" ? " locked" : ""
        numberHTML.className = numberClasses
        numberHTML.setAttribute('data-id', chapter.id)
        numberHTML.setAttribute("data-slug", chapter.category)

        let number = document.createElement('span')

        console.log(numberHTML.classList.contains("locked"));

        if (!numberHTML.classList.contains("locked")) {
            number.innerText = index + 1
        } else {
            number.classList.add('icon-lock-solid')
        }
        numberHTML.appendChild(number)

        const chapterContainer = document.createElement('div')
        chapterContainer.classList.add('chapter__wrapper')

        const chapterHeading = document.createElement('div')
        chapterHeading.classList.add('chapter__heading')

        const chapterTitle = document.createElement('h2')
        chapterTitle.classList.add('chapter__title')
        chapterTitle.innerText = chapter.title
        chapterHeading.appendChild(chapterTitle)
        chapterContainer.appendChild(chapterHeading)

        const chapterDiv = document.createElement('div')
        chapterDiv.classList.add('chapter__wrapper-content')

        const chapterAttachments = document.createElement('div')
        chapterAttachments.classList.add('chapter__attachments')

        if (chapter.attachments.length) {
            chapter.attachments.forEach(a => {
                const attachment = document.createElement('div')
                attachment.classList.add('attachment')

                const link = document.createElement('a')
                link.setAttribute('href', a.url)
                link.setAttribute('target', '_blank')

                const name = document.createElement('span')
                name.classList.add('attachment__name')
                name.innerText = a.title

                link.appendChild(name)
                attachment.appendChild(link)
                chapterAttachments.appendChild(attachment)
                chapterDiv.appendChild(chapterAttachments)
            })
        }

        const chapterContent = document.createElement('div')
        chapterContent.classList.add('chapter__content')
        chapterContent.innerHTML = chapter.content
        chapterDiv.appendChild(chapterContent)

        chapterContainer.appendChild(chapterDiv)

        const chapterStates = document.createElement('div')
        chapterStates.classList.add('chapter__states')

        const chapterOffline = document.createElement('div')
        const chapterOfflineText = document.createElement('span')
        chapterOffline.classList.add('chapter__offline')
        chapterOfflineText.innerText = _s.offline.download
        chapterOffline.appendChild(chapterOfflineText)

        const chapterDownloading = document.createElement('div')
        const chapterDownloadingText = document.createElement('span')
        const chapterDownloadingProgress = document.createElement('span')
        const chapterDownloadingProgressLine = document.createElement('span')
        const chapterDownloadingLabel = document.createElement('span')
        chapterDownloading.classList.add('chapter__downloading')
        chapterDownloadingProgress.classList.add('downloading-progress')
        chapterDownloadingProgressLine.classList.add('progress-line')
        chapterDownloadingLabel.classList.add('downloading-label')
        chapterDownloadingText.innerText = _s.offline.downloading
        chapterDownloadingProgress.appendChild(chapterDownloadingProgressLine)
        chapterDownloading.appendChild(chapterDownloadingText)
        chapterDownloading.appendChild(chapterDownloadingProgress)
        chapterDownloading.appendChild(chapterDownloadingLabel)

        const chapterDownloadFailed = document.createElement('div')
        const chapterDownloadFailedText = document.createElement('span')
        const chapterDownloadFailedSeparator = document.createElement('span')
        const chapterDownloadFailedIcon = document.createElement('span')
        chapterDownloadFailed.classList.add('chapter__download-failed')
        chapterDownloadFailedSeparator.classList.add('separator')
        chapterDownloadFailedText.innerText = _s.offline.downloadFailed
        chapterDownloadFailedIcon.setAttribute('title', _s.offline.tryAgain)
        chapterDownloadFailed.appendChild(chapterDownloadFailedText)
        chapterDownloadFailed.appendChild(chapterDownloadFailedSeparator)
        chapterDownloadFailed.appendChild(chapterDownloadFailedIcon)

        const chapterdownloaded = document.createElement('div')
        const chapterdownloadedText = document.createElement('span')
        const chapterdownloadedSeparator = document.createElement('span')
        const chapterdownloadedIcon = document.createElement('span')
        chapterdownloaded.classList.add('chapter__downloaded')
        chapterdownloadedSeparator.classList.add('separator')
        chapterdownloadedText.innerText = _s.offline.availableOffline
        chapterdownloadedIcon.setAttribute('title', _s.offline.update)
        chapterdownloaded.appendChild(chapterdownloadedText)
        chapterdownloaded.appendChild(chapterdownloadedSeparator)
        chapterdownloaded.appendChild(chapterdownloadedIcon)

        chapterStates.appendChild(chapterOffline)
        chapterStates.appendChild(chapterDownloading)
        chapterStates.appendChild(chapterDownloadFailed)
        chapterStates.appendChild(chapterdownloaded)

        gsap.fromTo(chapterStates, { height: 0 }, { height: 'auto' })

        chapterHtml.appendChild(chapterContainer)
        chapterHtml.appendChild(chapterStates)

        instance.menu.chaptersWrapper.appendChild(chapterHtml)
        instance.menu.numbers.appendChild(numberHTML)
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
        document.querySelector('.chapter[data-id="' + chapter.id + '"] .chapter__heading').style.backgroundImage = 'url("' + chapter.thumbnail + '")'
    }

    selectChapterListeners() {

        const chaptersNumber = document.querySelectorAll('.chapter__number button')
        const chapters = document.querySelectorAll(".chapter")

        chaptersNumber.forEach(number => {
            number.addEventListener('click', () => {
                chapters.forEach(chapter => {
                    gsap.to(chapter.querySelector('.chapter__wrapper-content'), { autoAlpha: 0, height: '0', duration: 0.3 })
                    gsap.to(chapter, { autoAlpha: 0, duration: 0.3 })
                })
                chaptersNumber.forEach(number => number.classList.remove('active'))

                number.classList.add('active')

                const chapterId = number.getAttribute('data-id')
                const selectedChapter = Array.from(chapters).find(c => c.getAttribute('data-id') == chapterId)
                gsap.to(selectedChapter, { autoAlpha: 1, duration: 0.3 })

                instance.updateSelectedChapterData(selectedChapter)
                instance.loadChapterTextures()
                instance.changeTextStartButton()
            })
        })


        document.querySelectorAll(".chapter:not(.locked), body.admin .chapter").forEach((chapter) => {
            chapter.addEventListener("click", () => {
                gsap.to(chapter.querySelector('.chapter__wrapper-content'), { autoAlpha: 1, height: 'auto', duration: 0.3 })
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

    addClassToSelectedChapter() {
        instance.unselectAllChapters()
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

        document.querySelector('.chapter__states').classList.add('downloading')

        chapterEl.classList.remove('download')
        chapterEl.classList.remove('failed')
        chapterEl.classList.add('downloading')

        await this.downloadEpisodes(selectedChapter['episodes'], { chapterId, chapterTitle: selectedChapter.title, categorySlug })
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

    async downloadEpisodes(episodes, data) {
        let episodesDownloadUrls = []

        episodes.forEach(async (episode) => {
            const episodeUrls = await this.getEpisodeDownloadUrls(episode.id, data.chapterId)
            if (!episodeUrls) return

            episodesDownloadUrls.push({
                downloadUrl: episodeUrls.downloadUrl,
                data: {
                    name: episode.type + '-' + episode.id,
                    thumbnail: episodeUrls.thumbnail,
                    chapterId: data.chapterId,
                    chapterTitle: data.chapterTitle,
                    category: data.categorySlug,
                    language: _lang.getLanguageCode(),
                    quality: instance.selectedQuality
                }
            })

            if (episodesDownloadUrls.length == episodes.length) {
                this.offline.downloadFromWeb(episodesDownloadUrls)
            }
        })
    }

    async getEpisodeDownloadUrls(episodeId, chapterId) {
        const claims = await this.experience.auth0.getIdTokenClaims();
        const idToken = claims.__raw;
        let locale = _lang.getLanguageCode()
        locale = 'pt-pt' == locale ? 'pt' : locale // BTV and WPML have different language codes

        var btvPlayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale,
            access_token: idToken
        })

        const allLanguagesVideos = await btvPlayer.api.getDownloadables('episode', episodeId)
        const myLanguageVideos = allLanguagesVideos.filter(video => { return video.language.code == locale })

        if (!myLanguageVideos.length) {
            _appInsights.trackException({
                exception: "No videos found",
                chapterId: chapterId,
                episodeId: episodeId,
                language: locale
            })

            // There was a problem downloading the episode
            const chapter = document.querySelector('.chapter[data-id="' + chapterId + '"]')
            chapter.classList.remove('downloading')
            chapter.classList.add('failed')

            return
        }

        const selectedQualityVideo = instance.getSelectedQualityVideo(myLanguageVideos)
        const episode = {
            downloadUrl: await btvPlayer.api.getDownloadable('episode', episodeId, selectedQualityVideo.id),
            info: await btvPlayer.api.getEpisodeInfo('episode', episodeId)
        }

        return {
            downloadUrl: episode.downloadUrl,
            thumbnail: episode.info.image
        }
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
        instance.loadChapterTextures()

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