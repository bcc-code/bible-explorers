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
                    <div class="settings__header"><i></i><h1>${ _s.settings }</h1></div>
                    <div class="settings__content">
                        <div class="sound settings__item">
                            <h3>${ _s.soundEffects }</h3>
                            <label class="switch">
                                <input type="checkbox">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="language settings__item">
                            <h3>${ _s.language }</h3>
                            <div class="language__picker">
                                <div class="language__current">${ _lang.getLanguageName() }</div>
                                <ul class="language__list hide">${ _lang.getLanguagesList() }</ul>
                            </div>
                        </div>
                        <div class="feedback settings__item">
                            <h3>${ _s.feedback }</h3>
                        </div>
                        <div class="login settings__footer">
                            <button id="btn-login" disabled="true">${ _s.logIn }</button>
                            <button id="btn-logout" disabled="true">${ _s.logOut }</button>
                        </div>
                    </div>
                </div>
            `;

            settings.modal = new Modal(html)

            settings.el = {
                soundToggle: document.querySelector(".sound .toggle"),
                currentLang: document.querySelector(".language .language__current"),
                languageList: document.querySelector(".language .language__list"),
                languages: document.querySelectorAll(".language .language__list li"),
                login: document.getElementById("btn-login"),
                logout: document.getElementById("btn-logout")
            }

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

    toggleLanguageList() {
        settings.el.languageList.classList.toggle("hide")
    }

    updateUI = async () => {
        settings.el.logout.disabled = !this.experience.auth0.isAuthenticated
        settings.el.login.disabled = this.experience.auth0.isAuthenticated
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