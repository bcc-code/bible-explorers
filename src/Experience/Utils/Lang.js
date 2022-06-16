
const defaultLang = "en"
const list = {
    "en": "English",
    "no": "Norsk",
    "de": "Deutsch",
    "nl": "Nederlands",
    "fr": "Français",
    "pl": "Polski",
    "ro": "Română",
    "es": "Español",
    "pt-pt": "Português",
    "it": "Italiano",
    "ru": "Русский",
    "fi": "Suomi"
}

let getLanguageCode = () => localStorage.getItem('lang') || defaultLang
let getLanguageName = () => list[getLanguageCode()]
let getLanguagesList = () => {
    let html = ''
    Object.entries(list).forEach(([code, language]) => {
        if (code == getLanguageCode()) return // Skip current language
        html += `<li data-id="${ code }">${ language }</li>`
    })
    return html
}
let updateLanguage = (newLang) => {
    localStorage.setItem('lang', newLang)
    window.location.reload();
}

export default { getLanguageCode, getLanguageName, getLanguagesList, updateLanguage }