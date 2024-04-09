import _lang from "../Utils/Lang.js";

const wpApiUrl_production = "https://biblekids.io/wp-json";
const wpApiUrl_staging = "https://staging-bcckids.kinsta.cloud/wp-json";
const wpApiUrl_local = "https://bcckids.local/wp-json";
const wpApiUrl = getWpApiUrl();

const getBiexChapters = () =>
  wpApiUrl + "/biex-chapters/get?lang=" + _lang.getLanguageCode();
const getRoles = (personId) => wpApiUrl_production + "/roles/" + personId;
const saveAnswer = () => wpApiUrl + "/answer/save";

export default { getBiexChapters, getRoles, saveAnswer };

function getWpApiUrl() {
  switch (window.location.hostname) {
    case "explorers.biblekids.io":
    case "zealous-ground-0c9103f03-3d.1.azurestaticapps.net":
    case "zealous-ground-0c9103f03-3d.westeurope.1.azurestaticapps.net":
      return wpApiUrl_production;

    case "localhost":
      return wpApiUrl_staging;
      return wpApiUrl_local;

    default:
      return wpApiUrl_staging;
  }
}
