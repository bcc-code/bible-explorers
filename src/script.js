import Experience from './Experience/Experience.js'
import Notification from './Experience/Utils/Notification.js'
import createAuth0Client from '@auth0/auth0-spa-js'
import _api from './Experience/Utils/Api.js'
import _s from './Experience/Utils/Strings.js'
import _lang from './Experience/Utils/Lang.js'
import _e from './Experience/Utils/Events.js'
import _appInsights from './Experience/Utils/AppInsights.js'
import _gl from './Experience/Utils/Globals.js'
import isElectron from 'is-electron'
import gsap from 'gsap'

// Loader text
document.querySelector('#loading_text').innerHTML = `<p>${_s.status.initializing}...</p>`

// Load icons
const ajax = new XMLHttpRequest()
ajax.open('GET', 'https://biblekids.io/wp-content/uploads/2023/03/biex-sprite.svg?ver=3', true)
ajax.send()
ajax.onload = function () {
    const div = document.createElement('div')
    div.className = 'w-0 h-0 hidden'
    div.setAttribute('id', 'biex-icons')
    div.innerHTML = ajax.responseText
    document.body.insertBefore(div, document.body.childNodes[0])
}

// Application Insights
_appInsights.loadAppInsights()
_appInsights.trackPageView({ name: 'Home' })

// Start 3D experience
const experience = new Experience()

if (isElectron()) {
    document.body.classList.add('electron')

    window.electronAPI.appVersion()
    window.electronAPI.routeChanged()

    // New app version notification

    const notification = document.getElementById('notification')
    const message = document.getElementById('message')
    const closeButton = document.getElementById('close-button')
    const restartButton = document.getElementById('restart-button')

    function showNotification() {
        gsap.fromTo(
            notification,
            {
                x: '-100%',
            },
            {
                duration: 1,
                x: '0%',
                ease: 'power3.out',
                onStart: () => {
                    notification.classList.remove('hidden')
                },
            }
        )
    }

    window.electronAPI.onUpdateAvailable(() => {
        message.innerHTML = _s.autoUpdate.updateAvailable
        showNotification()
    })

    window.electronAPI.onUpdateDownloaded(() => {
        message.innerHTML = _s.autoUpdate.updateDownloaded
        restartButton.innerText = _s.autoUpdate.install
        restartButton.classList.remove('hidden')
        showNotification()
    })

    closeButton.addEventListener('click', () => {
        gsap.to(notification, {
            duration: 1,
            x: '-100%',
            ease: 'power3.in',
            onComplete: () => {
                notification.classList.add('hidden')
            },
        })
    })

    restartButton.addEventListener('click', () => {
        window.electronAPI.restartApp()
    })
} else {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
        })

        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return
            refreshing = true
            window.location.reload()
        })
    }
}

// Auth0
const configureClient = async () => {
    experience.auth0 = await createAuth0Client({
        domain: 'login.bcc.no',
        client_id: 'XGnvXPLlcqw22EU84VsQeZs3oO7VYl34',
        cacheLocation: 'localstorage',
        useRefreshTokens: true,
    })
}

const handleRedirectCallback = async () => {
    const query = window.location.search
    if (query.includes('code=') && query.includes('state=')) {
        await experience.auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, '/')
    }

    experience.auth0.isAuthenticated = await experience.auth0.isAuthenticated()
    const requiredToLogin = experience.getUrlParameter('login')

    if (experience.auth0.isAuthenticated) {
        document.body.classList.add('logged-in')

        experience.auth0.userData = await experience.auth0.getUser()
        document.dispatchEvent(_e.EVENTS.USER_DATA_FETCHED)

        if (!isElectron()) {
            if (requiredToLogin) {
                window.history.replaceState({}, document.title, '/')
            }
        }
    } else {
        document.dispatchEvent(_e.EVENTS.USER_DATA_FETCHED)

        if (isElectron()) {
            // Check if the user is online
            let isOnline = false
            await fetch('https://httpbin.org/get?uuid=' + self.crypto.randomUUID())
                .then(() => (isOnline = true))
                .catch(() => (isOnline = false))

            if (!isOnline) {
                return
            }

            document.body.classList.add('not-logged-in')

            const loginScreen = document.querySelector('#login-screen')

            loginScreen.querySelector('.info').textContent = _s.loginScreen.redirectInfo
            loginScreen.querySelector('span').textContent = _s.loginScreen.manualRedirectInfo
            loginScreen.querySelector('a').textContent = _s.loginScreen.redirectLink

            loginScreen.querySelector('a').addEventListener('click', async function (e) {
                e.preventDefault()
                await experience.auth0.loginWithRedirect({
                    redirect_uri: 'biex://explorers.biblekids.io',
                })
            })

            setTimeout(() => {
                document.querySelector('#login-screen a').click()
            }, 2000)
        } else if (requiredToLogin) {
            await experience.auth0.loginWithRedirect({
                redirect_uri: window.location.origin,
            })
        }
    }
}

window.onload = async () => {
    await configureClient()
    await handleRedirectCallback()
}
window.addEventListener(_e.ACTIONS.ROUTE_CHANGED, async ({ detail }) => {
    window.location.search = detail.replace('/?', '')
    await configureClient()
    await handleRedirectCallback()
})


