import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _lang from '../Utils/Lang.js'
import _appInsights from '../Utils/AppInsights.js'

let settings = null

export default class Menu {
    constructor() {
        this.experience = new Experience()
        settings = this

        settings.soundOn = true
        settings.fullScreen = false

        const defaultVideoQuality = 'high'
        settings.videoQuality = localStorage.getItem('videoQuality') || defaultVideoQuality
        settings.logInLogOut = {
            login: false,
            logout: false
        }

        settings.init()
        settings.eventListeners()

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
        selectVQCurrent.innerText = _s.settings.videoQuality[settings.videoQuality]
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
        soundEFXToggle.querySelector('input').setAttribute(settings.soundOn ? 'checked' : '', '')
        soundEFXToggle.querySelector('.slider').innerText = settings.soundOn ? 'On' : 'Off'

        const fullScreenInput = document.querySelector('.fullscreen-toggle input')
        const fullScreenLabel = document.querySelector('.fullscreen-toggle .slider')

        fullScreenInput.checked = document.fullscreenElement !== null
        fullScreenLabel.innerText = !document.fullscreenElement ? 'Off' : 'On'

        const bibleExplorersGuide = document.querySelector('[aria-label="Bible epxlorers guide"')
        bibleExplorersGuide.querySelector('span').innerText = _s.howTo
        bibleExplorersGuide.setAttribute('href', `https://biblekids.io/${_lang.getLanguageCode()}/explorers/`)

        const faqHeader = document.querySelector('.faq .content h2')
        const faqList = document.querySelector('.faq .content ul')
        const faqQuestions = Object.values(_s.faq.questions)
        const faqAnswers = Object.values(_s.faq.answers)


        faqHeader.innerText = _s.settings.faq

        for (let i = 0; i < faqQuestions.length; i++) {
            const faqItem = _gl.elementFromHtml(`
                <li>
                    <p>${faqQuestions[i]}</p>
                    <p>${faqAnswers[i]}</p>
                </li>
            `)

            faqList.append(faqItem)
        }

    }

    eventListeners() {

        document.querySelector('[aria-label="Open menu"]').addEventListener('click', settings.openMenu)
        document.querySelector('[aria-label="Close menu"]').addEventListener('click', settings.closeMenu)

        const overlay = document.querySelector('.menu .overlay')
        overlay.addEventListener('click', settings.closeMenu)

        document.querySelector('[aria-label="FAQ"]').addEventListener('click', () => {
            settings.openFAQ()
            settings.closeMenu()
        })
        document.querySelector('[aria-label="Close FAQ"]').addEventListener('click', () => {
            settings.closeFAQ()
            settings.openMenu()
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
                settings.videoQuality = videoQuality.getAttribute('data-id')
                videoQualityBtn.textContent = _s.settings.videoQuality[settings.videoQuality]
                localStorage.setItem('videoQuality', settings.videoQuality)
                videoQualityBtn.parentElement.classList.toggle('is-open')
            })
        })

        const soundToggle = document.querySelector('[aria-label="Sound effects toggle"]');
        soundToggle.addEventListener('click', () => {
            settings.soundOn = soundToggle.querySelector('input[type="checkbox"]').checked
            const label = soundToggle.querySelector('.slider')
            label.innerText = settings.soundOn ? 'On' : 'Off'
        })

        const fullScreenToggle = document.querySelector('[aria-label="Full screen toggle"]');
        fullScreenToggle.addEventListener('click', () => {

            if (!document.fullscreenElement) {
                settings.fullScreen = true
                document.documentElement.requestFullscreen()
            } else if (document.exitFullscreen) {
                document.exitFullscreen()
                settings.fullScreen = false
            }

            const label = fullScreenToggle.querySelector('.slider')
            label.innerText = settings.fullScreen ? 'On' : 'Off'
        })

        const loginBtn = document.querySelector('[aria-label="Login button"]')
        const logoutBtn = document.querySelector('[aria-label="Logout button"]')

        loginBtn.addEventListener('click', settings.login)
        logoutBtn.addEventListener('click', settings.logout)



    }

    updateUI = async () => {

        settings.logInLogOut.login = this.experience.auth0.isAuthenticated
        settings.logInLogOut.logout = !this.experience.auth0.isAuthenticated

        const loginBtn = document.querySelector('[aria-label="Login button"]')
        const logoutBtn = document.querySelector('[aria-label="Logout button"]')

        const loginText = document.querySelector('[aria-label="Logged in"]')
        const loginUser = document.querySelector('[aria-label="User"]')
        const loginRole = document.querySelector('[aria-label="Role"]')

        if (loginBtn) {
            loginBtn.disabled = settings.logInLogOut.login
            logoutBtn.disabled = settings.logInLogOut.logout

            loginText.innerText = this.experience.auth0.isAuthenticated ? _s.settings.loggedInAs : _s.settings.notLoggedIn
            loginUser.innerText = experience.auth0.userData?.name || ''
            loginRole.innerText = this.experience.auth0.isAuthenticated
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

    openMenu() {
        const menu = document.querySelector('.menu')
        menu.classList.add('is-open');
    }

    closeMenu() {
        const menu = document.querySelector('.menu')
        menu.classList.remove('is-open');
    }

    openFAQ() {
        const menu = document.querySelector('.faq')
        menu.classList.add('is-open');
    }

    closeFAQ() {
        const menu = document.querySelector('.faq')
        menu.classList.remove('is-open');
    }

}