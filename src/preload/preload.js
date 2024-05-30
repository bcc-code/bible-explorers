// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import _e from '../Experience/Utils/Events.js'
import _s from '../Experience/Utils/Strings.js'

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    appVersion: () => {
        ipcRenderer.send('app-version')
        ipcRenderer.on('app-version', (event, arg) => {
            ipcRenderer.removeAllListeners('app-version')
            document.getElementById('app-version').innerText = 'Version ' + arg.version
        })
    },
    routeChanged: (query) => {
        ipcRenderer.send('route-changed', query)
        ipcRenderer.on('route-changed', (event, query) => {
            ipcRenderer.removeAllListeners('route-changed')
            window.dispatchEvent(_e.EVENTS.ROUTE_CHANGED(query))
        })
    },
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', () => {
            ipcRenderer.removeAllListeners('update-available')
            callback()
        })
    },
    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', () => {
            ipcRenderer.removeAllListeners('update-downloaded')
            callback()
        })
    },
    restartApp: () => {
        ipcRenderer.send('restart-app')
    },
})
