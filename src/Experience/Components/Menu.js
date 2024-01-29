import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _lang from '../Utils/Lang.js'
import _appInsights from '../Utils/AppInsights.js'

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
        const selectLangLabel = selectLang.querySelector('h5')
        const selectLangCurrent = selectLang.querySelector('button')
        const selectLangDropdown = selectLang.querySelector('ul')
        selectLangLabel.innerText = _s.settings.language + ':'
        selectLangCurrent.innerText = _lang.getLanguageName()
        selectLangDropdown.innerHTML = _lang.getLanguagesList()
        selectLangDropdown.querySelectorAll('li').forEach((item) => {
            item.className = 'py-2 px-3 text-xl font-medium cursor-pointer transition hover:bg-bke-darkpurple/5'
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

        const backgroundMusic = document.querySelector('#bg-music-setting')
        const backgroundMusicLabel = backgroundMusic.querySelector('h5 div')
        backgroundMusicLabel.innerText = _s.settings.backgroundMusic + ':'

        const soundEFX = document.querySelector('#SFX-setting')
        soundEFX.querySelector('h5').innerText = _s.settings.soundEffects + ':'
        soundEFX.querySelector('input').setAttribute(instance.soundOn ? 'checked' : '', '')
        soundEFX.querySelector('label').innerText = instance.soundOn ? _s.settings.on : _s.settings.off

        const fullscreen = document.querySelector('#fullscreen-setting')
        fullscreen.querySelector('h5').innerText = _s.settings.fullScreenMode + ':'
        fullscreen.querySelector('input').checked = document.fullscreenElement !== null
        fullscreen.querySelector('label').innerText = !document.fullscreenElement ? _s.settings.off : _s.settings.on

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')
        loginBtn.setAttribute('title', _s.settings.logIn)
        logoutBtn.setAttribute('title', _s.settings.logOut)

        const bibleExplorersGuide = document.querySelector('#guide-link')
        bibleExplorersGuide.innerText = _s.howTo
        bibleExplorersGuide.setAttribute('href', `https://biblekids.io/${_lang.getLanguageCode()}/explorers/`)

        const copyrightFooter = document.querySelector('#copyright')
        copyrightFooter.innerHTML = `Copyright ${new Date().getFullYear()} © <a href="https://bcc.media" target="_blank">BCC Media STI</a>`
    }

    menuOpenClose() {
        const open = document.querySelector('#open-menu')
        const close = document.querySelector('#close-menu')

        open.addEventListener('click', () => {
            instance.currentDataView = document.querySelector('#app').getAttribute('data-view')
            instance.experience.setAppView('main-menu')
        })

        close.addEventListener('click', () => instance.experience.setAppView(instance.currentDataView))
    }

    settingsOpenClose() {
        const open = document.querySelector('#open-settings')
        const back = document.querySelector('#back-from-settings')

        open.addEventListener('click', () => instance.experience.setAppView('settings'))
        back.addEventListener('click', () => instance.experience.setAppView('main-menu'))
    }

    faqOpenClose() {
        const open = document.querySelector('#open-faq')
        const back = document.querySelector('#back-from-faq')

        open.addEventListener('click', () => instance.experience.setAppView('faq'))
        back.addEventListener('click', () => instance.experience.setAppView('main-menu'))
    }

    eventListeners() {
        instance.menuOpenClose()
        instance.settingsOpenClose()
        instance.faqOpenClose()

        const languageBtn = document.querySelector('#app-language button')
        const languageItems = document.querySelectorAll('#app-language li')

        languageBtn.addEventListener('click', () => {
            languageBtn.parentElement.classList.add('is-open')
        })

        languageItems.forEach((language) => {
            language.addEventListener('click', () => {
                _lang.updateLanguage(language.getAttribute('data-id'))
            })
        })

        document.addEventListener('click', (e) => {
            if (!languageBtn.contains(e.target)) {
                languageBtn.parentElement.classList.remove('is-open')
            }
        })

        const videoQualityItems = document.querySelectorAll('#app-video-quality button')

        videoQualityItems.forEach((item) => {
            item.addEventListener('click', () => {
                instance.videoQuality = item.getAttribute('data-id')
                localStorage.setItem('videoQuality', instance.videoQuality)
                document.querySelector('#app-video-quality').setAttribute('data-quality', instance.videoQuality)
            })
        })

        const soundEFX = document.querySelector('#SFX-setting')
        soundEFX.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                instance.soundOn = true
                soundEFX.querySelector('label').innerText = _s.settings.on
            } else {
                instance.soundOn = false
                soundEFX.querySelector('label').innerText = _s.settings.off
            }
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
    }

    updateUI = async () => {
        instance.logInLogOut.login = instance.experience.auth0.isAuthenticated
        instance.logInLogOut.logout = !instance.experience.auth0.isAuthenticated

        const loginBtn = document.querySelector('#login-button')
        const logoutBtn = document.querySelector('#logout-button')

        const loginText = document.querySelector('[aria-label="Logged in"]')
        const loginUser = document.querySelector('[aria-label="User"]')
        const loginRole = document.querySelector('[aria-label="Role"]')

        if (loginBtn) {
            loginBtn.disabled = instance.logInLogOut.login
            logoutBtn.disabled = instance.logInLogOut.logout

            loginText.innerText = instance.experience.auth0.isAuthenticated ? _s.settings.loggedInAs : _s.settings.notLoggedIn
            loginUser.innerText = instance.experience.auth0.userData?.name || ''
            loginRole.innerText = instance.experience.auth0.isAuthenticated && document.body.classList.contains('ak_leder') ? '(' + _s.settings.mentor + ')' : ''
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
