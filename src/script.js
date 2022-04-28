import './style.scss'
import Experience from './Experience/Experience.js'
import createAuth0Client from '@auth0/auth0-spa-js';
import _api from './Experience/Utils/Api.js'

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
    experience.auth0.isAuthenticated = await experience.auth0.isAuthenticated()

    if (experience.auth0.isAuthenticated) {
        experience.settings.updateUI()

        let userData = await experience.auth0.getUser()
        let personId = userData['https://login.bcc.no/claims/personId']

        experience.resources.httpGetAsync(_api.isAkLeder(personId), function(hasAccess) {
            if (JSON.parse(hasAccess) === true)
                document.body.classList.add('admin')
        })

        return
    }

    const query = window.location.search

    if (query.includes("code=") && query.includes("state=")) {
        await experience.auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, "/")
    }
}

// Offline mode

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
    })
}