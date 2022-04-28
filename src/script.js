import './style.scss'
import Experience from './Experience/Experience.js'
import createAuth0Client from '@auth0/auth0-spa-js';
import _api from './Experience/Utils/Api.js'

// Start 3D experience
const experience = new Experience(document.querySelector('.webgl'))

// Auth0
const fetchAuthConfig = () => fetch("/auth_config.json")
const configureClient = async () => {
    const response = await fetchAuthConfig()
    const config = await response.json()

    experience.auth0 = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId
    })
}

window.onload = async () => {
    await configureClient()
    experience.auth0.isAuthenticated = await experience.auth0.isAuthenticated()

    if (experience.auth0.isAuthenticated) {
        experience.settings.updateUI()

        let userData = await experience.auth0.getUser()
        let personId = userData['https://login.bcc.no/claims/personId']

        experience.resources.httpGetAsync(_api.isAkLeder(personId), function(hasAccess) {
            if (JSON.parse(hasAccess) === true)
                document.body.classList.add('admin')
        })

        return
    }

    const query = window.location.search

    if (query.includes("code=") && query.includes("state=")) {
        await experience.auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, "/")
    }
}

// Offline mode

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
    })
}

// IndexedDB

(function () {
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
        IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
        dbVersion = 1.0, transaction, db;

    var request = indexedDB.open("bibleExplorersEpisodes", dbVersion),

        createObjectStore = function (dataBase) {
            console.log("Creating objectStore")
            dataBase.createObjectStore("abraham");
        },

        getFile = function (store, name) {
            transaction = db.transaction(["abraham"], "readonly");
            transaction.objectStore(store).get(name).onsuccess = function(event) {
                if (event.target.result) {
                    retrieveStoredFile(store, name);
                }
                else {
                    downloadFile(store, name)
                }
            }
        },

        retrieveStoredFile = function (store, name) {
            transaction.objectStore(store).get(name)
                .onsuccess = function (event) {
                    var file = event.target.result;
                    console.log("Got element!", file);

                    var URL = window.URL || window.webkitURL;
                    var fileUrl = URL.createObjectURL(file);
                    var domElem = document.getElementById(name);
                    domElem.setAttribute("src", fileUrl);

                    URL.revokeObjectURL(fileUrl);
                    transaction.abort();
                }
        },

        downloadFile = function (store, name) {
             var xhr = new XMLHttpRequest(),
             blob;
                 
             xhr.open("GET", "https://brunstadtv.imgix.net/BIEX_seriebilde.jpeg", true);
             xhr.responseType = "blob";

             xhr.addEventListener("load", function () {
                 if (xhr.status === 200) {
                     console.log("File Downloaded");
                     
                     blob = xhr.response;
                     console.log("Blob", blob);

                     putFileInDb(blob, store, name);
                 }
             }, false);

             xhr.send();
        },

        putFileInDb = function (blob, store, name) {
            console.log("Putting " + name + " in IndexedDB");

            transaction = db.transaction([store], "readwrite");
            transaction.objectStore(store).put(blob, name);
            retrieveStoredFile(store, name);
        };

    request.onerror = function (event) {
        console.log("Error creating/accessing IndexedDB database");
    };

    request.onsuccess = function (event) {
        console.log("Success creating/accessing IndexedDB database");
        db = request.result;

        db.onerror = function (event) {
            console.log("Error creating/accessing IndexedDB database");
        };
        
        // Interim solution for Google Chrome to create an objectStore. Will be deprecated
        if (db.setVersion) {
            if (db.version != dbVersion) {
                var setVersion = db.setVersion(dbVersion);
                setVersion.onsuccess = function () {
                    createObjectStore(db);
                }
            }
        }

        getFile("abraham", "episode-999_thumbnail");
    }
    
    // For future use. Currently only in latest Firefox versions
    request.onupgradeneeded = function (event) {
        createObjectStore(event.target.result);
    };
})();