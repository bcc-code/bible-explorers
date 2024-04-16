import Experience from '../Experience.js'
import _appInsights from './AppInsights.js'
import _lang from './Lang.js'

let offline = null

export default class Offline {
    constructor() {
        if (offline) return offline

        this.experience = new Experience()
        offline = this

        offline.isOnline = false

        offline.allDownloadableVideos = []
        offline.textureVideos = (chapterId) => offline.allDownloadableVideos[chapterId].filter((v) => v.type == 'texture')
        offline.episodeVideos = (chapterId) => offline.allDownloadableVideos[chapterId].filter((v) => v.type == 'episode')

        offline.downloaded = []
        offline.downloadedTextureVideos = (chapterId) => offline.downloaded[chapterId].filter((v) => v.name.includes('texture'))
        offline.downloadedEpisodeVideos = (chapterId) => offline.downloaded[chapterId].filter((v) => v.name.includes('episode'))

        offline.sizeDownloaded = (chapterId) => offline.downloaded[chapterId].reduce((acc, v) => acc + v.size, 0)
        offline.sizeToBeDownloaded = (chapterId) => offline.allDownloadableVideos[chapterId].reduce((acc, v) => acc + v.data.size, 0)

        if ('indexedDB' in window) {
            this.initialize()
            this.setUpDbConnection()
        } else {
            console.log("This browser doesn't support IndexedDB")
            return
        }

        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persistent) => {
                let quota = 0
                let usage = 0
                let message = ''

                message = persistent == true ? 'Storage will NOT be cleared except by explicit user action.' : 'Storage may be cleared by the UA under storage pressure.'

                navigator.storage.estimate().then((estimate) => {
                    quota = formatBytes(estimate.quota)
                    usage = formatBytes(estimate.usage)

                    _appInsights.trackEvent({
                        name: 'Offline initialized',
                        properties: {
                            message: message,
                            quota: quota,
                            usage: usage,
                        },
                    })
                })
            })
        }
    }

    initialize = function () {
        offline.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB
        offline.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction
        offline.dbVersion = 3
        offline.store = 'chaptersData'
        offline.db = null
        offline.transaction = null
        offline.objStore = null
        offline.request = null
    }

    createOrUpdateObjectStore = function (database) {
        // console.log("createOrUpdateObjectStore")

        if (database.objectStoreNames.contains(offline.store)) {
            database.deleteObjectStore(offline.store)
        }

        offline.objStore = database.createObjectStore(offline.store)
    }

    setUpDbConnection = function () {
        if (!offline.request) offline.request = offline.indexedDB.open('Bible Kids Explorers', offline.dbVersion)

        offline.request.onerror = function () {
            // console.log("Error creating/accessing IndexedDB database")
        }

        offline.request.onsuccess = function () {
            // console.log("Success creating/accessing IndexedDB database")
            offline.db = offline.request.result

            offline.db.onerror = function () {
                // console.log("Error creating/accessing IndexedDB database")
            }
        }

        offline.request.onupgradeneeded = function (event) {
            offline.createOrUpdateObjectStore(event.target.result)
        }
    }

    markChapterIfAvailableOffline = async function (chapter) {
        await offline.setChapterDownloadableVideos(chapter)

        offline.getDownloadedVideos(offline.allDownloadableVideos[chapter.id], async (downloadedEpisodes) => {
            offline.downloaded[chapter.id] = downloadedEpisodes

            const selectedChapter = document.querySelector('.chapter[data-id="' + chapter.id + '"]')

            if (downloadedEpisodes.length != chapter.episodes.length + offline.textureVideos(chapter.id).length) {
                selectedChapter.classList.add('loaded')
                return
            }

            const latestVersion = await offline.checkAllVideosHaveLatestVersion(chapter.id, downloadedEpisodes)

            selectedChapter.classList.add(latestVersion ? 'downloaded' : 'outdated')
            selectedChapter.classList.add('loaded')
        })
    }

    async setChapterDownloadableVideos(chapter) {
        const episodes = chapter.episodes.map((e) => ({ type: e.type, id: e.id }))
        const textures = offline.getTextureIdsForChapter(chapter).map((textureId) => ({ type: 'texture', id: textureId }))

        offline.allDownloadableVideos[chapter.id] = episodes.concat(textures)

        let promises = offline.allDownloadableVideos[chapter.id].map(async (video) => {
            video.data = await offline.getVideoDataForDesiredQuality(video, chapter.id)
        })

        await Promise.all(promises)
    }

    async downloadAllVideos(chapterId) {
        if (offline.allDownloadableVideos[chapterId].length == offline.downloaded[chapterId].length) {
            // The user wants to redownload the chapter
            offline.downloaded[chapterId] = []
        }

        // Download or continue interrupted download

        await offline.downloadScreenTextureFromChapter(chapterId)
        await offline.downloadEpisodesFromChapter(chapterId)
    }

    downloadScreenTextureFromChapter = async function (chapterId) {
        let notDownloadedTextures = offline.getNotDownloadedTextures(chapterId)

        if (notDownloadedTextures.length > 0) {
            offline.downloadScreenTexture(chapterId, notDownloadedTextures[0].data)
        }
    }

    getNotDownloadedTextures = function (chapterId) {
        return offline.textureVideos(chapterId).filter((episode) => {
            return !offline.downloaded[chapterId].some((downloadedTexture) => {
                return episode.data.name === downloadedTexture.name
            })
        })
    }

    downloadScreenTexture = function (chapterId, texture) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'

        if (!texture.url) {
            console.log('Texture ' + texture.id + ' is not downloadable!')
        }

        xhr.open('GET', texture.url, true)
        xhr.timeout = 86400000 // 24 hours
        xhr.addEventListener('error', () => {
            console.log('Texture ' + texture.id + ' failed to download!')
        })
        xhr.addEventListener(
            'load',
            () => {
                offline.onScreenTextureDownloadComplete(chapterId, texture, xhr)
            },
            false
        )
        xhr.send()
    }

    onScreenTextureDownloadComplete = async function (chapterId, texture, xhr) {
        if (xhr.status === 200) {
            texture.video = xhr.response
            offline.putFileInDb(texture)

            offline.downloaded[chapterId].push(texture)

            if (offline.downloadedTextureVideos(chapterId).length < offline.textureVideos(chapterId).length) {
                // Next texture to download
                offline.downloadScreenTextureFromChapter(chapterId)
            }
        }
    }

    downloadEpisodesFromChapter = async function (chapterId) {
        let notDownloadedEpisodes = offline.getNotDownloadedEpisodes(chapterId)

        if (notDownloadedEpisodes.length > 0) {
            offline.downloadEpisode(chapterId, notDownloadedEpisodes[0].data)
        }
    }

    getNotDownloadedEpisodes = function (chapterId) {
        return offline.episodeVideos(chapterId).filter((episode) => {
            return !offline.downloaded[chapterId].some((downloadedEpisode) => {
                return episode.data.name === downloadedEpisode.name
            })
        })
    }

    getVideoDataForDesiredQuality = async function (video, chapterId) {
        const locale = offline.getBtvSupportedLanguageCode()
        let episode = {}
        let allLanguagesVideos = []

        try {
            const episodeData = await offline.fetchEpisodeData(video.id)
            episode = episodeData.episode
            allLanguagesVideos = episode.files
        } catch (e) {
            offline.setErrorMessage(chapterId)
        }
        const myLanguageVideos = allLanguagesVideos.filter((file) => {
            return file.audioLanguage == locale
        })

        if (!myLanguageVideos.length) {
            return
        }

        const selectedQualityVideo = Object.assign(offline.getSelectedQualityVideo(myLanguageVideos), {
            version: episode.assetVersion,
            language: _lang.getLanguageCode(),
            name: `${video.type}-${video.id}`,
            quality: offline.experience.settings.videoQuality,
        })

        return selectedQualityVideo
    }

    fetchEpisodeData = async function (episodeId) {
        const response = await fetch('https://api.brunstad.tv/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `query {
                    episode(id: "${episodeId}") {
                        id
                        assetVersion
                        files {
                            id
                            audioLanguage
                            size
                            resolution
                            url
                            fileName
                        }
                    }
                }`,
            }),
        })

        const episode = await response.json()
        return episode.data
    }

    checkAllVideosHaveLatestVersion = async function (chapterId, downloadedEpisodes) {
        let staleEpisodes = []

        downloadedEpisodes.forEach(async (downloadedEpisode) => {
            const episodeId = downloadedEpisode.name.replace('episode-', '').replace('texture-', '')
            const episodeData = offline.allDownloadableVideos[chapterId].find((v) => v.id == episodeId)

            if (downloadedEpisode.version != episodeData.data.version) {
                staleEpisodes.push(downloadedEpisode)
            }
        })

        return staleEpisodes.length == 0
    }

    getTextureIdsForChapter = function (chapter) {
        const textureVideos = []

        if (chapter.lobby_video_loop) {
            textureVideos.push(chapter.lobby_video_loop)
        }

        chapter.program.forEach((checkpoint) => {
            checkpoint.steps.forEach((step) => {
                if (step.details.step_type == 'iris' && step.message.video) {
                    textureVideos.push(step.message.video)
                }

                if (step.details.step_type == 'iris_with_supporting_screens' && step.message_with_supporting_screens.video) {
                    textureVideos.push(step.message_with_supporting_screens.video)
                }

                if (step.details.step_type == 'task' && step.details.task_type == 'video_with_question' && step.video_with_question.video) {
                    textureVideos.push(step.video_with_question.video)
                }
            })
        })

        return textureVideos
    }

    getSelectedQualityVideo = function (arr) {
        switch (this.experience.settings.videoQuality) {
            case 'low':
                return arr.find((video) => video.resolution == '320x180')

            case 'medium':
                return arr.find((video) => video.resolution == '960x540')

            case 'high':
                return arr.find((video) => video.resolution == '1920x1080')
        }
    }

    getBtvSupportedLanguageCode() {
        let locale = _lang.getLanguageCode()
        return 'pt-pt' == locale ? 'pt' : locale // BTV and WPML have different language codes
    }

    downloadEpisode = function (chapterId, currentEpisode) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'

        xhr.open('GET', currentEpisode.url, true)
        xhr.timeout = 86400000 // 24 hours
        xhr.addEventListener('progress', (event) => {
            offline.onVideoDownloadProgress(chapterId, event)
        })
        xhr.addEventListener('timeout', () => {
            offline.onRequestTimeout(chapterId)
        })
        xhr.addEventListener('error', () => {
            offline.onRequestError(chapterId)
        })
        xhr.addEventListener(
            'load',
            () => {
                offline.onEpisodeDownloadComplete(chapterId, currentEpisode, xhr)
            },
            false
        )
        xhr.send()
    }

    onVideoDownloadProgress = function (chapterId, e) {
        if (e.lengthComputable) {
            var percentage = ((offline.sizeDownloaded(chapterId) + e.loaded) * 100) / offline.sizeToBeDownloaded(chapterId)
            let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')

            if (chapterEl) {
                chapterEl.classList.add('downloading')
                chapterEl.querySelector('.downloading-label').innerText = parseFloat(percentage).toFixed() + '%'
                chapterEl.querySelector('.progress-line').style.transform = `scaleX(${percentage / 100})`
                chapterEl.querySelector('.chapter__downloaded-quota').innerText = `${formatBytes(offline.sizeDownloaded(chapterId) + e.loaded, 2)} / ${formatBytes(offline.sizeToBeDownloaded(chapterId), 2)}`
            }
        }
    }

    onRequestTimeout = function (chapterId) {
        console.log('Timeout exceeded!')
        offline.setErrorMessage(chapterId)
    }

    onRequestError = function (chapterId) {
        console.log('Unknown error!')
        offline.setErrorMessage(chapterId)
    }

    setErrorMessage = function (chapterId) {
        let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')
        if (chapterEl) {
            chapterEl.classList.remove('downloading')
            chapterEl.classList.add('failed')
            // chapterEl.querySelector('span.title').innerText = 'Error!'
        }
    }

    onEpisodeDownloadComplete = async function (chapterId, currentEpisode, xhr) {
        if (xhr.status === 200) {
            currentEpisode.video = xhr.response
            offline.putFileInDb(currentEpisode)

            offline.downloaded[chapterId].push(currentEpisode)

            if (offline.episodeVideos(chapterId).length == offline.downloadedEpisodeVideos(chapterId).length) {
                // All episodes downloaded
                let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')
                chapterEl.classList.remove('downloading')
                chapterEl.classList.add('downloaded')

                // Make start chapter button available & remove tooltip
                const startChapter = document.querySelector('#start-chapter')
                startChapter.disabled = false
                offline.experience.world.buttons.startChapter.tippy?.destroy()

                _appInsights.trackEvent({
                    name: 'Chapter downloaded',
                    properties: {
                        language: currentEpisode.language,
                        quality: currentEpisode.quality,
                    },
                })
            } else {
                // Next episode to download
                await offline.downloadEpisodesFromChapter(chapterId)
            }
        }
    }

    putFileInDb = function (data) {
        offline.transaction = offline.db.transaction([offline.store], 'readwrite')
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.objStore.put(data, data.name)
    }

    deleteChapterFromIndexedDb = function (chapterId) {
        offline.transaction = offline.db.transaction([offline.store], 'readwrite')
        offline.objStore = offline.transaction.objectStore(offline.store)

        offline.downloaded[chapterId].forEach((video) => {
            offline.objStore.delete(video.name)
        })
    }

    loadVideoFromIndexedDb = function (videoName, callback, fallback) {
        if (!offline.db) {
            fallback(videoName)
            return
        }

        offline.transaction = offline.db.transaction([offline.store], 'readonly')
        offline.objStore = offline.transaction.objectStore(offline.store)
        const getItem = offline.objStore.get(videoName)

        getItem.onsuccess = function () {
            if (getItem.result && getItem.result.language == _lang.getLanguageCode()) {
                const item = getItem.result

                // Load video blob as array buffer
                var r = new FileReader()

                r.onload = function (e) {
                    const blob = offline.getArrayBufferBlob(e)
                    const videoUrl = URL.createObjectURL(blob)

                    callback(videoName, videoUrl)
                }

                r.readAsArrayBuffer(item.video)
            } else {
                fallback(videoName)
            }
        }
    }

    loadScreenTextureFromIndexedDb = function (videoName, firstCase, secondCase, callback) {
        if (!offline.db) {
            secondCase(videoName, callback)
            return
        }

        offline.transaction = offline.db.transaction([offline.store], 'readonly')
        offline.objStore = offline.transaction.objectStore(offline.store)
        const getItem = offline.objStore.get(videoName)

        getItem.onsuccess = function () {
            if (getItem.result && getItem.result.language == _lang.getLanguageCode()) {
                const item = getItem.result

                // Load video blob as array buffer
                var r = new FileReader()

                r.onload = function (e) {
                    const blob = offline.getArrayBufferBlob(e)
                    const videoUrl = URL.createObjectURL(blob)

                    firstCase(videoName, videoUrl, callback)
                }

                r.readAsArrayBuffer(item.video)
            } else {
                secondCase(videoName, callback)
            }
        }
    }

    getArrayBufferBlob(e) {
        const contents = e.target.result
        const uint8Array = new Uint8Array(contents)
        const arrayBuffer = uint8Array.buffer
        return new Blob([arrayBuffer])
    }

    getDownloadedVideos = function (episodes, callback = () => {}) {
        if (!offline.db) return
        offline.transaction = offline.db.transaction([offline.store], 'readonly')
        offline.objStore = offline.transaction.objectStore(offline.store)

        let downloadedEpisodes = []

        episodes.forEach((episode, index) => {
            var getItem = offline.objStore.get(episode.type + '-' + episode.id)

            getItem.onsuccess = function () {
                if (getItem.result && getItem.result.language == _lang.getLanguageCode()) {
                    downloadedEpisodes.push(getItem.result)
                }

                if (index + 1 == episodes.length) {
                    callback(downloadedEpisodes)
                }
            }
        })
    }

    fetchChapterAsset(data, param, callback) {
        if (!data[param]) return

        caches.open('chaptersAssets').then((cache) => {
            cache.match(data[param]).then((response) => {
                if (response) {
                    response.blob().then((blob) => {
                        const url = URL.createObjectURL(blob)
                        const newData = Object.assign({}, data)
                        newData[param] = url

                        callback(newData)
                    })
                } else {
                    callback(data)
                }
            })
        })
    }

    setConnection(mode) {
        offline.isOnline = mode
    }
}

function formatBytes(bytes, decimals = 0) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
