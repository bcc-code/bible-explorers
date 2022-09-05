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
                    <div class="settings__header heading"><h2>${_s.settings.title}</h2></div>
                    <div class="settings__content">
                        <div class="modal__extras">
                            <span class="left"></span>
                            <span class="bottomLeft"></span>
                            <span class="bottomLeftSmall"></span>
                        </div>
                        <div class="sound settings__item">
                            <p>${_s.settings.soundEffects}</p>
                            <label class="switch">
                                <input type="checkbox" ${settings.soundOn ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="language settings__item">
                            <p>${_s.settings.language}</p>
                            <div class="language__picker">
                                <div class="language__current">${_lang.getLanguageName()}</div>
                                <ul class="language__list hide">${_lang.getLanguagesList()}</ul>
                            </div>
                        </div>
                        <a class="feedback settings__item" href="mailto:hello@biblekids.io" target="blank">
                            <p>${_s.settings.feedback}</p>
                            <i class="icon icon-envelope-solid"></i>
                        </a>
                        <div class="faq__button settings__item">
                            <p>${_s.settings.faq}</p>
                        </div>
                        <div class="login settings__footer">
                            <p><span id="loggedIn"></span> <span id="userName"></span> <span id="userRole"></span></p>
                            <div class="button__actions">
                                <button id="button__login" class="button" disabled="${!settings.logInLogOut.login}"><span>${_s.settings.logIn}</span></button>
                                <button id="button__logout" class="button" disabled="${!settings.logInLogOut.logout}"><span>${_s.settings.logOut}</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            settings.modal = new Modal(html)

            document.querySelector('.modal').classList.add('modal__settings')

            settings.el = {
                soundToggle: document.querySelector(".sound input[type=checkbox]"),
                currentLang: document.querySelector(".language .language__current"),
                languageList: document.querySelector(".language .language__list"),
                languages: document.querySelectorAll(".language .language__list li"),
                login: document.getElementById("button__login"),
                logout: document.getElementById("button__logout"),
                loggedIn: document.getElementById("loggedIn"),
                userName: document.getElementById("userName"),
                userRole: document.getElementById("userRole"),
            }

            settings.el.soundToggle.addEventListener("change", settings.toggleSound)
            settings.el.currentLang.addEventListener("click", settings.toggleLanguageList)
            settings.el.login.addEventListener("click", settings.login)
            settings.el.logout.addEventListener("click", settings.logout)

            settings.el.languages.forEach(function (language) {
                language.addEventListener("click", () => {
                    _lang.updateLanguage(language.getAttribute('data-id'))
                })
            })

            settings.toggleFaq()
            settings.updateUI()
        }
    }

    toggleSound() {
        settings.soundOn = this.checked
    }

    toggleLanguageList() {
        settings.el.languageList.classList.toggle("hide")
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
                    <div class="faq__header heading"><h2>${_s.settings.faq}</h2></div>
                    <div class="faq__content">
                        <div class="modal__extras">
                            <span class="left"></span>
                            <span class="bottomLeft"></span>
                            <span class="bottomLeftSmall"></span>
                        </div>
                        
                        <ol class="faq__list">`
                        for (let i=0; i<questions.length; i++) {
                            html +=  `<li class="faq__item">
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