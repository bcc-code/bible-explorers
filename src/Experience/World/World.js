import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
import Environment from './Environment.js'
import Audio from '../Extras/Audio.js'
import Program from '../Progress/Program.js'
import ProgressBar from '../Components/ProgressBar.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _e from '../Utils/Events.js'
import _appInsights from '../Utils/AppInsights.js'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/shift-away.css'
import _gl from '../Utils/Globals.js'
import gsap from 'gsap'
// import Glitch from "./Glitch.js";

let instance = null
export default class World {
    constructor() {
        instance = this
        this.offline = new Offline()
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.page = this.experience.page
        this.time = this.experience.time

        // Wait for resources
        this.resources.on('ready', () => {
            instance.chaptersData = instance.resources.api[_api.getBiexChapters()]

            this.ageCategory = document.getElementById('app-age_category')
            this.appChapters = document.getElementById('app-chapters')
            this.chapterWrapper = document.getElementById('chapter-wrapper')

            // Select age category
            instance.experience.setAppView('age-category')

            this.ageCategory.querySelector('h3').innerText = _s.conceptDescription
            this.setCategories()

            // Setup
            this.controlRoom = new ControlRoom()
            this.environment = new Environment()
            this.audio = new Audio()
        })

        this.placeholderChapterData()
        this.chapterProgress = () => 0

        this.selectedQuality = this.experience.settings.videoQuality

        // Chapters
        this.chaptersData = []

        this.buttons = {
            // contact: document.querySelector('[aria-label="Contact"]'),
            home: document.querySelector('#home-button'),
            guide: document.querySelector('#guide-button'),
            startChapter: document.querySelector('#start-chapter'),
            backToAgeCateogry: document.querySelector('#back-to-age-category'),
        }

        this.buttons.home.addEventListener('click', this.goHome)
        this.buttons.backToAgeCateogry.addEventListener('click', this.showIntro)
        this.buttons.startChapter.addEventListener('click', this.startChapter)
    }

    placeholderChapterData() {
        instance.selectedChapter = {
            id: 0,
            program: null,
            data: null,
        }
    }

    showIntro() {
        instance.placeholderChapterData()
        instance.removeDescriptionHtml()

        // Hide chapter content/cards
        instance.appChapters.classList.remove('flex')
        instance.appChapters.classList.add('hidden')

        // Remove if existing categories
        if (instance.ageCategory.querySelector('ul').childNodes.length !== 0) {
            instance.ageCategory.querySelectorAll('li').forEach((item) => {
                item.remove()
            })
        }

        // Show age category
        instance.experience.setAppView('age-category')
        instance.setCategories()
    }

    showLobby() {
        instance.experience.setAppView('lobby')

        // Remove if existing chapters
        if (instance.appChapters.querySelector('#chapters-cards').childNodes.length !== 0) {
            instance.appChapters.querySelectorAll('.chapter').forEach((item) => {
                item.remove()
            })
        }

        // Set chapter content/cards
        instance.setChapters()

        instance.buttons.startChapter.innerHTML = `<span>${_s.journey.start}</span>`
    }

    setCategories() {
        if (instance.chaptersData.length == 0) instance.addNotAvailableInYourLanguageMessage()
        if (instance.chaptersData.hasOwnProperty('message')) return

        for (const [category, data] of Object.entries(instance.chaptersData)) {
            instance.setCategoryHtml({ name: data.name, slug: data.slug })
        }

        instance.selectCategoryListeners()
    }

    addNotAvailableInYourLanguageMessage() {
        const notAvailableEl = document.createElement('div')
        notAvailableEl.className = 'text-bke-accent font-bold'
        notAvailableEl.innerText = _s.notAvailable
        instance.menu.categories.appendChild(notAvailableEl)
    }

    setCategoryHtml(category) {
        const categoryBtn = _gl.elementFromHtml(`<li><button class="category button-default" data-slug="${category.slug}">${category.name}</button></li>`)
        this.ageCategory.querySelector('ul').appendChild(categoryBtn)
    }

    selectCategoryListeners() {
        document.querySelectorAll('.category').forEach(function (category) {
            category.addEventListener('click', () => {
                instance.selectedCategory = category.getAttribute('data-slug')
                instance.showLobby()
                instance.audio.changeBgMusic()
            })
        })
    }

    setChapters() {
        instance.chaptersData[instance.selectedCategory]['chapters'].forEach((chapter) => {
            instance.setChapterHtml(chapter)
        })

        instance.buttons.startChapter.disabled = true
        instance.chapterEventListeners()
    }

