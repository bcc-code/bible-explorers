import Experience from './Experience/Experience.js'
import Notification from './Experience/Utils/Notification.js';
import createAuth0Client from '@auth0/auth0-spa-js';
import _api from './Experience/Utils/Api.js'
import _s from './Experience/Utils/Strings.js'
import _lang from './Experience/Utils/Lang.js'
import _e from './Experience/Utils/Events.js'
import _appInsights from './Experience/Utils/AppInsights.js'
import _gl from './Experience/Utils/Globals.js'
import lazySizes from 'lazysizes';


// Application Insights
_appInsights.loadAppInsights()
_appInsights.trackPageView({ name: "Home" })

document.querySelector('.icons-spritesheet').style.display = 'none'
document.querySelector('.loader span').innerText = _s.initializing

// Start 3D experience
const experience = new Experience(document.querySelector('.webgl-canvas'))

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
const handleRedirectCallback = async () => {
    const query = window.location.search
    if (query.includes("code=") && query.includes("state=")) {
        await experience.auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, "/")
    }

    experience.auth0.isAuthenticated = await experience.auth0.isAuthenticated()

    if (experience.auth0.isAuthenticated) {
        experience.auth0.userData = await experience.auth0.getUser()
        let personId = experience.auth0.userData['https://login.bcc.no/claims/personId']

        experience.resources.fetchApiThenCache(_api.getRoles(personId), function (roles) {
            // In some cases the function will return an object instead of an array
            if (typeof roles === 'object')
                roles = Object.values(roles)

            if (roles.includes("administrator") || roles.includes("editor")) {
                document.body.classList.add("admin", "ak_leder")
            }
            else if (roles.includes("ak_leder") || roles.includes("translator") || roles.includes("manager")) {
                document.body.classList.add("ak_leder")
            }
            else {
                new Notification(_s.settings.noAccess)
            }

            experience.settings.updateUI()
            document.dispatchEvent(_e.EVENTS.USER_DATA_FETCHED)
        })
    }
    else {
        experience.settings.updateUI()
        document.dispatchEvent(_e.EVENTS.USER_DATA_FETCHED)
    }
}
// Detect browser
var browserName = (function (agent) {
    switch (true) {
        case agent.indexOf("edge") > -1: return "MS Edge";
        case agent.indexOf("edg/") > -1: return "Edge ( chromium based)";
        case agent.indexOf("opr") > -1 && !!window.opr: return "Opera";
        case agent.indexOf("chrome") > -1 && !!window.chrome: return "Chrome";
        case agent.indexOf("trident") > -1: return "MS IE";
        case agent.indexOf("firefox") > -1: return "Mozilla Firefox";
        case agent.indexOf("safari") > -1: return "Safari";
        default: return "other";
    }
})(window.navigator.userAgent.toLowerCase());


if (browserName !== 'Chrome') {
    new Notification(_s.browserNotification)
    // document.body.appendChild(_gl.elementFromHtml(`<span style="background: red; color: white; position: absolute; top: 7rem; left: 1rem; padding: 0.5rem; border-radius: 1rem; z-index: 99">You are using: ${browserName}</span>`));
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
    })
}

window.onload = async () => {
    await configureClient()
    await handleRedirectCallback()
}