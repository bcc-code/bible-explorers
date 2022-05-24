import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'

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
        if (document.querySelector('.modal')) {
            settings.modal.destroy()
        }
        else {
            let html = `
                <div class="modal__content settings">
                    <div class="settings__header heading"><h1>${_s.settings.title}</h1></div>
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
                        <a class="feedback settings__item" href="https://uservoice.bcc.no/" target="blank">
                            <p>${_s.settings.feedback}</p>
                            <i class="icon icon-envelope-solid"></i>
                        </a>
                        <div class="login settings__footer">
                            <button id="button__login" class="button" disabled="${!settings.logInLogOut.login}"><span>${_s.settings.logIn}</span></button>
                            <button id="button__logout" class="button" disabled="${!settings.logInLogOut.logout}"><span>${_s.settings.logOut}</span></button>
                        </div>
                    </div>
                </div>
            `;

            settings.modal = new Modal(html)

            settings.el = {
                soundToggle: document.querySelector(".sound input[type=checkbox]"),
                currentLang: document.querySelector(".language .language__current"),
                languageList: document.querySelector(".language .language__list"),
                languages: document.querySelectorAll(".language .language__list li"),
                login: document.getElementById("button__login"),
                logout: document.getElementById("button__logout")
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

            settings.updateUI()
        }
    }

    toggleSound() {
        settings.soundOn = this.checked

    }

    toggleLanguageList() {
        settings.el.languageList.classList.toggle("hide")
    }

    updateUI = async () => {
        settings.logInLogOut.login = this.experience.auth0.isAuthenticated
        settings.logInLogOut.logout = !this.experience.auth0.isAuthenticated

        if (settings.el.login) {
            settings.el.login.disabled = settings.logInLogOut.login
            settings.el.logout.disabled = settings.logInLogOut.logout
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