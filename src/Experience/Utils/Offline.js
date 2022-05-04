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
        offline.dbVersion = 1.2
        offline.store = "episodesData"
        offline.db = null
        offline.transaction = null
        offline.objStore = null
        offline.request = null
    }

    createObjectStore = function (database) {
        console.log("Creating objectStore")
        offline.objStore = database.createObjectStore(offline.store)
        offline.objStore.createIndex('episodeIndex', 'episodeId')
    }

    setUpDbConnection = function () {
        if (!offline.request)
            offline.request = offline.indexedDB.open("Bible Kids Explorers", offline.dbVersion)

        offline.request.onerror = function () {
            console.log("Error creating/accessing IndexedDB database")
        }

        offline.request.onsuccess = function () {
            console.log("Success creating/accessing IndexedDB database")
            offline.db = offline.request.result

            offline.db.onerror = function () {
                console.log("Error creating/accessing IndexedDB database")
            }

            // Interim solution for Google Chrome to create an objectStore. Will be deprecated
            if (offline.db.setVersion) {
                if (offline.db.version != offline.dbVersion) {
                    var setVersion = offline.db.setVersion(offline.dbVersion)
                    setVersion.onsuccess = function () {
                        offline.createObjectStore(offline.db)
                    }
                }
            }
        }

        // For future use. Currently only in latest Firefox versions
        offline.request.onupgradeneeded = function (event) {
            offline.createObjectStore(event.target.result)
        }
    }

    downloadFromWeb = function (episodes) {
        offline.episodes = episodes
        offline.totalEpisodes = episodes.length
        offline.filesDownloaded = 0

        offline.startDownloading()
    }

    startDownloading = function () {
        const episode = offline.episodes[offline.filesDownloaded]

        var xhr = new XMLHttpRequest()
        xhr.responseType = "blob"
        xhr.open("GET", episode.downloadUrl, true)
        xhr.addEventListener("progress", offline.onDownloadProgress)
        xhr.addEventListener("load", offline.onDownloadComplete, false)
        xhr.send()
    }

    onDownloadProgress = function (e) {
        if (e.lengthComputable) {
            const episode = offline.episodes[offline.filesDownloaded]
            var percentage = (offline.filesDownloaded * 100 + (e.loaded / e.total) * 100) / offline.totalEpisodes
            
            let episodeEl = document.querySelector('.episode[data-id="' + episode.data.episodeId + '"]')
            episodeEl.querySelector('span.downloading-label').innerText = parseFloat(percentage).toFixed() + "%"
            episodeEl.querySelector('.progress-line').style.transform = `scaleX(${percentage / 100})`
        }
    }

    onDownloadComplete = function () {
        if (this.status === 200) {
            let episode = offline.episodes[offline.filesDownloaded]

            episode.data.blob = this.response
            offline.putFileInDb(episode.data)

            if (++offline.filesDownloaded == offline.totalEpisodes) {
                let episodeEl = document.querySelector('.episode[data-id="' + episode.data.episodeId + '"]')
                episodeEl.classList.remove('downloading')
                episodeEl.classList.add('downloaded')
            }
            else {
                offline.startDownloading()
            }
        }
    }

    putFileInDb = function (data) {
        // console.log("Putting " + data.name + " in " + offline.store)

        offline.transaction = offline.db.transaction([offline.store], "readwrite")
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.objStore.put(data, data.name)
    }

    loadFromIndexedDb = function (data, callback = function () { }, fallback = function () { }, videoName) {
        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)
        const getItem = offline.objStore.get(data.name)

        getItem.onsuccess = function () {
            if (getItem.result) {
                const item = getItem.result
                var r = new FileReader()

                r.onload = function (e) {
                    const contents = e.target.result
                    const uint8Array = new Uint8Array(contents)

                    const arrayBuffer = uint8Array.buffer
                    const blob = new Blob([arrayBuffer])
                    const fileUrl = URL.createObjectURL(blob)

                    const video = offline.createVideoElement(videoName, fileUrl)
                    document.getElementById('videos-container').appendChild(video)

                    callback(video, videoName, fileUrl)
                }

                r.readAsArrayBuffer(item.blob)
            }
            else {
                fallback(videoName)
            }
        }
    }

    createVideoElement = function (videoName, path) {
        let video = document.createElement('video')
        video.setAttribute('id', videoName)
        video.crossOrigin = 'anonymous'
        video.muted = false
        video.loop = false
        video.controls = true
        video.autoplay = false
        video.src = path

        return video
    }

    markEpisodeIfAvailableOffline = function (episode) {
        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)

        var episodeIndex = offline.objStore.index('episodeIndex')
        var getIndex = episodeIndex.getAll(episode.id.toString())

        getIndex.onsuccess = function () {
            if (getIndex.result.length == episode.data.length) {
                document.querySelector('.episode[data-id="' + episode.id + '"]').classList.add('downloaded')
            }
        }
    }
}