import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'

let settings = null

export default class Settings {
    constructor() {
        this.experience = new Experience()
        settings = this

        settings.soundOn = false
        settings.logInLogOut = {
            login: false,
            logout: false
        }
        settings.el = document.getElementById("settings")
        settings.el.addEventListener("mousedown", settings.toggleSettings)
    }

    toggleSettings() {
        if (document.querySelector('.modal')) {
            settings.modal.destroy()
        }
        else {
            let html = `
                <div class="modal__content settings">
                    <div class="settings__header heading"><div class="icon"><i></i></div><h2>${ _s.settings }</h2></div>
                    <div class="settings__content">
                        <div class="sound settings__item">
                            <p>${ _s.soundEffects }</p>
                            <label class="switch">
                                <input type="checkbox" ${ settings.soundOn ? 'checked' : '' }>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="language settings__item">
                            <p>${ _s.language }</p>
                            <div class="language__picker">
                                <div class="language__current">${ _lang.getLanguageName() }</div>
                                <ul class="language__list hide">${ _lang.getLanguagesList() }</ul>
                            </div>
                        </div>
                        <div class="login settings__footer">
                            <button id="btn-login" disabled="${ !settings.logInLogOut.login }">${ _s.logIn }</button>
                            <button id="btn-logout" disabled="${ !settings.logInLogOut.logout }">${ _s.logOut }</button>
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
                login: document.getElementById("btn-login"),
                logout: document.getElementById("btn-logout")
            }

            settings.el.soundToggle.addEventListener("change", settings.toggleSound)
            settings.el.currentLang.addEventListener("mousedown", settings.toggleLanguageList)
            settings.el.login.addEventListener("mousedown", settings.login)
            settings.el.logout.addEventListener("mousedown", settings.logout)

            settings.el.languages.forEach(function(language) {
                language.addEventListener("mousedown", () => {
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