import _lang from '../Utils/Lang.js'

const strings = {
    "no": {
        "introduction": "Nå kan barn i alderen 6-12 år bli med på fantastiske tidsreiser og oppleve Bibelen på en helt ny måte - med Bible Kids Explorers.",
        "journey": {
            "seeAllChapters": "Gå til tidsreisene",
            "start": "Start tidsreise",
            "continue": "Fortsett tidsreise", 
            "restart": "Start reise på nytt",
            "congratulations": "Du har fullført tidsreisen for dette temaet!",
            "back": "Tilbake"
        },
        "codeUnlock": "Code unlock",
        "taskDescription": "Oppgavebeskrivelse",
        "questions": "Spørsmål",
        "getTask": "Gå til oppgave",
        "submit": "Send",
        "archive": "Arkiv",
        "info": "Info",
        "settings": "Innstillinger",
        "soundEffects": "Lydeffekter",
        "language": "Språk",
        "feedback": "Tilbakemelding",
        "logIn": "Logg inn",
        "logOut": "Logg ut",
        "offline": "Tilgjengelig offline",
        "download": "Last ned",
        "downloading": "Laster ned",
        "tooltips": {
            "video": "Skip video",
            "iris": "Hør på oppgavebeskrivelse fra Iris",
            "task": "Fullfør oppgaven",
            "questions": "Svar paa sporsmalene",
            "code": "Los koden"
        }
    },
    "en": {
        "introduction": "Children between 6-12 years old can now go unto fantastic journeys and experience the Bible in a completely new way - with Bible Kids Explorers.",
        "journey": {
            "seeAllChapters": "Go to all journeys",
            "start": "Start journey",
            "continue": "Continue journey", 
            "restart": "Restart journey",
            "congratulations": "You have completed this theme's journey!",
            "back": "Back"
        },
        "codeUnlock": "Code unlock",
        "taskDescription": "Task description",
        "questions": "Questions",
        "getTask": "Get task",
        "submit": "Submit",
        "archive": "Archive",
        "info": "Info",
        "settings": "Settings",
        "soundEffects": "Sound effects",
        "language": "Language",
        "feedback": "Feedback",
        "logIn": "Log in",
        "logOut": "Log out",
        "offline": "Available offline",
        "download": "Download",
        "downloading": "Downloading",
        "tooltips": {
            "video": "Watch video",
            "iris": "Listen task description from Iris",
            "task": "Complete the task",
        }
    }
}

const getStrings = (strings) => {
    let res = {}
    Object.entries(strings).forEach(([key, value]) => {
        res[key] = typeof value === "object"
            ? getStrings(value)
            : value
    })
    return res
}

export default getStrings(strings[_lang.getLanguageCode()])