    setChapterHtml(chapter) {
        let chapterHtml = document.createElement('article')

        let chapterClasses = 'chapter rounded-lg '
        chapterClasses += chapter.status == 'future' ? ' locked' : ''
        chapterClasses += chapter.is_beta === true ? ' beta' : ''
        chapterHtml.className = chapterClasses

        chapterHtml.setAttribute('data-id', chapter.id)
        chapterHtml.setAttribute('data-slug', chapter.category)

        chapterHtml.innerHTML = `
            <header class="chapter__heading">
                <h2 class="chapter__title text-3xl">${chapter.title}</h2>
                <span class="chapter__date text-lg opacity-70">${chapter.date}</span>
            </header>
            <div class="coming-soon">Coming soon</div>
            <div class="chapter__states">
                <div class="chapter__offline">
                    <svg class="h-2 w-3"><use href="#download-solid" fill="currentColor"></use></svg>
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
                    <svg class="h-2 w-3"><use href="#check-solid" fill="currentColor"></use></svg>
                    <span>${_s.offline.availableOffline.title}</span>
                </div>
            </div>
        `

        this.appChapters.querySelector('#chapters-cards').appendChild(chapterHtml)

        instance.offline.fetchChapterAsset(chapter, 'thumbnail', instance.setChapterBgImage)
        instance.offline.markChapterIfAvailableOffline(chapter)
        instance.setStatesTooltips()
    }

    setDescriptionHtml() {
        let chapter = instance.selectedChapter
        let numberOfEpisodes = 0
        let numberOfTasks = 0
        let numberOfQuizes = 0

        chapter.program.forEach((checkpoint) => {
            if (checkpoint.steps.some((step) => step.details.step_type == 'video')) numberOfEpisodes++
            else if (checkpoint.steps.some((step) => step.details.step_type == 'quiz')) numberOfQuizes++
            else if (checkpoint.steps.some((step) => step.details.step_type == 'task')) numberOfTasks++
        })

        const details = _gl.elementFromHtml(` <div id="chapter-description" class="rounded-lg border-2 border-bke-orange p-4 bg-bke-purple"></div>`)
        const header = _gl.elementFromHtml(`<h2 class="text-3xl">${chapter.title}</h2>`)

        details.append(header)

        const attachments = _gl.elementFromHtml(`<div class="attachments"></div>`)

        if (chapter.other_attachments.length) {
            chapter.other_attachments.forEach((attachment) => {
                const link = attachment.link_to_file_of_other_attachment

                if (link.includes('mentor')) {
                    const linkParts = link.split('/')
                    const pageSlug = linkParts[linkParts.length - 2]

                    const guide = _gl.elementFromHtml(`
            <a class="inline-flex items-center text-xl mt-2 px-2 py-1 border-2 gap-1 border-bke-orange rounded-lg hover:bg-bke-orange hover:text-bke-purple" href="https://biblekids.io/${localStorage.getItem('lang')}/${pageSlug}/" target="_blank">
                <svg class="h-4 w-4"><use href="#book-solid" fill="currentColor"></use></svg>
                <span>${_s.chapter.activityDescLabel}</span>
            </a>`)

                    attachments.append(guide)
                }
            })
        }

        details.append(attachments)

        const description = _gl.elementFromHtml(`<div class="mb-6 py-4 border-b-2 border-white/10 text-xl">${chapter.content}</div>`)
        details.append(description)

        if (numberOfEpisodes > 0 || numberOfTasks > 0 || numberOfQuizes > 0) {
            const info = _gl.elementFromHtml(`<ul class="text-bke-accent flex gap-4 my-4"></ul>`)

            details.append(info)

            if (numberOfEpisodes != 1) {
                const videoLabel = _gl.elementFromHtml(`<li class="flex gap-2 items-center text-xl"><svg class="h-4 w-4"><use href="#film-solid" fill="currentColor"></use></svg><span>${numberOfEpisodes} ${_s.chapter.infoPlural.video}</span></li>`)
                info.append(videoLabel)
            } else {
                const videoLabel = _gl.elementFromHtml(`<li class="flex gap-2 items-center text-xl"><svg class="h-4 w-4"><use href="#film-solid" fill="currentColor"></use></svg><span>${numberOfEpisodes} ${_s.chapter.infoSingular.video}</span></li>`)
                info.append(videoLabel)
            }

            if (numberOfTasks != 1) {
                const taskLabel = _gl.elementFromHtml(`<li class="flex gap-2 items-center text-xl"><svg class="h-4 w-4"><use href="#pen-to-square-solid" fill="currentColor"></use></svg></svg><span>${numberOfTasks} ${_s.chapter.infoPlural.task}</span></li>`)
                info.append(taskLabel)
            } else {
                const taskLabel = _gl.elementFromHtml(`<li class="flex gap-2 items-center text-xl"><svg class="h-4 w-4"><use href="#pen-to-square-solid" fill="currentColor"></use></svg></svg><span>${numberOfTasks} ${_s.chapter.infoSingular.task}</span></li>`)
                info.append(taskLabel)
            }

            if (numberOfQuizes != 1) {
                const quizLabel = _gl.elementFromHtml(`<li class="flex gap-2 items-center text-xl"><svg class="h-4 w-4"><use href="#question-solid" fill="currentColor"></use></svg><span>${numberOfQuizes} ${_s.chapter.infoPlural.quiz}</span></li>`)
                info.append(quizLabel)
            } else {
                const quizLabel = _gl.elementFromHtml(`<li class="flex gap-2 items-center text-xl"><svg class="h-4 w-4"><use href="#question-solid" fill="currentColor"></use></svg><span>${numberOfQuizes} ${_s.chapter.infoSingular.quiz}</span></li>`)
                info.append(quizLabel)
            }
        }

        this.appChapters.querySelector('#chapters-description').append(details)
        this.appChapters.querySelector('#chapters-cards').classList.add('chapter-selected')
    }

