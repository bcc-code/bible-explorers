let offline = null

export default class Offline {
    constructor() {
        if (offline)
            return offline

        offline = this
        this.initialize()
    }

    initialize = function () {
        offline.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB
        offline.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction
        offline.dbVersion = 1.0
        offline.db = null
        offline.transaction = null
        offline.objStore = null
        offline.getItem = null
        offline.putItem = null
        offline.request = null
    }

    accessDb = function (store, callback = function(){}) {
        let args = arguments

        if (!offline.request)
            offline.request = offline.indexedDB.open("bibleExplorersEpisodes", offline.dbVersion)

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
                        offline.createObjectStore(store, offline.db)
                    }
                }
            }
    
            callback(Array.prototype.slice.call(args, 2))
        }
        
        // For future use. Currently only in latest Firefox versions
        offline.request.onupgradeneeded = function (event) {
            offline.createObjectStore(store, event.target.result)
        }
    }

    createObjectStore = function (store, database) {
        // console.log("Creating objectStore")
        database.createObjectStore(store)
    }

    getFromIndexedDb = function (store, name) {
        offline.accessDb(
            store, offline.retrieveStoredFile, store, name
        )
    }

    retrieveStoredFile = function (args) {
        let store = args[0], name = args[1]

        offline.transaction = offline.db.transaction([store], "readonly")
        offline.objStore = offline.transaction.objectStore(store)
        offline.getItem = offline.objStore.get(name)
        
        offline.getItem.onsuccess = function () {
            const file = offline.getItem.result
            console.log("Got element!", file)

            var URL = window.URL || window.webkitURL
            var fileUrl = URL.createObjectURL(file)
            var domElem = document.getElementById(name)
            
            var domElem = document.createElement("img")
            domElem.setAttribute("id", name)
            domElem.setAttribute("src", fileUrl)
            document.getElementById('chapters').appendChild(domElem)

            URL.revokeObjectURL(fileUrl)
        }
    }

    downloadFromWeb = function (url, store, name) {
        var xhr = new XMLHttpRequest(),
        blob;
             
        xhr.open("GET", url, true);
        xhr.responseType = "blob";

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                console.log("File Downloaded")

                document.querySelector('.episode[data-id="'+store+'"]').classList.remove('downloading')
                document.querySelector('.episode[data-id="'+store+'"]').classList.remove('downloaded')
                 
                blob = xhr.response

                offline.accessDb(
                    store, offline.putFileInDb, store, name, blob
                )
            }
        }, false)

        xhr.send()
    }

    putFileInDb = function (args) {
        let store = args[0], name = args[1], blob = args[2]
        console.log("putFileInDb", store, name, blob)
        console.log("Putting " + name + " in IndexedDB")

        offline.transaction = offline.db.transaction([store], "readwrite")
        offline.objStore = offline.transaction.objectStore(store)
        offline.putItem = offline.objStore.put(blob, name)
    }
}