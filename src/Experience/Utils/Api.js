import _lang from '../Utils/Lang.js'

let wpApiUrl_staging = "https://staging-bcckids.kinsta.cloud/wp-json"
let wpApiUrl_production = "https://biblekids.io/wp-json"

let getBiexEpisodes = () => wpApiUrl_staging + "/biex-episodes/get?lang=" + _lang.getLanguageCode()
let isAkLeder = (personId) => wpApiUrl_staging + '/is-ak-leder/' + personId
let apiJsonLocalPath = () => "api/biex-episodes-" + _lang.getLanguageCode() + ".json"

export default { wpApiUrl_staging, getBiexEpisodes, isAkLeder, apiJsonLocalPath }