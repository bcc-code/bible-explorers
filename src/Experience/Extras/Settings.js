import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _appInsights from '../Utils/AppInsights.js'

let settings = null

export default class Settings {
    constructor() {
        this.experience = new Experience()
        settings = this

        settings.soundOn = true

        const defaultVideoQuality = 'high'
        settings.videoQuality = localStorage.getItem('videoQuality') || defaultVideoQuality
        settings.logInLogOut = {
            login: false,
            logout: false
        }

        settings.el = document.getElementById("settings")
        settings.el.addEventListener("click", settings.toggleSettings)

    }

    toggleSettings() {
        if (document.querySelector(".modal")) {
            settings.modal.destroy()
        }
        else {
            _appInsights.trackPageView({ name: "Settings" })

            let html = `
                <div class="modal__content settings">
                    <div class="settings__wrapper">
                        <h2 class="modal__heading">${_s.settings.title}</h2>
                        <div class="settings__content">
                            <div class="language settings__item">
                                <span>${_s.settings.language}</span>
                                <div class="language__picker">
                                    <div class="language__current">${_lang.getLanguageName()}</div>
                                    <ul class="language__list hide">${_lang.getLanguagesList()}</ul>
                                </div>
                            </div>
                            <div class="video-quality settings__item">
                                <span>${_s.settings.videoQuality.title}</span>
                                <div class="video-quality__picker">
                                    <div class="video-quality__current">${_s.settings.videoQuality[settings.videoQuality]}</div>
                                    <ul class="video-quality__list hide">
                                        <li data-id="low">${_s.settings.videoQuality.low}</li>
                                        <li data-id="medium">${_s.settings.videoQuality.medium}</li>
                                        <li data-id="high">${_s.settings.videoQuality.high}</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="sound settings__item">
                                <span>${_s.settings.soundEffects}</span>
                                <label class="switch">
                                    <input type="checkbox" ${settings.soundOn ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="faq__button settings__item">${_s.settings.faq}</div>
                            <a class="feedback settings__item" href="mailto:hello@biblekids.io" target="blank">
                                <span>${_s.settings.feedback}</span>
                                <i class="icon icon-envelope-solid"></i>
                            </a>
                        </div>
                        <div class="login settings__footer">
                            <span>
                                <span id="loggedIn"></span> 
                                <span id="userName"></span> 
                                <span id="userRole"></span>
                            </span>
                            <div class="button__actions">
                                <button id="login" class="button bg--fill px height rounded" disabled="${!settings.logInLogOut.login}">${_s.settings.logIn}</button>
                                <button id="logout" class="button bg--fill px height rounded" disabled="${!settings.logInLogOut.logout}">${_s.settings.logOut}</button>
                            </div>
                        </div>
                    </div>
                </div>
            
                <div class="copyright">Copyright 2022 © <a href="https://bcc.media" target="_blank">bcc.media</a> foundation</div>
            `;

            settings.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__settings')

            settings.el = {
                soundToggle: document.querySelector(".sound input[type=checkbox]"),
                currentLang: document.querySelector(".language .language__current"),
                languageList: document.querySelector(".language .language__list"),
                languages: document.querySelectorAll(".language .language__list li"),
                currentVideoQuality: document.querySelector(".video-quality .video-quality__current"),
                videoQualityList: document.querySelector(".video-quality .video-quality__list"),
                videoQualities: document.querySelectorAll(".video-quality .video-quality__list li"),
                login: document.getElementById("login"),
                logout: document.getElementById("logout"),
                loggedIn: document.getElementById("loggedIn"),
                userName: document.getElementById("userName"),
                userRole: document.getElementById("userRole"),
            }

            settings.el.currentLang.addEventListener("click", settings.toggleLanguageList)
            settings.el.currentVideoQuality.addEventListener("click", settings.toggleVideoQualityList)
            settings.el.soundToggle.addEventListener("change", settings.toggleSound)
            settings.el.login.addEventListener("click", settings.login)
            settings.el.logout.addEventListener("click", settings.logout)

            settings.el.languages.forEach(function (language) {
                language.addEventListener("click", () => {
                    _lang.updateLanguage(language.getAttribute('data-id'))
                })
            })

            settings.el.videoQualities.forEach(function (videoQuality) {
                videoQuality.addEventListener("click", () => {
                    settings.videoQuality = videoQuality.getAttribute('data-id')
                    settings.el.currentVideoQuality.textContent = _s.settings.videoQuality[settings.videoQuality]
                    localStorage.setItem('videoQuality', settings.videoQuality)
                    settings.el.videoQualityList.classList.toggle("hide")
                })
            })

            settings.toggleFaq()
            settings.updateUI()
        }
    }

    toggleLanguageList() {
        settings.el.videoQualityList.classList.add("hide")
        settings.el.languageList.classList.toggle("hide")
    }

    toggleVideoQualityList() {
        settings.el.languageList.classList.add("hide")
        settings.el.videoQualityList.classList.toggle("hide")
    }

    toggleSound() {
        settings.soundOn = this.checked
    }

    toggleFaq() {
        const button = document.querySelector('.faq__button')
        button.addEventListener('click', () => {

            if (document.querySelector(".modal")) {
                settings.modal.destroy()
            }

            const questions = Object.values(_s.faq.questions)
            const answers = Object.values(_s.faq.answers)

            let html = `
                <div class="modal__content faq">
                    <div class="faq__wrapper">
                        <h2 class="modal__heading">${_s.settings.faq}</h2>
                        <ol class="faq__list">`
            for (let i = 0; i < questions.length; i++) {
                html += `<li class="faq__item">
                            <p class="faq__question">${questions[i]}</p>
                            <p class="faq__answer">${answers[i]}</p>`
            }
            html += `</li>
                        </ol>
                    </div>
                </div>`

            const faq = new Modal(html)
            document.querySelector('.modal').classList.add('modal__faq')

        })

    }

    updateUI = async () => {
        settings.logInLogOut.login = this.experience.auth0.isAuthenticated
        settings.logInLogOut.logout = !this.experience.auth0.isAuthenticated

        if (settings.el.login) {
            settings.el.login.disabled = settings.logInLogOut.login
            settings.el.logout.disabled = settings.logInLogOut.logout

            settings.el.loggedIn.innerText = this.experience.auth0.isAuthenticated ? _s.settings.loggedInAs : _s.settings.notLoggedIn
            settings.el.userName.innerText = experience.auth0.userData?.name || ''
            settings.el.userRole.innerText = this.experience.auth0.isAuthenticated
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
}