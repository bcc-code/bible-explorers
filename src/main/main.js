const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')

import { autoUpdater } from 'electron-updater'
import { createAuthWindow, createLogoutWindow } from './authProcess.js'
import dns from 'dns'
import { refreshTokens } from './authService.js'

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

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(path.join(__dirname, '../build/index.html'))
    }

    mainWindow.maximize()
    mainWindow.show()
    // mainWindow.webContents.openDevTools()

    // autoUpdater.forceDevUpdateConfig = true
    autoUpdater.checkForUpdatesAndNotify()
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
            online ? createAuthWindow() : createWindow()
        })
    }
}

// Limit the app to a single instance and pass on arguments to the second instance (calls the "second-instance" event)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
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

autoUpdater.on('checking-for-update', () => {
    console.log('checking-for-update')
})

autoUpdater.on('update-available', () => {
    console.log('update-available')
    mainWindow.webContents.send('update_available')
})
autoUpdater.on('update-downloaded', () => {
    console.log('update-downloaded')
    mainWindow.webContents.send('update_downloaded')
})

autoUpdater.on('update-not-available', () => {
    console.log('update-not-available')
})

autoUpdater.on('error', (message) => {
    console.error('There was a problem updating the application')
    console.error(message)
})

ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('app-version', (event) => {
    event.sender.send('app-version', { version: app.getVersion() })
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
