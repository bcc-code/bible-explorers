// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import _e from '../Experience/Utils/Events.js'
import _s from '../Experience/Utils/Strings.js'
import gsap from 'gsap'

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    appVersion: () => {
        ipcRenderer.send('app-version')
        ipcRenderer.on('app-version', (event, arg) => {
            ipcRenderer.removeAllListeners('app-version')
            document.getElementById('app-version').innerText = 'Version ' + arg.version
        })
    },
    appNotifications: () => {
        const notification = document.getElementById('notification')
        const message = document.getElementById('message')
        const restartButton = document.getElementById('restart-button')
        const closeButton = document.getElementById('close-button')

        ipcRenderer.on('update-available', () => {
            ipcRenderer.removeAllListeners('update-available')
            message.innerHTML = _s.autoUpdate.updateAvailable
            showNotification()
        })
        ipcRenderer.on('update-downloaded', () => {
            ipcRenderer.removeAllListeners('update-downloaded')
            message.innerHTML = _s.autoUpdate.updateDownloaded
            restartButton.innerText = _s.autoUpdate.install
            restartButton.classList.remove('hidden')
            showNotification()
        })

        function showNotification() {
            gsap.to(notification, {
                duration: 1,
                x: 0,
                ease: 'power3.out',
                onStart: () => {
                    notification.classList.remove('hidden')
                },
            })
        }

        function hideNotification() {
            gsap.to(notification, {
                duration: 1,
                x: '-100%',
                ease: 'power3.in',
                onStart: () => {
                    notification.classList.add('hidden')
                },
            })
        }

        closeButton.addEventListener('click', hideNotification)

        restartButton.addEventListener('click', function () {
            ipcRenderer.send('restart-app')
        })
    },
    routeChanged: (query) => {
        ipcRenderer.send('route-changed', query)
        ipcRenderer.on('route-changed', (event, query) => {
            ipcRenderer.removeAllListeners('route-changed')
            window.dispatchEvent(_e.EVENTS.ROUTE_CHANGED(query))
        })
    },
})
