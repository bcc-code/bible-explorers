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

        const defaultVideoQuality = 'high'
        instance.videoQuality = localStorage.getItem('videoQuality') || defaultVideoQuality
        document.querySelector('#app-video-quality').setAttribute('data-quality', instance.videoQuality)

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
            item.className = 'px-2 py-1 xl:py-2 xl:px-3 text-base xl:text-xl font-medium cursor-pointer transition hover:bg-white/20'
        })

        const selectVQ = document.querySelector('#app-video-quality')
        const selectVQLabel = selectVQ.querySelector('h5')
        const selectVQItems = selectVQ.querySelectorAll('button')
        selectVQLabel.innerText = _s.settings.videoQuality.title + ':'
        selectVQItems.forEach((item) => {
            const btn = item.getAttribute('data-id')
            if (btn === 'low') {
                item.innerText = _s.settings.videoQuality.low
            } else if (btn === 'medium') {
                item.innerText = _s.settings.videoQuality.medium
            } else if (btn === 'high') {
                item.innerText = _s.settings.videoQuality.high
            }
        })

        const fullscreen = document.querySelector('#fullscreen-setting')
        fullscreen.querySelector('h5').innerText = _s.settings.fullScreenMode + ':'
        fullscreen.querySelector('input').checked = document.fullscreenElement !== null
        fullscreen.querySelector('label').innerText = !document.fullscreenElement ? _s.settings.off : _s.settings.on

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')
        loginBtn.querySelector('span').innerText = _s.settings.logIn
        logoutBtn.querySelector('span').innerText = _s.settings.logOut
        loginBtn.setAttribute('title', _s.settings.logIn)
        logoutBtn.setAttribute('title', _s.settings.logOut)

        const bibleExplorersGuide = document.querySelector('#guide-link span')
        bibleExplorersGuide.innerText = _s.howTo
        bibleExplorersGuide.setAttribute('href', `https://biblekids.io/${_lang.getLanguageCode()}/explorers/`)

        const copyrightFooter = document.querySelector('#copyright')
        copyrightFooter.innerHTML = `Copyright ${new Date().getFullYear()} © <a href="https://bcc.media" target="_blank" class="transition hover:text-bke-orange">BCC Media STI</a>`
    }

    eventListeners() {
        let isToggled = false

        document.querySelector('#toggle-settings')?.addEventListener('click', (e) => {
            isToggled = !isToggled
            e.target.classList.toggle('active')
            e.target.setAttribute('aria-pressed', isToggled)
            e.target.parentElement.classList.toggle('dropdown-is-visible')
        })

        document.querySelector('#toggle-languages')?.addEventListener('click', (e) => {
            isToggled = !isToggled
            e.target.classList.toggle('active')
            e.target.setAttribute('aria-pressed', isToggled)
            e.target.parentElement.classList.toggle('dropdown-is-visible')
        })

        const languageItems = document.querySelectorAll('#app-language li')

        languageItems.forEach((language) => {
            language.addEventListener('click', () => {
                _lang.updateLanguage(language.getAttribute('data-id'))
            })
        })

        const videoQualityItems = document.querySelectorAll('#app-video-quality button')

        videoQualityItems.forEach((item) => {
            item.addEventListener('click', () => {
                instance.videoQuality = item.getAttribute('data-id')
                localStorage.setItem('videoQuality', instance.videoQuality)
                document.querySelector('#app-video-quality').setAttribute('data-quality', instance.videoQuality)
            })
        })

        const fullscreen = document.querySelector('#fullscreen-setting')
        fullscreen.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.requestFullscreen()
            } else {
                document.exitFullscreen()
            }
        })

        window.addEventListener('resize', (e) => {
            if (window.innerHeight == screen.height) {
                fullscreen.querySelector('input').checked = true
                fullscreen.querySelector('label').innerText = _s.settings.on
            } else {
                fullscreen.querySelector('input').checked = false
                fullscreen.querySelector('label').innerText = _s.settings.off
            }
        })

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')

        loginBtn.addEventListener('click', instance.login)
        logoutBtn.addEventListener('click', instance.logout)

        document.addEventListener(_e.ACTIONS.USER_DATA_FETCHED, instance.updateUI)
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
