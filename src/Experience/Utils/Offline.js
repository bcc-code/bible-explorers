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
        offline.dbVersion = 1.0
        offline.store = "episodesData"
        offline.db = null
        offline.transaction = null
        offline.objStore = null
        offline.getItem = null
        offline.putItem = null
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

    downloadFromWeb = function (url, data) {
        var xhr = new XMLHttpRequest()
             
        xhr.open("GET", url, true);
        xhr.responseType = "blob";

        xhr.addEventListener("progress", function (e) {
            if (e.lengthComputable) {
              var percentage = (e.loaded / e.total) * 100
              document.querySelector('.episode[data-id="' + data.episodeId + '"] span.downloading').innerText = parseFloat(percentage).toFixed()+"%"
            }
        })

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                document.querySelector('.episode[data-id="' + data.episodeId + '"]').classList.remove('downloading')
                document.querySelector('.episode[data-id="' + data.episodeId + '"]').classList.add('downloaded')
                 
                data.blob = xhr.response

                offline.putFileInDb(data)
            }
        }, false)

        xhr.send()
    }

    putFileInDb = function (data) {
        console.log("Putting " + data.name + " in " + offline.store)

        offline.transaction = offline.db.transaction([offline.store], "readwrite")
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.putItem = offline.objStore.put(data, data.name)
    }

    loadFromIndexedDb = function (data, fallback = function(){}) {
        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)
        offline.getItem = offline.objStore.get(data.name)
        
        offline.getItem.onsuccess = function () {
            if (offline.getItem.result) {
                const item = offline.getItem.result
                const video = item.blob
                console.log("Got element!", item)

                var URL = window.URL || window.webkitURL
                const fileUrl = URL.createObjectURL(video)

                var domElem = document.createElement("video")
                domElem.setAttribute("id", data.name)
                domElem.setAttribute("src", fileUrl)
                document.getElementById('videos-container').appendChild(domElem)

                URL.revokeObjectURL(fileUrl)
            }
            else {
                console.log('Load from BTV')
                fallback
            }
        }
    }

    markEpisodeIfAvailableOffline = function (episode) {
        offline.transaction = offline.db.transaction([offline.store], "readonly")
        offline.objStore = offline.transaction.objectStore(offline.store)

        var episodeIndex = offline.objStore.index('episodeIndex')
        var getIndex = episodeIndex.getAll(episode.id.toString())

        getIndex.onsuccess = function() {
            if (getIndex.result.length == episode.data.length) {
                document.querySelector('.episode[data-id="' + episode.id + '"]').classList.add('downloaded')
            }
        }
    }
}