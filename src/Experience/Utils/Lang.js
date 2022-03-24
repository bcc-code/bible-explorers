
const defaultLang = "no"
const list = {
    "no": "Norsk",
    "en": "English"
}

let getLanguageCode = () => localStorage.getItem('lang') || defaultLang
let getLanguageName = () => list[getLanguageCode()]
let getLanguagesList = () => {
    let html = ''
    Object.entries(list).forEach(([code, language]) => {
        html += `<li data-id="${ code }">${ language }</li>`
    })
    return html
}
let updateLanguage = (newLang) => {
    localStorage.setItem('lang', newLang)
    window.location.reload();
}

export default { getLanguageCode, getLanguageName, getLanguagesList, updateLanguage }