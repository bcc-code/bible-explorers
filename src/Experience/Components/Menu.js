import Experience from "../Experience.js"
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
        instance.fullScreen = false

        const defaultVideoQuality = 'high'
        instance.videoQuality = localStorage.getItem('videoQuality') || defaultVideoQuality
        instance.logInLogOut = {
            login: false,
            logout: false
        }

        instance.init()
        instance.eventListeners()

    }

    init() {
        _appInsights.trackPageView({ name: "Settings" })

        const selectLang = document.querySelector('.select-language')
        const selectLangLabel = selectLang.querySelector('.label')
        const selectLangCurrent = selectLang.querySelector('button')
        const selectLangDropdown = selectLang.querySelector('ul')

        selectLangLabel.innerText = _s.settings.language
        selectLangCurrent.innerText = _lang.getLanguageName()
        selectLangDropdown.innerHTML = _lang.getLanguagesList()


        const selectVQ = document.querySelector('.select-video-quality')
        const selectVQLabel = selectVQ.querySelector('.label')
        const selectVQCurrent = selectVQ.querySelector('button')
        const selectVQDropdown = selectVQ.querySelector('ul')

        selectVQLabel.innerText = _s.settings.videoQuality.title
        selectVQCurrent.innerText = _s.settings.videoQuality[instance.videoQuality]
        selectVQDropdown.querySelectorAll('li').forEach(item => {
            const li = item.getAttribute('data-id')

            if (li === 'low') {
                item.innerText = _s.settings.videoQuality.low
            } else if (li === 'medium') {
                item.innerText = _s.settings.videoQuality.medium
            } else if (li === 'high') {
                item.innerText = _s.settings.videoQuality.high
            }
        })

        const soundEFX = document.querySelector('.sound-effects')
        const soundEFXLabel = soundEFX.querySelector('.label')
        const soundEFXToggle = soundEFX.querySelector('[aria-label="Sound effects toggle"]')

        soundEFXLabel.innerText = _s.settings.soundEffects
        soundEFXToggle.querySelector('input').setAttribute(instance.soundOn ? 'checked' : '', '')
        soundEFXToggle.querySelector('.slider').innerText = instance.soundOn ? 'On' : 'Off'

        const fullScreenInput = document.querySelector('.fullscreen-toggle input')
        const fullScreenLabel = document.querySelector('.fullscreen-toggle .slider')

        fullScreenInput.checked = document.fullscreenElement !== null
        fullScreenLabel.innerText = !document.fullscreenElement ? 'Off' : 'On'

        const bibleExplorersGuide = document.querySelector('[aria-label="Guide"]')
        bibleExplorersGuide.querySelector('span').innerText = _s.howTo
        bibleExplorersGuide.setAttribute('href', `https://biblekids.io/${_lang.getLanguageCode()}/explorers/`)

    }

    eventListeners() {

        document.querySelector('[aria-label="Open menu"]').addEventListener('click', instance.open)
        document.querySelector('[aria-label="Close menu"]').addEventListener('click', instance.close)

        document.querySelector('.menu .overlay').addEventListener('click', instance.close)
        document.querySelector('.faq .overlay').addEventListener('click', instance.experience.faq.close)

        document.querySelector('[aria-label="FAQ"]').addEventListener('click', () => {
            instance.experience.faq.open()
            instance.close()
        })
        document.querySelector('[aria-label="Close FAQ"]').addEventListener('click', () => {
            instance.experience.faq.close()
            instance.open()
        })

        const languageBtn = document.querySelector('[aria-label="current language"]')
        const languageItems = document.querySelectorAll('.select-language .dropdown li')

        languageBtn.addEventListener('click', () => {
            languageBtn.parentElement.classList.toggle('is-open')
        })

        languageItems.forEach(function (language) {
            language.addEventListener("click", () => {
                _lang.updateLanguage(language.getAttribute('data-id'))
            })
        })

        const videoQualityBtn = document.querySelector('[aria-label="current video quality"]')
        const videoQualityItems = document.querySelectorAll('.select-video-quality .dropdown li')

        videoQualityBtn.addEventListener('click', () => {
            videoQualityBtn.parentElement.classList.toggle('is-open')
        })

        videoQualityItems.forEach(function (videoQuality) {
            videoQuality.addEventListener("click", () => {
                instance.videoQuality = videoQuality.getAttribute('data-id')
                videoQualityBtn.textContent = _s.settings.videoQuality[instance.videoQuality]
                localStorage.setItem('videoQuality', instance.videoQuality)
                videoQualityBtn.parentElement.classList.toggle('is-open')
            })
        })

        const soundToggle = document.querySelector('[aria-label="Sound effects toggle"]');
        soundToggle.addEventListener('click', () => {
            instance.soundOn = soundToggle.querySelector('input[type="checkbox"]').checked
            const label = soundToggle.querySelector('.slider')
            label.innerText = instance.soundOn ? 'On' : 'Off'
        })

        const fullScreenToggle = document.querySelector('[aria-label="Full screen toggle"]');
        fullScreenToggle.addEventListener('click', () => {

            if (!document.fullscreenElement) {
                instance.fullScreen = true
                document.documentElement.requestFullscreen()
            } else if (document.exitFullscreen) {
                document.exitFullscreen()
                instance.fullScreen = false
            }

            const label = fullScreenToggle.querySelector('.slider')
            label.innerText = instance.fullScreen ? 'On' : 'Off'
        })

        const loginBtn = document.querySelector('[aria-label="Login button"]')
        const logoutBtn = document.querySelector('[aria-label="Logout button"]')

        loginBtn.addEventListener('click', instance.login)
        logoutBtn.addEventListener('click', instance.logout)


    }

    updateUI = async () => {

        instance.logInLogOut.login = instance.experience.auth0.isAuthenticated
        instance.logInLogOut.logout = !instance.experience.auth0.isAuthenticated

        const loginBtn = document.querySelector('[aria-label="Login button"]')
        const logoutBtn = document.querySelector('[aria-label="Logout button"]')

        const loginText = document.querySelector('[aria-label="Logged in"]')
        const loginUser = document.querySelector('[aria-label="User"]')
        const loginRole = document.querySelector('[aria-label="Role"]')

        if (loginBtn) {
            loginBtn.disabled = instance.logInLogOut.login
            logoutBtn.disabled = instance.logInLogOut.logout

            loginText.innerText = instance.experience.auth0.isAuthenticated ? _s.settings.loggedInAs : _s.settings.notLoggedIn
            loginUser.innerText = instance.experience.auth0.userData?.name || ''
            loginRole.innerText = instance.experience.auth0.isAuthenticated
                ? document.body.classList.contains("ak_leder")
                    ? '(' + _s.settings.mentor + ')'
                    : '(' + _s.settings.noRole + ')'
                : ''
        }
    }

    login = async () => {
        await this.experience.auth0.loginWithRedirect({
            redirect_uri: window.location.origin
        })
    }

    logout = () => {
        this.experience.auth0.logout({
            returnTo: window.location.origin
        })
    }

    open() {
        document.querySelector('.menu').classList.add('is-open');
    }

    close() {
        document.querySelector('.menu').classList.remove('is-open');
    }

}