// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    logoutWindow: (title) => ipcRenderer.send('logout-window', title),
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

        ipcRenderer.on('update_available', () => {
            ipcRenderer.removeAllListeners('update_available')
            message.innerText = 'A new update is available. Downloading now...'
            notification.classList.remove('hidden')
        })
        ipcRenderer.on('update_downloaded', () => {
            ipcRenderer.removeAllListeners('update_downloaded')
            message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?'
            restartButton.classList.remove('hidden')
            notification.classList.remove('hidden')
        })

        document.getElementById('close-button').addEventListener('click', function () {
            document.getElementById('notification').classList.add('hidden')
        })

        document.getElementById('restart-button').addEventListener('click', function () {
            ipcRenderer.send('restart-app')
        })
    },
})
