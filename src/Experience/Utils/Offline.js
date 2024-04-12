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
        offline.data = []
        offline.downloaded = []

        offline.btvVideos = []
        offline.downloadedTextures = []

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

    downloadEpisodes(chapterId, episodes) {
        let episodesData = []

        episodes.forEach((episode) => {
            if (episodesData.map((e) => e.id).includes(episode.id)) return

            episodesData.push({
                id: episode.id,
                data: {
                    name: episode.type + '-' + episode.id,
                    language: _lang.getLanguageCode(),
                    quality: this.experience.settings.videoQuality,
                },
            })
        })

        offline.downloadFromWeb(chapterId, episodesData)
    }

    downloadFromWeb = function (chapterId, episodes) {
        offline.getDownloadedEpisodes(
            episodes.map((e) => e.data.name),
            async (downloadedEpisodes) => {
                offline.data[chapterId] = episodes

                if (episodes.length == downloadedEpisodes.length) {
                    // The user wants to redownload the chapter
                    offline.downloaded[chapterId] = []
                } else {
                    // Continue interrupted download
                    offline.downloaded[chapterId] = downloadedEpisodes
                }

                await offline.downloadEpisodesFromChapter(chapterId)
            }
        )
    }

    downloadEpisodesFromChapter = async function (chapterId) {
        let notDownloadedEpisodes = offline.getNotDownloadedEpisodes(offline.data[chapterId], offline.downloaded[chapterId])
        const episodeUrls = await offline.getEpisodeDownloadUrls(notDownloadedEpisodes[0].id, chapterId)

        if (episodeUrls) {
            notDownloadedEpisodes[0].downloadUrl = episodeUrls.downloadUrl
            notDownloadedEpisodes[0].data.thumbnail = episodeUrls.thumbnail
            notDownloadedEpisodes[0].data.version = episodeUrls.version

            offline.startDownloading(chapterId, notDownloadedEpisodes[0])
        }
    }

    getNotDownloadedEpisodes = function (allEpisodes, downloadedEpisodes) {
        return allEpisodes.filter((episode) => {
            return !downloadedEpisodes.some((downloadedEpisodeName) => {
                return episode.data.name === downloadedEpisodeName
            })
        })
    }

    getEpisodeDownloadUrls = async function (episodeId, chapterId) {
        let locale = _lang.getLanguageCode()
        locale = 'pt-pt' == locale ? 'pt' : locale // BTV and WPML have different language codes

        let episode = {}
        let allLanguagesVideos = []

        try {
            episode = (await offline.getEpisodeData(episodeId)).episode
            allLanguagesVideos = episode.files
        } catch (e) {
            offline.setErrorMessage(chapterId)
        }
        const myLanguageVideos = allLanguagesVideos.filter((file) => {
            return file.audioLanguage == locale
        })

        if (!myLanguageVideos.length) {
            _appInsights.trackException({
                exception: 'No videos found',
                chapterId: chapterId,
                episodeId: episodeId,
                language: locale,
            })

            // There was a problem downloading the episode
            const chapter = document.querySelector('.chapter[data-id="' + chapterId + '"]')
            chapter.classList.remove('downloading')
            chapter.classList.add('failed')

            return
        }

        const selectedQualityVideo = offline.getSelectedQualityVideo(myLanguageVideos)

        return {
            downloadUrl: selectedQualityVideo.url,
            thumbnail: episode.image,
            version: episode.assetVersion,
        }
    }

    downloadScreenTextures = async function (chapter) {
        if (chapter.lobby_video_loop) {
            offline.btvVideos.push(chapter.lobby_video_loop)
        }

        chapter.program.forEach((checkpoint) => {
            checkpoint.steps.forEach((step) => {
                if (step.details.step_type == 'iris' && step.message.video) {
                    offline.btvVideos.push(step.message.video)
                }

                if (step.details.step_type == 'iris_with_supporting_screens' && step.message_with_supporting_screens.video) {
                    offline.btvVideos.push(step.message_with_supporting_screens.video)
                }

                if (step.details.step_type == 'task' && step.details.task_type == 'video_with_question' && step.video_with_question.video) {
                    offline.btvVideos.push(step.video_with_question.video)
                }
            })
        })

        if (!offline.btvVideos.length) return

        // Start downloading textures
        offline.startTextureDownload(0)
    }

    downloadScreenTexture = function (videoName, texture) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'

        if (!texture.url) {
            console.log('Texture ' + videoName + ' is not downloadable!')
        }

        xhr.open('GET', texture.url, true)
        xhr.timeout = 86400000 // 24 hours
        xhr.addEventListener('error', () => {
            console.log('Texture ' + videoName + ' failed to download!')
        })
        xhr.addEventListener(
            'load',
            () => {
                offline.onScreenTextureDownloadComplete(videoName, texture, xhr)
            },
            false
        )
        xhr.send()
    }

    onScreenTextureDownloadComplete = async function (videoName, texture, xhr) {
        if (xhr.status === 200) {
            const textureData = {
                language: texture.audioLanguage,
                name: 'texture-' + videoName,
                quality: this.experience.settings.videoQuality,
                version: texture.version,
                video: xhr.response,
            }

            offline.putFileInDb(textureData)
            offline.downloadedTextures.push(textureData.name)

            if (offline.downloadedTextures.length < offline.btvVideos.length) {
                // Next texture to download
                offline.startTextureDownload(offline.downloadedTextures.length)
            }
        }
    }

    startTextureDownload = async function (index) {
        const textureUrls = await offline.getTextureDownloadUrls(offline.btvVideos[index])
        offline.downloadScreenTexture(offline.btvVideos[index], textureUrls)
    }

    getTextureDownloadUrls = async function (episodeId) {
        let locale = _lang.getLanguageCode()
        locale = 'pt-pt' == locale ? 'pt' : locale // BTV and WPML have different language codes

        let episode = (await offline.getEpisodeData(episodeId)).episode
        let allLanguagesVideos = episode.files

        const myLanguageVideos = allLanguagesVideos.filter((file) => {
            return file.audioLanguage == locale
        })
        if (!myLanguageVideos.length) return

        const selectedQualityVideo = offline.getSelectedQualityVideo(myLanguageVideos)
        selectedQualityVideo.version = episode.assetVersion

        return selectedQualityVideo
    }

    getEpisodeData = async function (episodeId) {
        const response = await fetch('https://api.brunstad.tv/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `query {
                    episode(id: "${episodeId}") {
                        id
                        image
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

    startDownloading = function (chapterId, currentEpisode) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.open('GET', currentEpisode.data.thumbnail, true)
        xhr.addEventListener(
            'load',
            () => {
                offline.onThumbnailDownloadComplete(chapterId, currentEpisode, xhr)
            },
            false
        )
        xhr.send()
    }

    onThumbnailDownloadComplete = function (chapterId, currentEpisode, xhr) {
        if (xhr.status === 200) {
            currentEpisode.data.thumbnail = xhr.response
            offline.downloadVideo(chapterId, currentEpisode)
        }
    }

    downloadVideo = function (chapterId, currentEpisode) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.open('GET', currentEpisode.downloadUrl, true)
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
                offline.onVideoDownloadComplete(chapterId, currentEpisode, xhr)
            },
            false
        )
        xhr.send()
    }

    onVideoDownloadProgress = function (chapterId, e) {
        if (e.lengthComputable) {
            var percentage = (offline.downloaded[chapterId].length * 100 + (e.loaded / e.total) * 100) / offline.data[chapterId].length

            let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')
            if (chapterEl) {
                chapterEl.classList.add('downloading')
                chapterEl.querySelector('.downloading-label').innerText = parseFloat(percentage).toFixed() + '%'
                chapterEl.querySelector('.progress-line').style.transform = `scaleX(${percentage / 100})`
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

    onVideoDownloadComplete = async function (chapterId, currentEpisode, xhr) {
        if (xhr.status === 200) {
            currentEpisode.data.video = xhr.response
            offline.putFileInDb(currentEpisode.data)

            offline.downloaded[chapterId].push(currentEpisode.data.name)

            if (offline.data[chapterId].length == offline.downloaded[chapterId].length) {
                let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')
                chapterEl.classList.remove('downloading')
                chapterEl.classList.add('downloaded')

                // Make start chapter button available & remove tooltip
                const startChapter = document.querySelector('#start-chapter')
                startChapter.disabled = false
                offline.experience.world.buttons.startChapter.tippy.destroy()

                _appInsights.trackEvent({
                    name: 'Chapter downloaded',
                    properties: {
                        language: currentEpisode.data.language,
                        quality: currentEpisode.data.quality,
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

    deleteEpisodeFromDb = function (videoName) {
        offline.transaction = offline.db.transaction([offline.store], 'readwrite')
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.objStore.delete(videoName)
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

    markChapterIfAvailableOffline = function (chapter) {
        offline.getDownloadedEpisodes(
            chapter.episodes.map((e) => e.type + '-' + e.id),
            (downloadedEpisodes) => {
                if (downloadedEpisodes.length == chapter.episodes.length) {
                    document.querySelector('.chapter[data-id="' + chapter.id + '"]').classList.add('downloaded')
                }
            }
        )
    }

    getDownloadedEpisodes = function (episodes, callback = () => {}) {
        if (!offline.db) return
        offline.transaction = offline.db.transaction([offline.store], 'readonly')
        offline.objStore = offline.transaction.objectStore(offline.store)

        let downloadedEpisodes = []

        episodes.forEach((id, index) => {
            var getItem = offline.objStore.get(id)

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
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
