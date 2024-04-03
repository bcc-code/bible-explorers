import Experience from './Experience/Experience.js'
import Notification from './Experience/Utils/Notification.js'
import createAuth0Client from '@auth0/auth0-spa-js'
import _api from './Experience/Utils/Api.js'
import _s from './Experience/Utils/Strings.js'
import _lang from './Experience/Utils/Lang.js'
import _e from './Experience/Utils/Events.js'
import _appInsights from './Experience/Utils/AppInsights.js'
import _gl from './Experience/Utils/Globals.js'
import lazySizes from 'lazysizes'
import isElectron from 'is-electron'

// Loader text
// document.querySelector('#loading_text').innerHTML = `<p>${_s.status.initializing}...</p>`

// Load icons
const ajax = new XMLHttpRequest()
ajax.open('GET', 'https://biblekids.io/wp-content/uploads/2023/03/biex-sprite.svg', true)
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

    document.body.classList.add('logged-in')
    experience.auth0 = { isAuthenticated: true, userData: { name: 'Log out' } }
    document.dispatchEvent(_e.EVENTS.USER_DATA_FETCHED)

    window.electronAPI.appVersion()
    window.electronAPI.appNotifications()
} else {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
        })
    }

    // Auth0
    const configureClient = async () => {
        experience.auth0 = await createAuth0Client({
            domain: 'login.bcc.no',
            client_id: 'XGnvXPLlcqw22EU84VsQeZs3oO7VYl34',
        })
    }

    const handleRedirectCallback = async () => {
        const query = window.location.search
        if (query.includes('code=') && query.includes('state=')) {
            await experience.auth0.handleRedirectCallback()
            window.history.replaceState({}, document.title, '/')
        }

        experience.auth0.isAuthenticated = await experience.auth0.isAuthenticated()

        if (experience.auth0.isAuthenticated) {
            experience.auth0.userData = await experience.auth0.getUser()
            document.body.classList.add('logged-in')
        }

        document.dispatchEvent(_e.EVENTS.USER_DATA_FETCHED)
    }

    window.onload = async () => {
        await configureClient()
        await handleRedirectCallback()
    }
}

// Detect browser
var browserName = (function (agent) {
    switch (true) {
        case agent.indexOf('edge') > -1:
            return 'MS Edge'
        case agent.indexOf('edg/') > -1:
            return 'Edge ( chromium based)'
        case agent.indexOf('opr') > -1 && !!window.opr:
            return 'Opera'
        case agent.indexOf('chrome') > -1 && !!window.chrome:
            return 'Chrome'
        case agent.indexOf('trident') > -1:
            return 'MS IE'
        case agent.indexOf('firefox') > -1:
            return 'Mozilla Firefox'
        case agent.indexOf('safari') > -1:
            return 'Safari'
        default:
            return 'other'
    }
})(window.navigator.userAgent.toLowerCase())

if (browserName !== 'Chrome') {
    new Notification(_s.browserNotification)
    // document.body.appendChild(_gl.elementFromHtml(`<span style="background: red; color: white; position: absolute; top: 7rem; left: 1rem; padding: 0.5rem; border-radius: 1rem; z-index: 99">You are using: ${browserName}</span>`));
}

// adjust screens wrapper size
const dynamicDiv = document.getElementById('screens-wrapper')
const closedCaption = document.getElementById('closed-caption')
const aspectRatio = 1.5
experience.maxVW = 36
const maxVH = 65
const minPaddingTopVh = 6

experience.adjustScreensWrapperSize = () => {
    let vw = window.innerWidth * (experience.maxVW / 100)
    let vh = window.innerHeight * (maxVH / 100)

    // Calculate the width and height based on maintaining the aspect ratio
    let divWidth = vh * aspectRatio
    let divHeight = vh

    // If calculated width exceeds max VW, adjust both width and height to maintain aspect ratio
    if (divWidth > vw) {
        divWidth = vw
        divHeight = divWidth / aspectRatio
    }

    const paddingTop = Math.max(window.innerHeight * (minPaddingTopVh / 100), window.innerHeight * 0.01)

    dynamicDiv.style.width = `${Math.round(Math.min(divWidth, window.innerWidth))}px`
    // closedCaption.style.width = `${Math.round(Math.min(divWidth, window.innerWidth))}px`

    dynamicDiv.style.paddingTop = `${paddingTop}px`
}

window.addEventListener('resize', experience.adjustScreensWrapperSize)

experience.adjustScreensWrapperSize()
