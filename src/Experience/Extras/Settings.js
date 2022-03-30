import Experience from "../Experience.js"
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'

let settings = null

export default class Settings {
    constructor() {
        this.experience = new Experience()
        settings = this

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
                    <div class="settings__sidebar">
                        <div class="sound">
                            <h3>${ _s.sound }</h3>
                            <div class="toggle"></div>
                        </div>
                        <div class="language">
                            <h3>${ _s.language }</h3>
                            <div class="language__picker">
                                <div class="language__current">${ _lang.getLanguageName() }</div>
                                <ul class="language__list hide">${ _lang.getLanguagesList() }</ul>
                            </div>
                        </div>
                        <div class="feedback">
                            <h3>${ _s.feedback }</h3>
                            <i class="icon"></i>
                        </div>
                    </div>
                </div>
            `;

            settings.modal = new Modal(html)

            settings.el = {
                soundToggle: document.querySelector(".sound .toggle"),
                currentLang: document.querySelector(".language .language__current"),
                languageList: document.querySelector(".language .language__list"),
                languages: document.querySelectorAll(".language .language__list li")
            }

            settings.el.currentLang.addEventListener("mousedown", settings.toggleLanguageList)

            settings.el.languages.forEach(function(language) {
                language.addEventListener("mousedown", () => {
                    _lang.updateLanguage(language.getAttribute('data-id'))
                })
            })
        }
    }

    toggleLanguageList() {
        settings.el.languageList.classList.toggle("hide")
    }
}