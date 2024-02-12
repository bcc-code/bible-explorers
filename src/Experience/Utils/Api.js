import _lang from './Lang.js'

const wpApiUrl_production = 'https://biblekids.io/wp-json'
const wpApiUrl_staging = 'https://staging-bcckids.kinsta.cloud/wp-json'
const wpApiUrl_local = 'https://bcckids.local/wp-json'
const wpApiUrl = getWpApiUrl()

const getBiexChapters = () => wpApiUrl + '/biex-chapters/get?lang=' + _lang.getLanguageCode()
const getRoles = (personId) => wpApiUrl_production + '/roles/' + personId
const saveAnswer = () => wpApiUrl + '/answer/save'

export default { getBiexChapters, getRoles, saveAnswer }

function getWpApiUrl() {
    switch (window.location.hostname) {
        case 'explorers.biblekids.io':
            return wpApiUrl_production

        case 'zealous-ground-0c9103f03-develop.westeurope.1.azurestaticapps.net':
            return wpApiUrl_staging

        case 'localhost':
            return wpApiUrl_production
            return wpApiUrl_local

        default:
            return wpApiUrl_production
    }
}
