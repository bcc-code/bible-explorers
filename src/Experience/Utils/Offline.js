import Experience from '../Experience.js'
import _appInsights from '../Utils/AppInsights.js'
import _lang from '../Utils/Lang.js'

let offline = null

export default class Offline {
    constructor() {
        if (offline)
            return offline

        this.experience = new Experience()
        offline = this

        offline.isOnline = false
        offline.data = []
        offline.downloaded = []

        if ("indexedDB" in window) {
            this.initialize()
            this.setUpDbConnection()
        }
        else {
            console.log("This browser doesn't support IndexedDB")
            return
        }

        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persistent) => {
                let quota = 0
                let usage = 0
                let message = ""

                message = persistent == true
                    ? "Storage will NOT be cleared except by explicit user action."
                    : "Storage may be cleared by the UA under storage pressure."

                navigator.storage.estimate().then((estimate) => {
                    quota = formatBytes(estimate.quota)
                    usage = formatBytes(estimate.usage)

                    _appInsights.trackEvent({
                        name: "Offline initialized",
                        properties: {
                            message: message,
                            quota: quota,
                            usage: usage
                        }
                    })
                })
            })
        }
    }

    initialize = function () {
        offline.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB
        offline.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction
        offline.dbVersion = 3
        offline.store = "chaptersData"
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
        if (!offline.request)
            offline.request = offline.indexedDB.open("Bible Kids Explorers", offline.dbVersion)

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

        episodes.forEach(episode => {
            episodesData.push({
                id: episode.id,
                data: {
                    name: episode.type + '-' + episode.id,
                    language: _lang.getLanguageCode(),
                    quality: this.experience.settings.videoQuality
                }
            })

            if (episodesData.length == episodes.length) {
                offline.downloadFromWeb(chapterId, episodesData)
            }
        })
    }

    downloadFromWeb = function (chapterId, episodes) {
        offline.getDownloadedEpisodes(episodes.map(e => e.data.name), async (downloadedEpisodes) => {
            offline.data[chapterId] = episodes

            if (episodes.length == downloadedEpisodes.length) {
                // The user wants to redownload the chapter
                offline.downloaded[chapterId] = []
            }
            else {
                // Continue interrupted download
                offline.downloaded[chapterId] = downloadedEpisodes
            }

            await offline.downloadEpisodesFromChapter(chapterId)
        })
    }

    downloadEpisodesFromChapter = async function (chapterId) {
        let notDownloadedEpisodes = offline.getNotDownloadedEpisodes(offline.data[chapterId], offline.downloaded[chapterId])
        const episodeUrls = await offline.getEpisodeDownloadUrls(notDownloadedEpisodes[0].id, chapterId)
        if (episodeUrls) {
            notDownloadedEpisodes[0].downloadUrl = episodeUrls.downloadUrl
            notDownloadedEpisodes[0].data.thumbnail = episodeUrls.thumbnail

            offline.startDownloading(chapterId, notDownloadedEpisodes[0])
        }
    }

    getNotDownloadedEpisodes = function (allEpisodes, downloadedEpisodes) {
        return allEpisodes.filter(episode => {
            return !downloadedEpisodes.some(downloadedEpisodeName => {
                return episode.data.name === downloadedEpisodeName
            })
        })
    }

    getEpisodeDownloadUrls = async function (episodeId, chapterId) {
        const claims = await this.experience.auth0.getIdTokenClaims()
        const idToken = claims.__raw
        let locale = _lang.getLanguageCode()
        locale = 'pt-pt' == locale ? 'pt' : locale // BTV and WPML have different language codes

        var btvPlayer = BTVPlayer({
            type: 'episode',
            id: episodeId,
            locale: locale,
            access_token: idToken
        })

        let allLanguagesVideos = []
        try {
            allLanguagesVideos = await btvPlayer.api.getDownloadables('episode', episodeId)
        }
        catch (e) {
            offline.setErrorMessage(chapterId)
        }
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

        const selectedQualityVideo = offline.getSelectedQualityVideo(myLanguageVideos)
        const episode = {
            downloadUrl: await btvPlayer.api.getDownloadable('episode', episodeId, selectedQualityVideo.id),
            info: await btvPlayer.api.getEpisodeInfo('episode', episodeId)
        }

        return {
            downloadUrl: episode.downloadUrl,
            thumbnail: episode.info.image
        }
    }

    getSelectedQualityVideo = function (arr) {
        switch (this.experience.settings.videoQuality) {
            case 'low':
                return arr.reduce((prev, current) => (prev.sizeInMB < current.sizeInMB) ? prev : current)

            case 'medium':
                return median(arr)

            case 'high':
                return arr.reduce((prev, current) => (prev.sizeInMB > current.sizeInMB) ? prev : current)
        }
    }

    startDownloading = function (chapterId, currentEpisode) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = "blob"
        xhr.open("GET", currentEpisode.data.thumbnail, true)
        xhr.addEventListener("load", () => { offline.onThumbnailDownloadComplete(chapterId, currentEpisode, xhr) }, false)
        xhr.send()
    }

    onThumbnailDownloadComplete = function (chapterId, currentEpisode, xhr) {
        if (xhr.status === 200) {
            currentEpisode.data.thumbnail = xhr.response
            offline.downloadVideo(chapterId, currentEpisode)
        }
    }

    downloadVideo = function(chapterId, currentEpisode) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = "blob"
        xhr.open("GET", currentEpisode.downloadUrl, true)
        xhr.timeout = 86400000 // 24 hours
        xhr.addEventListener("progress", (event) => { offline.onVideoDownloadProgress(chapterId, event) })
        xhr.addEventListener("timeout", () => { offline.onRequestTimeout(chapterId) })
        xhr.addEventListener("error", () => { offline.onRequestError(chapterId) })
        xhr.addEventListener("load", () => { offline.onVideoDownloadComplete(chapterId, currentEpisode, xhr) }, false)
        xhr.send()
    }

    onVideoDownloadProgress = function (chapterId, e) {
        if (e.lengthComputable) {
            var percentage = (offline.downloaded[chapterId].length * 100 + (e.loaded / e.total) * 100) / offline.data[chapterId].length
            
            let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')
            if (chapterEl) {
                chapterEl.classList.add('downloading')
                chapterEl.querySelector('span.downloading-label').innerText = parseFloat(percentage).toFixed() + "%"
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
            chapterEl.querySelector('span.title').innerText = "Error!"
        }
    }

    onVideoDownloadComplete = async function (chapterId, currentEpisode, xhr) {
        if (xhr.status === 200) {
            currentEpisode.data.video = xhr.response
            offline.putFileInDb(currentEpisode.data)

            offline.downloaded[chapterId].push(currentEpisode.data.name)
            offline.experience.resources.updateBtvStreamWithDownloadedVersion(currentEpisode.data.name)

            if (offline.data[chapterId].length == offline.downloaded[chapterId].length) {
                let chapterEl = document.querySelector('.chapter[data-id="' + chapterId + '"]')
                chapterEl.classList.remove('downloading')
                chapterEl.classList.add('downloaded')

                _appInsights.trackEvent({
                    name: "Chapter downloaded",
                    properties: {
                        language: currentEpisode.data.language,
                        quality: currentEpisode.data.quality
                    }
                })
            }
            else { // Next episode to download
                await offline.downloadEpisodesFromChapter(chapterId)
            }
        }
    }

    putFileInDb = function (data) {
        offline.transaction = offline.db.transaction([offline.store], "readwrite")
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.objStore.put(data, data.name)
    }

    deleteEpisodeFromDb = function (videoName) {
        offline.transaction = offline.db.transaction([offline.store], "readwrite")
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.objStore.delete(videoName)
    }

    loadFromIndexedDb = function (videoName, callback, fallback) {
        if (!offline.db) {
            fallback(videoName)
            return
        }

        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)
        const getItem = offline.objStore.get(videoName)

        getItem.onsuccess = function () {
            if (getItem.result && getItem.result.language == _lang.getLanguageCode()) {
                const item = getItem.result
                let thumbnailUrl = null

                // Load thumbnail
                var f = new FileReader()

                f.onload = function (e) {
                    const blob = offline.getArrayBufferBlob(e)
                    thumbnailUrl = URL.createObjectURL(blob)

                    // Load video blob as array buffer
                    var r = new FileReader()

                    r.onload = function (e) {
                        const blob = offline.getArrayBufferBlob(e)
                        const videoUrl = URL.createObjectURL(blob)
                        const videoEl = document.createElement("div")
                        videoEl.setAttribute('id', videoName)
                        document.getElementById('videos-container').appendChild(videoEl)

                        callback(videoName, videoUrl, thumbnailUrl)
                    }

                    r.readAsArrayBuffer(item.video)
                }

                f.readAsArrayBuffer(item.thumbnail)
            }
            else {
                fallback(videoName)
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
        offline.getDownloadedEpisodes(chapter.episodes.map(e => e.type + "-" + e.id), (downloadedEpisodes) => {
            if (downloadedEpisodes.length == chapter.episodes.length) {
                document.querySelector('.chapter[data-id="' + chapter.id + '"]').classList.add('downloaded')
            }
        })
    }

    getDownloadedEpisodes = function (episodes, callback = () => {}) {
        if (!offline.db) return
        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)

        let downloadedEpisodes = []

        episodes.forEach((id, index) => {
            var getItem = offline.objStore.get(id)
    
            getItem.onsuccess = function () {
                if (getItem.result && getItem.result.language == _lang.getLanguageCode()) {
                    downloadedEpisodes.push(getItem.result.name)
                }

                if ((index+1) == episodes.length)
                    callback(downloadedEpisodes)
            }
        })
    }

    fetchChapterAsset(data, param, callback) {
        caches.open("chaptersAssets").then((cache) => {
            cache.match(data[param])
                .then((response) => {
                    // console.log(response)
                    if (response) {
                        response.blob().then((blob) => {
                            const url = URL.createObjectURL(blob)
                            const newData = Object.assign({}, data)
                            newData[param] = url
                            
                            callback(newData)
                        })
                    }
                    else {
                        callback(data)
                    }
                })
        })
    }

    setConnection(mode) {
        offline.isOnline = mode

        if (offline.isOnline == false)
            offline.experience.world.hideLoading()
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

function formatBytes(bytes, decimals = 0) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}