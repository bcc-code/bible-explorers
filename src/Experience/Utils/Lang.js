
const defaultLang = "en"
const languagesList = {
    "en": "English",
    "no": "Norsk",
    "de": "Deutsch",
    "da": "Dansk",
    "nl": "Nederlands",
    "fr": "Français",
    "pl": "Polski",
    "ro": "Română",
    "hu": "Magyar",
    "es": "Español",
    "pt-pt": "Português",
    "it": "Italiano",
    "ru": "Русский",
    "fi": "Suomi"
}
const threeLettersLang = {
    "no": "nor",
    "en": "eng",
    "nl": "nld",
    "de": "deu",
    "fr": "fra",
    "es": "spa",
    "fi": "fin",
    "ru": "rus",
    "pt-pt": "por",
    "ro": "ron",
    "tr": "tur",
    "pl": "pol",
    "hu": "hun",
    "it": "ita",
    "da": "dan"
}

let getLanguageCode = () => localStorage.getItem('lang') || defaultLang
let get3LettersLang = () => threeLettersLang[getLanguageCode()] ?? getLanguageCode()
let getLanguageName = () => languagesList[getLanguageCode()]
let getLanguagesList = () => {
    let html = ''
    Object.entries(languagesList).forEach(([code, language]) => {
        if (code == getLanguageCode()) return // Skip current language
        html += `<li data-id="${code}">${language}</li>`
    })
    return html
}
let updateLanguage = (newLang) => {
    localStorage.setItem('lang', newLang)
    window.location.reload();
}

export default { getLanguageCode, get3LettersLang, getLanguageName, getLanguagesList, updateLanguage }