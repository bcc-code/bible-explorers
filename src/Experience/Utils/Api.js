import _lang from '../Utils/Lang.js'

let wpApiUrl = "https://staging-bcckids.kinsta.cloud/wp-json"

let getBiexEpisodes = () => wpApiUrl + "/biex-episodes/get?lang=" + _lang.getLanguageCode()
let isAkLeder = (personId) => wpApiUrl + '/is-ak-leder/' + personId

let apiJsonLocalPath = () => "api/biex-episodes-" + _lang.getLanguageCode() + ".json"
let localEpisodePath = (episodeId) => "api/episodes/" + episodeId + "-" + _lang.getLanguageCode() + ".zip"

export default { wpApiUrl, getBiexEpisodes, isAkLeder, apiJsonLocalPath, localEpisodePath }