    removeDescriptionHtml() {
        this.appChapters.querySelector('#chapters-cards').classList.remove('chapter-selected')
        if (this.appChapters.querySelector('#chapter-description')) this.appChapters.querySelector('#chapter-description').remove()
    }

    chapterEventListeners() {
        this.appChapters.querySelectorAll('.chapter').forEach((chapter) => {
            chapter.addEventListener('click', () => {
                if (document.querySelector('#chapter-description')) document.querySelector('#chapter-description').remove()

                instance.updateSelectedChapterData(chapter)
                instance.addClassToSelectedChapter(chapter)
                instance.loadChapterTextures()
                instance.fetchBtvVideos()
                instance.showActionButtons()
                instance.setDescriptionHtml()

                instance.buttons.startChapter.disabled = false
            })
        })

        this.appChapters.querySelectorAll('.chapter__offline').forEach(function (chapter) {
            chapter.addEventListener('click', (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })

        this.appChapters.querySelectorAll('.chapter__downloaded').forEach(function (button) {
            button.addEventListener('click', instance.confirmRedownload)
        })

        this.appChapters.querySelectorAll('.chapter__download-failed').forEach(function (chapter) {
            chapter.addEventListener('click', (event) => {
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
        button.addEventListener('click', instance.confirmRedownload)
    }

    confirmRedownload(event) {
        const button = event.currentTarget
        button.removeEventListener('click', instance.confirmRedownload)

        button.innerHTML = `<span style="margin-right: 0.25rem">${_s.offline.redownloadConfirmation}</span>
            <svg class="refuse | xmark-icon icon"  viewBox="0 0 17 16"><use href="#xmark"></use></svg>
            <span class="separator">/</span>
            <svg class="redownload | check-mark-icon icon" viewBox="0 0 23 16"><use href="#check-mark"></use></svg>`

        button.querySelector('.refuse').addEventListener('click', (event) => {
            instance.setDownloadHtml(button)
            event.stopPropagation()
        })
        button.querySelector('.redownload').addEventListener('click', (event) => {
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
        document.querySelectorAll('.chapter').forEach(function (thisChapter) {
            thisChapter.classList.remove('selected')
        })
    }

    updateSelectedChapterData(chapter) {
        const chapterId = chapter.getAttribute('data-id')
        const categorySlug = chapter.getAttribute('data-slug')
        instance.selectedChapter = instance.chaptersData[categorySlug]['chapters'].find((chapter) => {
            return chapter.id == chapterId
        })
    }

    loadChapterTextures() {
        instance.selectedChapter.episodes.forEach((episode) => {
            const fileName = episode.type + '-' + episode.id
            if (instance.resources.videoPlayers.hasOwnProperty(fileName)) return

            instance.resources.loadEpisodeTextures(fileName)
        })
    }

    fetchBtvVideos() {
        instance.selectedChapter.program.forEach((checkpoint) => {
            checkpoint.steps.forEach((step) => {
                if (step.details.step_type == 'iris' && step.message?.video) instance.resources.loadTextureInBtvPlayer(step.message.video)

                if (step.details.step_type == 'task' && step.details.task_type == 'video_with_question' && step.video_with_question.video) instance.resources.loadTextureInBtvPlayer(step.video_with_question.video)
            })
        })
    }

    async downloadChapter(chapter) {
        if (!this.experience.auth0.isAuthenticated) return

        let chapterEl = chapter.closest('.chapter')
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.chaptersData[categorySlug]['chapters'].find((chapter) => {
            return chapter.id == chapterId
        })

        instance.cacheChapterAssets(selectedChapter)

        chapterEl.classList.remove('download')
        chapterEl.classList.remove('failed')
        chapterEl.classList.add('downloading')

        this.offline.downloadScreenTextures(selectedChapter)
        this.offline.downloadEpisodes(chapterId, selectedChapter['episodes'])
    }

    removeDownload(chapter) {
        let chapterEl = chapter.closest('.chapter')
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.chaptersData[categorySlug]['chapters'].find((chapter) => {
            return chapter.id == chapterId
        })

        selectedChapter['episodes'].forEach((episode) => this.offline.deleteEpisodeFromDb(episode.type + '-' + episode.id))
        chapterEl.classList.remove('downloaded')
    }

    fetchBgMusic() {
        if (instance.selectedChapter.background_music) {
            instance.offline.fetchChapterAsset(instance.selectedChapter, 'background_music', (chapter) => {
                instance.audio.changeBgMusic(chapter.background_music)
            })
        }
    }

    fetchArchiveImage() {
        instance.selectedChapter.archive.forEach((fact) => {
            instance.offline.fetchChapterAsset(fact.image, 'url', (data) => {
                fact.image = data
            })
        })
    }

    cacheChapterAssets(chapter) {
        instance.cacheChapterThumbnail(chapter.thumbnail)
        instance.cacheChapterBgMusic(chapter.background_music)
        instance.cacheChapterArchiveImages(chapter.archive)

        chapter['program'].forEach((checkpoint) => {
            instance.cacheTaskDescriptionAudios(checkpoint.steps.filter((step) => step.message && step.message.audio))
            instance.cacheTaskDescriptionVideos(checkpoint.steps.filter((step) => step.message && step.message.video))
            instance.cacheTaskDescriptionMedia(checkpoint.steps.filter((step) => step.message && step.message.media))
            instance.cacheSortingGameIcons(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'sorting'))
            instance.cachePictureAndCodeImage(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'picture_and_code'))
            instance.cacheDialogueAudios(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'dialog'))
            instance.cacheGameDescriptionTutorials(checkpoint.steps.filter((step) => step.details && step.details.tutorial))
            instance.cacheFlipCardsMedia(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'flip_cards'))
            instance.cacheChooseNewKingMedia(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'choose_new_king'))
            instance.cacheDavidsRefugeImages(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'davids_refuge'))
            instance.cacheMultipleChoiceWithPicture(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'multiple_choice_with_picture'))
            instance.cacheConfirmationScreenImages(checkpoint.steps.filter((step) => step.details && step.details.step_type == 'task' && step.details.task_type == 'confirmation_screen'))
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
        facts.forEach((fact) => instance.fetchAndCacheAsset(fact.image.url))
    }

    cacheTaskDescriptionAudios(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => instance.fetchAndCacheAsset(step.message.audio))
    }

    cacheTaskDescriptionVideos(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => instance.fetchAndCacheAsset(step.message.video))
    }

    cacheTaskDescriptionMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => instance.fetchAndCacheAsset(step.message.media))
    }

    cacheSortingGameIcons(sortingTasks) {
        if (sortingTasks.length == 0) return
        sortingTasks.forEach((task) =>
            task.sorting.forEach((s) => {
                instance.fetchAndCacheAsset(s.icon)
            })
        )
    }

    cachePictureAndCodeImage(pictureAndCodeTasks) {
        if (pictureAndCodeTasks.length == 0) return
        pictureAndCodeTasks.forEach((task) => instance.fetchAndCacheAsset(task.picture_and_code.picture))
    }

    cacheDialogueAudios(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            step.dialog.forEach((dialog) => instance.fetchAndCacheAsset(dialog.audio))
        })
    }

    cacheGameDescriptionTutorials(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => instance.fetchAndCacheAsset(step.details.tutorial))
    }

    cacheFlipCardsMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            if (!step.flip_cards.cards) return

            instance.fetchAndCacheAsset(step.confirmation_screen.cs_image)

            step.flip_cards.cards.forEach((card) => {
                instance.fetchAndCacheAsset(card.image_back)
                instance.fetchAndCacheAsset(card.image_front)
                instance.fetchAndCacheAsset(card.sound_effect)
            })
        })
    }

    cacheChooseNewKingMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            instance.fetchAndCacheAsset(step.choose_new_king.glitchs_voice.audio)
            instance.fetchAndCacheAsset(step.choose_new_king.gods_voice.audio)

            if (!step.choose_new_king.cards) return

            step.choose_new_king.cards.forEach((card) => {
                instance.fetchAndCacheAsset(card.image_back)
                instance.fetchAndCacheAsset(card.image_front)
                instance.fetchAndCacheAsset(card.sound_effect)
            })
        })
    }

    cacheDavidsRefugeImages(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            step.davids_refuge.characters.forEach((character) => instance.fetchAndCacheAsset(character.image))
        })
    }

    cacheMultipleChoiceWithPicture(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            instance.fetchAndCacheAsset(step.multiple_choice_with_picture.image)
        })
    }

    cacheConfirmationScreenImages(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            instance.fetchAndCacheAsset(step.confirmation_screen.cs_image)
        })
    }

    fetchAndCacheAsset(url) {
        if (!url) return
        caches.open('chaptersAssets').then((cache) => {
            var request = new Request(url)
            fetch(request).then((fetchedResponse) => {
                cache.put(url, fetchedResponse)
            })
        })
    }

    startChapter() {
        // Reset chapter if completed
        if (instance.chapterProgress() == instance.selectedChapter.program.length) instance.resetChapter()

        instance.experience.setAppView('chapter')

        instance.setUpChapter()
        instance.fetchBgMusic()
        instance.fetchArchiveImage()

        _appInsights.trackEvent({
            name: 'Start chapter',
            properties: {
                title: instance.selectedChapter.title,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality,
            },
        })

        document.querySelector('#fullscreen-setting input').checked = true
        if (!document.fullscreenElement) document.documentElement.requestFullscreen()

        setTimeout(function () {
            instance.progressBar.show()
        }, 1000)
    }

    currentChapterLabel() {
        const el = _gl.elementFromHtml(`
            <div class="page-title">
                <p>Chapter: <span>${instance.selectedChapter.title}</span></p>
                <p>Age: <span>${instance.selectedChapter.category}</span></p>
            </div>`)

        document.querySelector('#header').append(el)

        const tl = gsap.timeline()

        tl.set(el, { autoAlpha: 0, x: -20 }).to(el, { autoAlpha: 1, x: 0 })

        setTimeout(() => {
            tl.to(el, { autoAlpha: 0, x: -20 })
        }, 10000)
    }

    setUpChapter() {
        document.body.classList.remove('freeze')

        instance.program = new Program()
        instance.progressBar = new ProgressBar()
    }

    resetChapter() {
        localStorage.removeItem('progress-theme-' + instance.selectedChapter.id)
        localStorage.removeItem('answers-theme-' + instance.selectedChapter.id)
    }

    goHome() {
        document.body.classList.add('freeze')

        if (instance.program) {
            instance.program.destroy()
            instance.program.video.defocus()
            instance.progressBar.hide()
        }

        instance.controlRoom.irisTextureTransition()
        instance.audio.stopAllTaskDescriptions()
        instance.audio.changeBgMusic()

        instance.showLobby()
        instance.preselectChapter()

        document.querySelector('.page-title')?.remove()

        if (instance.program.archive) instance.program.archive.remove()
        if (instance.program.pause) instance.program.pause.destroy()

        document.querySelector('#fullscreen-setting input').checked = false

        if (document.fullscreenElement) document.exitFullscreen()
    }

    preselectChapter() {
        document.querySelector(".chapter[data-id='" + instance.selectedChapter.id + "']").click()
    }

    showActionButtons() {
        this.buttons.startChapter.disabled = this.chapterProgress() == this.selectedChapter.program.length
    }

    finishJourney() {
        instance.audio.changeBgMusic()

        _appInsights.trackEvent({
            name: 'Finish chapter',
            properties: {
                title: instance.selectedChapter.title,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality,
            },
        })
    }

    getId() {
        return 'progress-theme-' + this.selectedChapter.id
    }
}
