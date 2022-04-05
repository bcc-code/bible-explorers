import './style.scss'
import Experience from './Experience/Experience.js'
import createAuth0Client from '@auth0/auth0-spa-js';

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

    const isAuthenticated = await experience.auth0.isAuthenticated();
    if (isAuthenticated) return

    const query = window.location.search
    if (query.includes("code=") && query.includes("state=")) {
        await experience.auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, "/")
    }
}