import './style.scss'
import Experience from './Experience/Experience.js'
import createAuth0Client from '@auth0/auth0-spa-js';
import _api from './Experience/Utils/Api.js'
import _appInsights from './Experience/Utils/AppInsights.js'

// Application Insights
_appInsights.loadAppInsights()
_appInsights.trackPageView()

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

window.onload = async () => {
    await configureClient()

    const query = window.location.search
    if (query.includes("code=") && query.includes("state=")) {
        await experience.auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, "/")
    }

    experience.auth0.isAuthenticated = await experience.auth0.isAuthenticated()

    if (experience.auth0.isAuthenticated) {
        experience.settings.updateUI()

        let userData = await experience.auth0.getUser()
        let personId = userData['https://login.bcc.no/claims/personId']

        experience.resources.fetchApiThenCache(_api.getRoles(personId), function (roles) {
            if (roles.includes("administrator") || roles.includes("editor"))
                document.body.classList.add("admin", "ak_leder")

            if (roles.includes("ak_leder"))
                document.body.classList.add("ak_leder")
        })
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            registration.update()
        })
    })
}