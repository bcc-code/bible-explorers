import _lang from './Lang.js'
import en from '../../locales/en.json'
import no from '../../locales/no.json'
import de from '../../locales/de.json'
import da from '../../locales/da.json'
import nl from '../../locales/nl.json'
import fr from '../../locales/fr.json'
import pl from '../../locales/pl.json'
import ro from '../../locales/ro.json'
import hu from '../../locales/hu.json'
import es from '../../locales/es.json'
import pt from '../../locales/pt-pt.json'
import it from '../../locales/it.json'
import ru from '../../locales/ru.json'
import fi from '../../locales/fi.json'
import tr from '../../locales/tr.json'

const languageMap = {
    en,
    no,
    de,
    da,
    nl,
    fr,
    pl,
    ro,
    hu,
    es,
    'pt-pt': pt,
    it,
    ru,
    fi,
    tr,
}

const getStrings = (strings = languageMap[_lang.getLanguageCode()]) => {
    let res = {}
    Object.entries(strings).forEach(([key, value]) => {
        res[key] = typeof value === 'object' ? getStrings(value) : value
    })
    return res
}

export default getStrings()
