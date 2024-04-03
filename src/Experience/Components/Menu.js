import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'
import _lang from '../Utils/Lang.js'
import _appInsights from '../Utils/AppInsights.js'
import isElectron from 'is-electron'

let instance = null

export default class Menu {
    constructor() {
        instance = this
        instance.experience = new Experience()

        instance.soundOn = true
        instance.currentDataView

        instance.logInLogOut = {
            login: false,
            logout: false,
        }

        instance.init()
        instance.eventListeners()
    }

    init() {
        _appInsights.trackPageView({ name: 'Settings' })

        const selectLang = document.querySelector('#app-language')
        const selectLangCurrent = selectLang.querySelector('button span')
        const selectLangDropdown = selectLang.querySelector('ul')
        selectLangCurrent.innerText = _lang.getLanguageName()
        selectLangDropdown.innerHTML = _lang.getLanguagesList()
        selectLangDropdown.querySelectorAll('li').forEach((item) => {
            item.className = ''
        })

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')
        loginBtn.querySelector('span').innerText = _s.settings.logIn
        logoutBtn.querySelector('span').innerText = _s.settings.logOut
        loginBtn.setAttribute('title', _s.settings.logIn)
        logoutBtn.setAttribute('title', _s.settings.logOut)

        const copyrightFooter = document.querySelector('#copyright')
        copyrightFooter.innerHTML = `Copyright ${new Date().getFullYear()} © <a href="https://bcc.media" target="_blank" class="transition hover:text-bke-orange">BCC Media STI</a>`

        instance.setDefaultVideoQuality()
    }

    eventListeners() {
        document.querySelector('#toggle-vq').addEventListener('click', (e) => {
            const newQuality = this.videoQuality === 'high' ? 'medium' : 'high'

            localStorage.setItem('videoQuality', newQuality)
            this.videoQuality = newQuality
            e.target.setAttribute('data-quality', newQuality)
        })

        let isToggled = false

        document.querySelector('#toggle-languages').addEventListener('click', (e) => {
            isToggled = !isToggled
            e.target.classList.toggle('active')
            e.target.setAttribute('aria-pressed', String(isToggled))
            e.target.nextElementSibling.classList.toggle('is-visible')
        })

        const languageItems = document.querySelectorAll('#app-language li')
        languageItems.forEach((language) => {
            language.addEventListener('click', () => {
                _lang.updateLanguage(language.getAttribute('data-id'))
            })
        })

        const fullscreenToggle = document.getElementById('toggle-fullscreen')
        fullscreenToggle.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
                })
            } else {
                document.exitFullscreen().catch((err) => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`)
                })
            }
        })

        document.addEventListener('fullscreenchange', () => {
            fullscreenToggle.classList.toggle('fullscreen-active', document.fullscreenElement)
        })

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')

        loginBtn.addEventListener('click', instance.login)
        logoutBtn.addEventListener('click', instance.logout)

        document.addEventListener(_e.ACTIONS.USER_DATA_FETCHED, instance.updateUI)
    }

    setDefaultVideoQuality() {
        const defaultVideoQuality = 'high'
        const currentQuality = localStorage.getItem('videoQuality')

        if (!currentQuality) {
            localStorage.setItem('videoQuality', defaultVideoQuality)
            this.videoQuality = defaultVideoQuality
        } else {
            this.videoQuality = currentQuality
        }

        document.querySelector('#toggle-vq').setAttribute('data-quality', this.videoQuality)
    }

    updateUI = async () => {
        instance.logInLogOut.login = instance.experience.auth0.isAuthenticated
        instance.logInLogOut.logout = !instance.experience.auth0.isAuthenticated

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')

        const loginUser = document.querySelector('[aria-label="User"]')

        if (loginBtn) {
            loginBtn.disabled = instance.logInLogOut.login
            logoutBtn.disabled = instance.logInLogOut.logout

            // loginUser.innerText = instance.experience.auth0.userData?.name || ''
        }
    }

    login = async () => {
        await this.experience.auth0.loginWithRedirect({
            redirect_uri: window.location.origin,
        })
    }

    logout = () => {
        if (isElectron()) {
            window.electronAPI.logoutWindow()
        } else {
            this.experience.auth0.logout({
                returnTo: window.location.origin,
            })
        }
    }
}
