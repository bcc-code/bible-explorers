import _lang from '../Utils/Lang.js'

let wpApiUrl_staging = "https://staging-bcckids.kinsta.cloud/wp-json"
let wpApiUrl_production = "https://biblekids.io/wp-json"

let getBiexChapters = () => wpApiUrl_production + "/biex-chapters/get?lang=" + _lang.getLanguageCode()
let isAkLeder = (personId) => wpApiUrl_production + '/is-ak-leder/' + personId + "?test=123"
let apiJsonLocalPath = () => "api/biex-chapters-" + _lang.getLanguageCode() + ".json"

export default { getBiexChapters, isAkLeder, apiJsonLocalPath }