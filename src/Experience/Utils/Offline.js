import _appInsights from '../Utils/AppInsights.js'

let offline = null

export default class Offline {
    constructor() {
        if (offline)
            return offline

        offline = this

        if ("indexedDB" in window) {
            this.initialize()
            this.setUpDbConnection()
        }
        else {
            console.log("This browser doesn't support IndexedDB");
            return;
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
        offline.objStore.createIndex('chapterIndex', 'chapterId')
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

    downloadFromWeb = function (episodes) {
        offline.episodes = episodes
        offline.totalEpisodes = episodes.length
        offline.filesDownloaded = 0

        offline.startDownloading()
    }

    startDownloading = function () {
        const currentEpisode = offline.episodes[offline.filesDownloaded]

        var xhr = new XMLHttpRequest()
        xhr.responseType = "blob"
        xhr.open("GET", currentEpisode.data.thumbnail, true)
        xhr.addEventListener("load", offline.onThumbnailDownloadComplete, false)
        xhr.send()
    }

    onThumbnailDownloadComplete = function () {
        if (this.status === 200) {
            offline.episodes[offline.filesDownloaded].data.thumbnail = this.response
            offline.downloadVideo()
        }
    }

    downloadVideo = function() {
        const currentEpisode = offline.episodes[offline.filesDownloaded]

        var xhr = new XMLHttpRequest()
        xhr.responseType = "blob"
        xhr.open("GET", currentEpisode.downloadUrl, true)
        xhr.addEventListener("progress", offline.onVideoDownloadProgress)
        xhr.addEventListener("load", offline.onVideoDownloadComplete, false)
        xhr.send()
    }

    onVideoDownloadProgress = function (e) {
        if (e.lengthComputable) {
            const currentEpisode = offline.episodes[offline.filesDownloaded]
            var percentage = (offline.filesDownloaded * 100 + (e.loaded / e.total) * 100) / offline.totalEpisodes
            
            let chapterEl = document.querySelector('.chapter[data-id="' + currentEpisode.data.chapterId + '"]')
            chapterEl.querySelector('span.downloading-label').innerText = parseFloat(percentage).toFixed() + "%"
            chapterEl.querySelector('.progress-line').style.transform = `scaleX(${percentage / 100})`
        }
    }

    onVideoDownloadComplete = function () {
        if (this.status === 200) {
            let currentEpisode = offline.episodes[offline.filesDownloaded]

            currentEpisode.data.video = this.response
            offline.putFileInDb(currentEpisode.data)

            if (++offline.filesDownloaded == offline.totalEpisodes) {
                let chapterEl = document.querySelector('.chapter[data-id="' + currentEpisode.data.chapterId + '"]')
                chapterEl.classList.remove('downloading')
                chapterEl.classList.add('downloaded')

                _appInsights.trackEvent({
                    name: "Chapter downloaded",
                    properties: {
                        title: currentEpisode.data.chapterTitle,
                        category: currentEpisode.data.category,
                        language: currentEpisode.data.language,
                        quality: currentEpisode.data.quality
                    }
                })
            }
            else {
                offline.startDownloading()
            }
        }
    }

    putFileInDb = function (data) {
        offline.transaction = offline.db.transaction([offline.store], "readwrite")
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.objStore.put(data, data.name)
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
            if (getItem.result) {
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
        if (!offline.db) return
        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)

        var chapterIndex = offline.objStore.index('chapterIndex')
        var getIndex = chapterIndex.getAll(chapter.id.toString())

        getIndex.onsuccess = function () {
            if (getIndex.result.length == chapter.episodes.length) {
                document.querySelector('.chapter[data-id="' + chapter.id + '"]').classList.add('downloaded')
            }
        }
    }

    fetchChapterAsset(data, param, callback) {
        caches.open("chaptersAssets").then((cache) => {
            cache.match(data[param])
                .then((response) => {
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
}