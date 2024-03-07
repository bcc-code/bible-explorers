const { app, BrowserWindow, ipcMain, autoUpdater, dialog } = require('electron')
const path = require('path')

import { createAuthWindow, createLogoutWindow } from './authProcess.js'
import dns from 'dns'
import { refreshTokens } from './authService.js'

if (require('electron-squirrel-startup')) {
    app.quit()
}

// Don't run the updater on dev
if (app.isPackaged) {
    console.log('Run the updater')

    // Auto updater
    const { updateElectronApp } = require('update-electron-app')
    updateElectronApp()

    const server = 'https://github.com/bcc-code/bible-explorers/releases/download'
    const url = `${server}/v${app.getVersion()}/bible-explorers-app-${app.getVersion()}-${process.platform}`

    autoUpdater.setFeedURL({ url })
    console.log(url)

    // Check for updates every minute
    setInterval(
        () => {
            console.log('checkForUpdates')
            // autoUpdater.checkForUpdates()
        },
        1 * 60 * 1000
    )

    autoUpdater.on('checking-for-update', () => {
        console.log('checking-for-update')
    })

    autoUpdater.on('update-available', () => {
        console.log('update-available')
    })

    autoUpdater.on('update-not-available', () => {
        console.log('update-not-available')
    })

    // Notifying users when updates are available
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
        console.log('update-downloaded')

        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail: 'A new version has been downloaded. Restart the application to apply the updates.',
        }

        dialog.showMessageBox(dialogOpts).then((returnValue) => {
            if (returnValue.response === 0) autoUpdater.quitAndInstall()
        })
    })

    autoUpdater.on('error', (message) => {
        console.error('There was a problem updating the application')
        console.error(message)
    })
} else {
    console.log("DON'T run the updater")
}

export const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 1024,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false,
        icon: 'static/favicon.png',
    })

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
    }

    mainWindow.maximize()
    mainWindow.show()
    // mainWindow.webContents.openDevTools()
}

export const showWindow = async () => {
    let online = false

    try {
        await refreshTokens()
        return createWindow()
    } catch (error) {
        // Needed when offline
        dns.resolve('explorers.biblekids.io', (err) => {
            online = !err
            if (online) {
                createAuthWindow()
            } else {
                createWindow()
            }
        })
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', showWindow)

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        showWindow()
    }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Inter-Process Communication - Event listeners
ipcMain.on('logout-window', (event, data) => {
    createLogoutWindow()
})

ipcMain.on('login-window', (event, data) => {
    BrowserWindow.getAllWindows().forEach((win) => win.close())
    createAuthWindow()
})

ipcMain.handle('refresh-token', async () => {
    try {
        await refreshTokens()
        return { result: getAccessToken() }
    } catch (err) {
        return { error: 'Unable to refresh token' }
    }
})
