import './scss/style.scss'
import Experience from './Experience/Experience.js'
import Notification from './Experience/Utils/Notification.js';
import createAuth0Client from '@auth0/auth0-spa-js';
import _api from './Experience/Utils/Api.js'
import _s from './Experience/Utils/Strings.js'
import _lang from './Experience/Utils/Lang.js'
import _e from './Experience/Utils/Events.js'
import _appInsights from './Experience/Utils/AppInsights.js'
import lazySizes from 'lazysizes';

// Application Insights
_appInsights.loadAppInsights()
_appInsights.trackPageView({ name: "Home" })

document.querySelector('.icons-spritesheet').style.display = 'none'

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
                const mentorNotification = new Notification(_s.settings.noAccess)
                mentorNotification.htmlEl.classList.add('alert-mentor')
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

document.addEventListener(_e.ACTIONS.USER_DATA_FETCHED, function() {
    // Support chat - setup
    window.intercomSettings = {
        api_base: "https://api-iam.intercom.io",
        app_id: "gy6jlngb",
        language_override: _lang.getLanguageCode(),
        hide_default_launcher: true
    }
    
    // Define user
    if (experience.auth0.userData) {
        window.intercomSettings.name = experience.auth0.userData.name
        window.intercomSettings.email = experience.auth0.userData.email
        window.intercomSettings.user_hash = experience.auth0.userData.intercom_hash
    }

    // Initialize
    (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/gy6jlngb';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})()

    // Actions
    const contactButtons = document.querySelector('[aria-label="Contact"]')

    Intercom('onHide', function() { contactButtons.removeAttribute('is-open') })
    Intercom('onShow', function() { contactButtons.setAttribute('is-open', true) })

    contactButtons.addEventListener('click', () => {
        contactButtons.hasAttribute('is-open')
            ? Intercom('hide')
            : Intercom('show')
    })
})

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
    const browserNotification = new Notification(_s.browserNotification, chromeIcon)
    browserNotification.htmlEl.classList.add('alert-browser-used')
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            registration.update()
        })
    })
}

window.onload = async () => {
    await configureClient()
    await handleRedirectCallback()
}