import './style.scss'
import Experience from './Experience/Experience.js'
import Notification from './Experience/Utils/Notification.js';
import createAuth0Client from '@auth0/auth0-spa-js';
import _api from './Experience/Utils/Api.js'
import _s from './Experience/Utils/Strings.js'
import _e from './Experience/Utils/Events.js'
import _appInsights from './Experience/Utils/AppInsights.js'

// Application Insights
_appInsights.loadAppInsights()
_appInsights.trackPageView({ name: "Home" })

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
            if (roles.includes("administrator") || roles.includes("editor")) {
                document.body.classList.add("admin", "ak_leder")
            }
            else if (roles.includes("ak_leder")) {
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
    const chromeIcon = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 128 128"><g clip-rule="evenodd"><path fill="none" d="M0 0h128v128H0z"/><g fill-rule="evenodd"><path fill="#EA4335" d="M15.454 22.297c29.752-34.626 84.917-27.791 105.54 12.656-14.517.005-37.25-.004-49.562 0-8.93.003-14.695-.2-20.939 3.087-7.34 3.864-12.879 11.026-14.812 19.439L15.454 22.297z"/><path fill="#4285F4" d="M42.708 63.998c0 11.735 9.542 21.283 21.271 21.283 11.728 0 21.27-9.547 21.27-21.283 0-11.735-9.542-21.283-21.27-21.283-11.729 0-21.271 9.548-21.271 21.283z"/><path fill="#34A853" d="M72.234 91.855c-11.939 3.548-25.91-.387-33.563-13.597-5.842-10.083-21.277-36.972-28.292-49.198-24.57 37.659-3.394 88.978 41.212 97.737l20.643-34.942z"/><path fill="#FBBC05" d="M83.737 42.715c9.944 9.248 12.11 24.224 5.374 35.836-5.075 8.749-21.271 36.085-29.121 49.322 45.958 2.833 79.461-42.209 64.328-85.158H83.737z"/></g></g></svg>'
    new Notification(_s.browserNotification, chromeIcon)
}


window.onload = async () => {
    await configureClient()
    await handleRedirectCallback()
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            registration.update()
        })
    })
}