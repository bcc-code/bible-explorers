import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'
import _lang from '../Utils/Lang.js'
import _appInsights from '../Utils/AppInsights.js'
import isElectron from 'is-electron'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/shift-away.css'
import DropdownToggle from '../Utils/DropdownToggle.js'

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

        instance.videoQualityToggle = document.querySelector('#toggle-vq')
        instance.fullscreenToggle = document.querySelector('#toggle-fullscreen')
        instance.languageToggle = document.querySelector('#toggle-languages')

        instance.setDefaultVideoQuality()
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

        tippy(loginBtn, {
            theme: 'explorers',
            content: _s.settings.logIn,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })

        tippy(logoutBtn, {
            theme: 'explorers',
            content: _s.settings.logOut,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })
        const copyrightFooter = document.querySelector('#copyright')
        copyrightFooter.innerHTML = `Copyright ${new Date().getFullYear()} © <a href="https://bcc.media" target="_blank" class="transition hover:text-bke-orange">BCC Media STI</a>`
    }

    eventListeners() {
        instance.videoQualityTooltip = tippy(instance.videoQualityToggle, {
            theme: 'explorers',
            content: `${_s.settings.videoQuality.title} - ${_s.settings.videoQuality[this.videoQuality]}`,
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })

        instance.videoQualityToggle.addEventListener('click', (e) => {
            instance.videoQuality = instance.videoQuality === 'high' ? 'medium' : 'high'
            localStorage.setItem('videoQuality', instance.videoQuality)
            e.target.setAttribute('data-quality', instance.videoQuality)

            instance.updateVideoQualityTooltipContent()
        })

        const dropdownLanguages = instance.languageToggle.nextElementSibling
        const languageDropdownToggle = new DropdownToggle(instance.languageToggle, dropdownLanguages)

        const languageItems = document.querySelectorAll('#app-language li')
        languageItems.forEach((language) => {
            language.addEventListener('click', () => {
                _lang.updateLanguage(language.getAttribute('data-id'))
            })
        })

        function isFullscreen() {
            return document.fullscreenElement != null
        }

        function getTooltipContent() {
            const stateLabel = isFullscreen() ? _s.settings.on : _s.settings.off
            return `${_s.settings.fullScreenMode} - ${stateLabel}`
        }

        const fullscreenToggleTooltip = tippy(instance.fullscreenToggle, {
            theme: 'explorers',
            content: getTooltipContent(),
            duration: [500, 200],
            animation: 'shift-away',
            placement: 'bottom',
        })

        instance.fullscreenToggle.addEventListener('click', () => {
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
            instance.fullscreenToggle.classList.toggle('fullscreen-active', document.fullscreenElement)
            fullscreenToggleTooltip.setContent(getTooltipContent())
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
            instance.videoQuality = defaultVideoQuality
        } else {
            instance.videoQuality = currentQuality
        }

        instance.videoQualityToggle.setAttribute('data-quality', instance.videoQuality)
    }

    updateVideoQualityTooltipContent() {
        const qualityLabel = _s.settings.videoQuality[instance.videoQuality]
        instance.videoQualityTooltip.setContent(`${_s.settings.videoQuality.title} - ${qualityLabel}`)
    }

    updateUI = async () => {
        instance.logInLogOut.login = instance.experience.auth0.isAuthenticated
        instance.logInLogOut.logout = !instance.experience.auth0.isAuthenticated

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')

        if (loginBtn) {
            loginBtn.disabled = instance.logInLogOut.login
            logoutBtn.disabled = instance.logInLogOut.logout
        }
    }

    login = async () => {
        await this.experience.auth0.loginWithRedirect({
            redirect_uri: window.location.origin,
        })
    }

    logout = () => {
        this.experience.auth0.logout({
            returnTo: window.location.origin,
        })
    }
}
