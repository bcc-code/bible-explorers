import { BrowserWindow } from 'electron'
import { getAuthenticationURL, loadTokens, getLogOutUrl, logout } from './authService.js'
import { createWindow, showWindow } from './main.js'

let win = null

export const createAuthWindow = () => {
    destroyAuthWin()

    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
        },
    })

    win.loadURL(getAuthenticationURL())
    // win.webContents.openDevTools()

    const {
        session: { webRequest },
    } = win.webContents

    const filter = {
        urls: ['http://localhost/callback*'],
    }

    webRequest.onBeforeRequest(filter, async ({ url }) => {
        try {
            await loadTokens(url)
            createWindow()
            return destroyAuthWin()
        } catch (e) {
            createLogoutWindow()
            return destroyAuthWin()
        }
    })

    win.on('authenticated', () => {
        destroyAuthWin()
    })

    win.on('closed', () => {
        win = null
    })
}

export const destroyAuthWin = () => {
    if (!win) return

    win.close()
    win = null
}

export const createLogoutWindow = () => {
    const logoutWindow = new BrowserWindow({
        show: false,
    })

    logoutWindow.loadURL(getLogOutUrl())

    logoutWindow.on('ready-to-show', async () => {
        BrowserWindow.getAllWindows().forEach((win) => win.close())
        await logout()
        createAuthWindow()
    })
}
