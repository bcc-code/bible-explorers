import _lang from './Lang.js'
import strings from './Languages.json'

const getStrings = (strings) => {
    let res = {}
    Object.entries(strings).forEach(([key, value]) => {
        res[key] = typeof value === 'object' ? getStrings(value) : value
    })
    return res
}

export default getStrings(strings[_lang.getLanguageCode()])
