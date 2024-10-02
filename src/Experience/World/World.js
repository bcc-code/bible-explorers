import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import ControlRoom from './ControlRoom.js'
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
import isElectron from 'is-electron'

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
            const personId = this.experience.auth0.userData
                ? this.experience.auth0.userData['https://login.bcc.no/claims/personId']
                : ''
            instance.chaptersData = instance.resources.api[_api.getBiexChapters(personId)]

            this.ageCategory = document.getElementById('app-age_category')
            this.chapterSelectWrapper = document.getElementById('chapter-select')
            this.chapterWrapper = document.getElementById('chapter-wrapper')

            // Select age category
            instance.experience.setAppView('age-category')

            this.ageCategory.querySelector('h1').innerText = _s.conceptDescription
            this.setCategories()

            // Setup
            this.controlRoom = new ControlRoom()
            this.audio = new Audio()
        })

        this.setDownloadModalHTML()

        this.placeholderChapterData()
        this.chapterProgress = () => 0

        this.selectedQuality = this.experience.settings.videoQuality

        // Chapters
        this.chaptersData = []

        this.buttons = {
            openDownloadModal: document.querySelector('#download-app'),
            home: document.querySelector('#home-button'),
            guide: document.querySelector('#guide-button'),
            backToAgeCateogry: document.querySelector('#back-to-age-category'),
            contact: document.querySelector('#contact-button'),
        }

        tippy(this.buttons.openDownloadModal, {
            theme: 'explorers',
            content: _s.offline.downloadApp.title,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })

        tippy(this.buttons.home, {
            theme: 'explorers',
            content: `Home`,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })

        tippy(this.buttons.contact, {
            theme: 'explorers',
            content: _s.settings.contact,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })

        this.buttons.openDownloadModal.addEventListener('click', this.openDownloadModal)

        this.buttons.home.addEventListener('click', this.goHome)
        this.buttons.backToAgeCateogry.addEventListener('click', this.showIntro)
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
        if (instance.experience.interface.chaptersList.querySelector('ul').childNodes.length !== 0) {
            instance.experience.interface.chaptersList.querySelectorAll('.chapter').forEach((item) => {
                item.remove()
            })
        }

        // Set chapter content/cards
        instance.setChapters()
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
        const categoryBtn = _gl.elementFromHtml(
            `<li>
                <button class="category button-grid uppercase" data-slug="${category.slug}">  
                    <div class="corner top-left"></div>
                    <div class="edge top"></div>
                    <div class="corner top-right"></div>
                    <div class="edge left"></div>
                    <div class="content">${category.name}</div>
                    <div class="edge right"></div>
                    <div class="corner bottom-left"></div>
                    <div class="edge bottom"></div>
                    <div class="corner bottom-right"></div>
                </button>
            </li>`
        )
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

        if (instance.buttons.startChapter) {
            instance.buttons.startChapter.disabled = true
        }
        instance.chapterEventListeners()
    }

    setChapterHtml(chapter) {
        let chapterHtml = _gl.elementFromHtml(
            `<li class="chapter group ${chapter.is_beta === true ? 'beta' : ''} ${chapter.status == 'future' ? ' locked' : ''}">
                <a href="javascript:void(0)" class="chapter-box">
                    <div class="chapter-card">
                        <div class="corner top-left"></div>
                        <div class="edge top"></div>
                        <div class="corner top-right"></div>
                        <div class="edge left"></div>
                        <div class="content">
                            <h6 class="chapter-heading">${chapter.title}</h6>
                            <p class="chapter-date">${chapter.date}</p>
                        </div>
                        <div class="edge right"></div>
                        <div class="corner bottom-left"></div>
                        <div class="edge bottom"></div>
                        <div class="corner bottom-right"></div>
                    </div>
                    <div class="chapter__offline">
                        <span class="chapter__downloaded-quota hidden"></span>
                        <button class="chapter__download button-grid group-[.downloaded]:hidden">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">
                                <svg class="icon"><use href="#download-solid" fill="currentColor"></use></svg>
                            </div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </button>
                        <button class="chapter__remove button-grid !hidden">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">
                                <svg class="icon"><use href="#folder-xmark-solid" fill="currentColor"></use></svg>
                            </div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </button>
                    </div>
                    <span class="chapter__loading"></span>
                </a>
                <div class="chapter-status">
                    <div class="chapter__downloading">
                        <div class="flex items-center gap-[5%] w-full">
                            <span class="downloading-title">${_s.offline.downloading}</span>
                            <div class="downloading-progress">
                                <span class="progress-line"></span>
                            </div>
                            <span class="downloading-label"></span>
                        </div>
                    </div>
                    <div class="chapter__download-failed">${_s.offline.downloadFailed}</div>
                    <div class="chapter__downloaded">
                        <svg class="icon"><use href="#check-solid" fill="currentColor"></use></svg>
                        <span>${_s.offline.availableOffline.title}</span>
                    </div>
                    <div class="chapter__outdated">
                        <svg class="icon"><use href="#file-circle-exclamation-solid" fill="currentColor"></use></svg>
                        <span>${_s.offline.outdated}</span>
                    </div>
                </div>
            </li>`
        )

        chapterHtml.setAttribute('data-id', chapter.id)
        chapterHtml.setAttribute('data-slug', chapter.category)

        // <span>${_s.offline.download.title}</span>

        instance.experience.interface.chaptersList.querySelector('ul').appendChild(chapterHtml)
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

        const details = _gl.elementFromHtml(`
            <div class="chapter-description">
                <div class="corner top-left"></div>
                <div class="edge top"></div>
                <div class="corner top-right"></div>
                <div class="edge left"></div>
                <div class="content">
                    <h3 class="chapter-description-heading">${chapter.title}</h3>
                    <div class="chapter-description-text scroller"> ${chapter.content}</div>
                    <div class="chapter-actions">
                        <button class="button-grid" id="start-chapter">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">${_s.journey.start}</div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </button>
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>`)

        if (chapter.other_attachments.length) {
            chapter.other_attachments.forEach((attachment) => {
                const link = attachment.link_to_file_of_other_attachment

                if (link.includes('mentor')) {
                    const linkParts = link.split('/')
                    const pageSlug = linkParts[linkParts.length - 2]

                    const guide = _gl.elementFromHtml(`
                        <a class="button-grid chapter-guide" href="https://biblekids.io/${localStorage.getItem('lang')}/${pageSlug}/" target="_blank">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">
                                <svg class="icon"><use href="#book-solid" fill="currentColor"></use></svg>
                            </div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </a>`)

                    details.querySelector('.chapter-actions').prepend(guide)
                }
            })
        }

        if (numberOfEpisodes > 0 || numberOfTasks > 0 || numberOfQuizes > 0) {
            const info = _gl.elementFromHtml(`<ul class="text-bke-accent gap-8 hidden"></ul>`)

            details.append(info)

            if (numberOfEpisodes != 1) {
                const videoLabel = _gl.elementFromHtml(
                    `<li class="flex gap-2 items-center tv:text-xl"><svg class="icon"><use href="#film-solid" fill="currentColor"></use></svg><span>${numberOfEpisodes} ${_s.chapter.infoPlural.video}</span></li>`
                )
                info.append(videoLabel)
            } else {
                const videoLabel = _gl.elementFromHtml(
                    `<li class="flex gap-2 items-center tv:text-xl"><svg class="icon"><use href="#film-solid" fill="currentColor"></use></svg><span>${numberOfEpisodes} ${_s.chapter.infoSingular.video}</span></li>`
                )
                info.append(videoLabel)
            }

            if (numberOfTasks != 1) {
                const taskLabel = _gl.elementFromHtml(
                    `<li class="flex gap-2 items-center tv:text-xl"><svg class="icon"><use href="#pen-to-square-solid" fill="currentColor"></use></svg></svg><span>${numberOfTasks} ${_s.chapter.infoPlural.task}</span></li>`
                )
                info.append(taskLabel)
            } else {
                const taskLabel = _gl.elementFromHtml(
                    `<li class="flex gap-2 items-center tv:text-xl"><svg class="icon"><use href="#pen-to-square-solid" fill="currentColor"></use></svg></svg><span>${numberOfTasks} ${_s.chapter.infoSingular.task}</span></li>`
                )
                info.append(taskLabel)
            }

            if (numberOfQuizes != 1) {
                const quizLabel = _gl.elementFromHtml(
                    `<li class="flex gap-2 items-center tv:text-xl"><svg class="icon"><use href="#question-solid" fill="currentColor"></use></svg><span>${numberOfQuizes} ${_s.chapter.infoPlural.quiz}</span></li>`
                )
                info.append(quizLabel)
            } else {
                const quizLabel = _gl.elementFromHtml(
                    `<li class="flex gap-2 items-center tv:text-xl"><svg class="icon"><use href="#question-solid" fill="currentColor"></use></svg><span>${numberOfQuizes} ${_s.chapter.infoSingular.quiz}</span></li>`
                )
                info.append(quizLabel)
            }
        }

        instance.experience.interface.chaptersDescription.append(details)
        instance.offline.fetchChapterAsset(chapter, 'thumbnail', instance.setChapterDescriptionBgImage)
        instance.experience.interface.chaptersList.classList.add('chapter-selected')

        instance.buttons.startChapter = details.querySelector('#start-chapter')
        instance.buttons.startChapter.addEventListener('click', instance.startChapter)

        tippy('.chapter-guide', {
            theme: 'explorers',
            content: _s.chapter.activityDescLabel,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'auto',
        })

    }

    removeDescriptionHtml() {
        instance.experience.interface.chaptersList.classList.add('chapter-selected')
        if (this.chapterSelectWrapper.querySelector('.chapter-description')) {
            this.chapterSelectWrapper.querySelector('.chapter-description').remove()
        }
    }

    chapterEventListeners() {
        this.chapterSelectWrapper.querySelectorAll('.chapter').forEach((chapter) => {
            chapter.addEventListener('click', () => {
                if (document.querySelector('.chapter-description')) {
                    document.querySelector('.chapter-description').remove()
                }

                instance.updateSelectedChapterData(chapter)
                instance.addClassToSelectedChapter(chapter)
                instance.setDescriptionHtml()

                if (isElectron() && !chapter.classList.contains('downloaded')) {
                    instance.disableStartChapterButton()
                    return
                }

                if (instance.buttons.startChapter) {
                    instance.buttons.startChapter.disabled = false
                    instance.buttons.startChapter.tippy?.destroy()
                }
            })
        })

        this.chapterSelectWrapper.querySelectorAll('.chapter__download').forEach(function (chapter) {
            chapter.addEventListener('click', (event) => {
                instance.downloadChapter(chapter)
                event.stopPropagation()
            })
        })

        this.chapterSelectWrapper.querySelectorAll('.chapter__remove').forEach(function (chapter) {
            chapter.addEventListener('click', (event) => {
                instance.removeDownload(chapter)
                event.stopPropagation()
            })
        })
    }

    disableStartChapterButton() {
        if (instance.buttons.startChapter) {
            instance.buttons.startChapter.disabled = true
            instance.buttons.startChapter.tippy?.destroy()
            instance.buttons.startChapter.tippy = tippy(instance.buttons.startChapter.parentElement, {
                theme: 'explorers',
                content: _s.offline.downloadToContinue,
                maxWidth: 230,
                duration: [500, 200],
                animation: 'shift-away',
                placement: 'top',
            })
        }
    }

    setStatesTooltips() {
        tippy('.chapter__download', {
            theme: 'explorers',
            content: _s.offline.download.title,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'auto',
        })

        tippy('.chapter__remove', {
            theme: 'explorers',
            content: _s.offline.remove,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'auto',
        })

        tippy('.chapter__downloaded span', {
            theme: 'explorers',
            content: _s.offline.availableOffline.info,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'auto',
        })
    }

    setChapterBgImage(chapter) {
        const img = _gl.elementFromHtml(`<div class="chapter-image"><img src="${chapter.thumbnail}" /></div>`)
        document.querySelector(`.chapter[data-id="${chapter.id}"] .chapter-card .content`).prepend(img)
    }

    setChapterDescriptionBgImage(chapter) {
        const img = _gl.elementFromHtml(
            `<div class="chapter-description-image"><img src="${chapter.thumbnail}"/></div>`
        )
        document.querySelector('.chapter-description > .content').prepend(img)
    }

    // Download

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

    async downloadChapter(chapter) {
        if (!this.experience.auth0.isAuthenticated) return

        let chapterEl = chapter.closest('.chapter')
        const chapterId = chapterEl.getAttribute('data-id')
        const categorySlug = chapterEl.getAttribute('data-slug')
        const selectedChapter = instance.chaptersData[categorySlug]['chapters'].find((chapter) => {
            return chapter.id == chapterId
        })

        instance.cacheChapterAssets(selectedChapter)

        chapterEl.classList.remove('download', 'failed', 'outdated')
        chapterEl.classList.add('downloading')

        await instance.offline.downloadAllVideos(chapterId)
    }

    removeDownload(chapter) {
        let chapterEl = chapter.closest('.chapter')
        const chapterId = chapterEl.getAttribute('data-id')

        instance.offline.deleteChapterFromIndexedDb(chapterId)

        chapterEl.classList.remove('downloaded')

        if (isElectron()) {
            instance.disableStartChapterButton()
        }
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
            instance.cacheTaskDescriptionAudios(
                checkpoint.steps.filter((step) => step.message && step.message.audio)
            )
            instance.cacheTaskDescriptionMedia(
                checkpoint.steps.filter((step) => step.message && step.message.media)
            )
            instance.cacheTaskDescriptionWithSupportingScreensCharacterAudio(
                checkpoint.steps.filter(
                    (step) =>
                        step.message_with_supporting_screens &&
                        step.message_with_supporting_screens.character_audio
                )
            )
            instance.cacheTaskDescriptionWithSupportingScreensRightScreen(
                checkpoint.steps.filter(
                    (step) =>
                        step.message_with_supporting_screens &&
                        step.message_with_supporting_screens.right_screen
                )
            )
            instance.cacheSortingGameIcons(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'sorting'
                )
            )
            instance.cachePictureAndCodeImage(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'picture_and_code'
                )
            )
            instance.cacheDialogueAudios(
                checkpoint.steps.filter(
                    (step) =>
                        step.details && step.details.step_type == 'task' && step.details.task_type == 'dialog'
                )
            )
            instance.cacheGameDescriptionTutorials(
                checkpoint.steps.filter((step) => step.details && step.details.tutorial)
            )
            instance.cacheFlipCardsMedia(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'flip_cards'
                )
            )
            instance.cacheChooseNewKingMedia(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'choose_new_king'
                )
            )
            instance.cacheDavidsRefugeImages(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'davids_refuge'
                )
            )
            instance.cacheMultipleChoiceWithPicture(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'multiple_choice_with_picture'
                )
            )
            instance.cacheConfirmationScreenImages(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'confirmation_screen'
                )
            )
            instance.cacheTaskDescriptionScreenImages(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'task_description_screen'
                )
            )
            instance.cacheTaskDescriptionWithCalculatorScreenImages(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'calculator_screen'
                )
            )
            instance.cacheSingleChoiceMedia(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'single_choice'
                )
            )
            instance.cacheTrueFalseQuizMedia(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'truefalse_quiz'
                )
            )
            instance.cacheMineFieldMedia(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'minefield'
                )
            )
            instance.cacheBibleVerseCodeMedia(
                checkpoint.steps.filter(
                    (step) =>
                        step.details &&
                        step.details.step_type == 'task' &&
                        step.details.task_type == 'bible_verse_code'
                )
            )
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

    cacheTaskDescriptionMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => instance.fetchAndCacheAsset(step.message.media))
    }

    cacheTaskDescriptionWithSupportingScreensCharacterAudio(steps) {
        if (steps.length == 0) return
        steps.forEach((step) =>
            instance.fetchAndCacheAsset(step.message_with_supporting_screens.character_audio)
        )
    }

    cacheTaskDescriptionWithSupportingScreensRightScreen(steps) {
        if (steps.length == 0) return
        steps.forEach((step) =>
            instance.fetchAndCacheAsset(step.message_with_supporting_screens.right_screen)
        )
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

    cacheTaskDescriptionScreenImages(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            instance.fetchAndCacheAsset(step.task_description_screen.td_image)
        })
    }

    cacheTaskDescriptionWithCalculatorScreenImages(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            instance.fetchAndCacheAsset(step.calculator_screen.td_image)
        })
    }

    cacheSingleChoiceMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            step.single_choice.options.forEach((option) => instance.fetchAndCacheAsset(option.option_media))
        })
    }

    cacheTrueFalseQuizMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            step.truefalse_quiz.questions.forEach((question) => {
                instance.fetchAndCacheAsset(question.question_media)
                instance.fetchAndCacheAsset(question.question_audio)
            })
        })
    }

    cacheMineFieldMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            if (!step.minefield.questions?.length) return

            step.minefield.questions.forEach((question) => {
                instance.fetchAndCacheAsset(question.question_image)

                if (!question.answers.length) return
                question.answers.forEach((answer) => {
                    instance.fetchAndCacheAsset(answer.answer_image)
                })
            })
        })
    }

    cacheBibleVerseCodeMedia(steps) {
        if (steps.length == 0) return
        steps.forEach((step) => {
            step.bible_verse_code.book.forEach((option) => {
                instance.fetchAndCacheAsset(option.icon)
            })

            step.bible_verse_code.chapter.forEach((option) => {
                instance.fetchAndCacheAsset(option.icon)
            })

            step.bible_verse_code.verse_from.forEach((option) => {
                instance.fetchAndCacheAsset(option.icon)
            })

            step.bible_verse_code.verse_to.forEach((option) => {
                instance.fetchAndCacheAsset(option.icon)
            })
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
        if (instance.chapterProgress() == instance.selectedChapter.program.length) {
            instance.resetChapter()
        }

        instance.experience.setAppView('chapter')

        instance.setUpChapter()
        instance.fetchBgMusic()
        instance.fetchArchiveImage()

        const appVersion = document.getElementById('app-version').innerText

        _appInsights.trackEvent({
            name: 'Start chapter',
            properties: {
                chapterId: instance.selectedChapter.id,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality,
                device: isElectron() ? 'App' : 'Web',
                login: instance.experience.auth0?.isAuthenticated ? 'Login' : 'Non-Login',
                appVersion: appVersion ? appVersion : 'Web',
            },
        })

        plausible('Start chapter', {
            props: {
                chapterId: instance.selectedChapter.id,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality,
                device: isElectron() ? 'App' : 'Web',
                login: instance.experience.auth0?.isAuthenticated ? 'Login' : 'Non-Login',
                appVersion: appVersion ? appVersion : 'Web',
            },
        })

        if (!document.fullscreenElement) {
            // document.documentElement.requestFullscreen()
        }
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

    setDownloadModalHTML() {
        instance.downloadModal = _gl.elementFromHtml(`
        <dialog id="download-modal" class="modal">
            <div class="modal-container">
                <h2 class="modal-heading">${_s.offline.downloadApp.title}</h2>
                <p class="text-center">${_s.offline.downloadApp.deviceTypeLabel}</p>
                <div class="device-type-available flex items-center justify-center gap-[1%] w-full mb-[5%]"></div>
                <p>${_s.offline.downloadApp.infoLabel}</p>
                <ul>
                    <li>${_s.offline.downloadApp.infoText1}</li>
                    <li>${_s.offline.downloadApp.infoText2}</li>
                </ul>
                <div class="modal-actions">
                    <button class="modal-close">${_s.offline.downloadApp.close}</button>
                </div>
            </div>
        </dialog>`)

        document.querySelector('#app').append(instance.downloadModal)

        instance.closeDownloadModal()
        instance.setLinksToDownloadModal()
    }

    setLinksToDownloadModal() {
        fetch(_api.getAppDownloadLinks()).then(function (response) {
            response.json().then(function (apiData) {
                const ul = instance.downloadModal.querySelector('.device-type-available')

                ul.appendChild(
                    _gl.elementFromHtml(`
                        <a class="button button-rectangle-wide" href="${apiData['windows']['exe']}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><path fill="#ffffff" d="m0 12.402 35.687-4.86.016 34.423-35.67.203zm35.67 33.529.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349-.011 41.34-47.318-6.678-.066-34.739z"/></svg>
                            <span>Windows</span>
                        </a>`)
                )
                ul.appendChild(
                    _gl.elementFromHtml(`
                        <a class="button button-rectangle-wide" href="${apiData['mac']['x64']}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 842.32 1000"><path fill="#ffffff" d="M824.666 779.304c-15.123 34.937-33.023 67.096-53.763 96.663-28.271 40.308-51.419 68.208-69.258 83.702-27.653 25.43-57.282 38.455-89.01 39.196-22.776 0-50.245-6.481-82.219-19.63-32.08-13.085-61.56-19.566-88.516-19.566-28.27 0-58.59 6.48-91.022 19.567-32.48 13.148-58.646 20-78.652 20.678-30.425 1.296-60.75-12.098-91.022-40.245-19.32-16.852-43.486-45.74-72.436-86.665-31.06-43.702-56.597-94.38-76.602-152.155C10.74 658.443 0 598.013 0 539.509c0-67.017 14.481-124.818 43.486-173.255 22.796-38.906 53.122-69.596 91.078-92.126 37.955-22.53 78.967-34.012 123.132-34.746 24.166 0 55.856 7.475 95.238 22.166 39.27 14.74 64.485 22.215 75.54 22.215 8.266 0 36.277-8.74 83.764-26.166 44.906-16.16 82.806-22.85 113.854-20.215 84.133 6.79 147.341 39.955 189.377 99.707-75.245 45.59-112.466 109.447-111.725 191.364.68 63.807 23.827 116.904 69.319 159.063 20.617 19.568 43.64 34.69 69.257 45.431-5.555 16.11-11.42 31.542-17.654 46.357zM631.71 20.006c0 50.011-18.27 96.707-54.69 139.928-43.949 51.38-97.108 81.071-154.754 76.386-.735-6-1.16-12.314-1.16-18.95 0-48.01 20.9-99.392 58.016-141.403 18.53-21.271 42.098-38.957 70.677-53.066C578.316 9.002 605.29 1.316 630.66 0c.74 6.686 1.05 13.372 1.05 20.005z"/></svg>
                            <div>Intel-based Mac</div>
                        </a>`)
                )
                ul.appendChild(
                    _gl.elementFromHtml(`
                        <a class="button button-rectangle-wide" href="${apiData['mac']['arm64']}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 842.32 1000"><path fill="#ffffff" d="M824.666 779.304c-15.123 34.937-33.023 67.096-53.763 96.663-28.271 40.308-51.419 68.208-69.258 83.702-27.653 25.43-57.282 38.455-89.01 39.196-22.776 0-50.245-6.481-82.219-19.63-32.08-13.085-61.56-19.566-88.516-19.566-28.27 0-58.59 6.48-91.022 19.567-32.48 13.148-58.646 20-78.652 20.678-30.425 1.296-60.75-12.098-91.022-40.245-19.32-16.852-43.486-45.74-72.436-86.665-31.06-43.702-56.597-94.38-76.602-152.155C10.74 658.443 0 598.013 0 539.509c0-67.017 14.481-124.818 43.486-173.255 22.796-38.906 53.122-69.596 91.078-92.126 37.955-22.53 78.967-34.012 123.132-34.746 24.166 0 55.856 7.475 95.238 22.166 39.27 14.74 64.485 22.215 75.54 22.215 8.266 0 36.277-8.74 83.764-26.166 44.906-16.16 82.806-22.85 113.854-20.215 84.133 6.79 147.341 39.955 189.377 99.707-75.245 45.59-112.466 109.447-111.725 191.364.68 63.807 23.827 116.904 69.319 159.063 20.617 19.568 43.64 34.69 69.257 45.431-5.555 16.11-11.42 31.542-17.654 46.357zM631.71 20.006c0 50.011-18.27 96.707-54.69 139.928-43.949 51.38-97.108 81.071-154.754 76.386-.735-6-1.16-12.314-1.16-18.95 0-48.01 20.9-99.392 58.016-141.403 18.53-21.271 42.098-38.957 70.677-53.066C578.316 9.002 605.29 1.316 630.66 0c.74 6.686 1.05 13.372 1.05 20.005z"/></svg> 
                            <span>Mac with Apple silicon</span>
                        </a>`)
                )
            })
        })
    }

    // Popup

    openDownloadModal() {
        instance.downloadModal.showModal()

        _appInsights.trackEvent({
            name: 'Download app',
            properties: {
                language: _lang.getLanguageCode(),
            },
        })

        plausible('Download app', {
            props: {
                language: _lang.getLanguageCode(),
            },
        })
    }

    closeDownloadModal() {
        const closeModal = instance.downloadModal.querySelector('.modal-close')

        closeModal.addEventListener('click', () => {
            instance.downloadModal.close()
        })
    }

    goHome() {
        document.body.classList.add('freeze')
        instance.experience.navigation.prev.disabled = false

        if (instance.program) {
            instance.program.destroy()
            instance.program.video.defocus()
        }

        instance.controlRoom.irisTextureTransition()
        instance.audio.stopAllTaskDescriptions()
        instance.audio.changeBgMusic()

        instance.showLobby()
        instance.preselectChapter()

        document.querySelector('.page-title')?.remove()

        if (instance.program.archive) instance.program.archive.remove()
        if (instance.program.pause) instance.program.pause.destroy()
        if (instance.program.congrats) instance.program.congrats.destroy()

        instance.resources.videoPlayers = []

        if (document.fullscreenElement) {
            document.exitFullscreen()
        }

        document.dispatchEvent(_e.EVENTS.GO_HOME)
    }

    preselectChapter() {
        // ToDo: Find another solution to select the chapter
        // once checking if the chapter is downloaded is done
        setTimeout(() => {
            document.querySelector(".chapter[data-id='" + instance.selectedChapter.id + "']").click()
        }, 1000)
    }

    finishJourney() {
        _appInsights.trackEvent({
            name: 'Finish chapter',
            properties: {
                title: instance.selectedChapter.title,
                category: instance.selectedChapter.category,
                language: _lang.getLanguageCode(),
                quality: instance.selectedQuality,
            },
        })

        plausible('Finish chapter', {
            props: {
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
