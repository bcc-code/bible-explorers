import _lang from '../Utils/Lang.js'

const strings = {
    "en": {
        "loading": "Loading",
        "qualities": {
            "title": "Choose quality",
            "low": "Low (270p)",
            "medium": "Medium (540p)",
            "high": "High (1080p)"
        },
        "conceptDescription": "Sunday school teachers and mentors will have a whole new tool that can captivate and involve children, bringing the Bible to life for them in a completely new way.",
        "introduction": "Children between 6-12 years old can now go unto fantastic journeys and experience the Bible in a completely new way - with Bible Kids Explorers.",
        "journey": {
            "start": "Start journey",
            "continue": "Continue journey", 
            "restart": "Restart journey",
            "congratulations": "You have completed this theme's journey!",
            "back": "Back"
        },
        "task": {
            "codeUnlock": "Code unlock",
            "taskDescription": "Task description",
            "questions": "Questions",
            "getTask": "Get task",
            "submit": "Submit"
        },
        "archive": "Archive",
        "info": "Info",
        "settings": {
            "title": "Settings",
            "soundEffects": "Sound effects",
            "language": "Language",
            "feedback": "Feedback",
            "logIn": "Log in",
            "logOut": "Log out"
        },
        "offline": {
            "availableOffline": "Available offline",
            "download": "Download",
            "downloading": "Downloading"
        },
        "tooltips": {
            "video": "Skip video",
            "iris": "Listen to task description from Iris",
            "task": "Complete the task",
            "questions": "Answer the questions",
            "code": "Break the code",
            "sorting": "Sort the icons in the correct box"
        }
    },
    "no": {
        "loading": "Loader",
        "qualities": {
            "title": "Velg kvalitet",
            "low": "Lav (270p)",
            "medium": "Medium (540p)",
            "high": "Høy (1080p)"
        },
        "conceptDescription": "Målet er å gi søndagsskolelærere og mentorer et helt nytt verktøy som kan fenge og engasjere barna på en måte som gjør Bibelen levende for dem.",
        "introduction": "Nå kan barn i alderen 6-12 år bli med på fantastiske tidsreiser og oppleve Bibelen på en helt ny måte - med Bible Kids Explorers.",
        "journey": {
            "start": "Start tidsreise",
            "continue": "Fortsett tidsreise", 
            "restart": "Start reise på nytt",
            "congratulations": "Du har fullført tidsreisen for dette temaet!",
            "back": "Tilbake"
        },
        "task": {
            "codeUnlock": "Code unlock",
            "taskDescription": "Oppgavebeskrivelse",
            "questions": "Spørsmål",
            "getTask": "Gå til oppgave",
            "submit": "Send"
        },
        "archive": "Arkiv",
        "info": "Info",
        "settings": {
            "title": "Innstillinger",
            "soundEffects": "Lydeffekter",
            "language": "Språk",
            "feedback": "Tilbakemelding",
            "logIn": "Logg inn",
            "logOut": "Logg ut"
        },
        "offline": {
            "availableOffline": "Tilgjengelig offline",
            "download": "Last ned",
            "downloading": "Laster ned"
        },
        "tooltips": {
            "video": "Hopp over video",
            "iris": "Hør på oppgavebeskrivelse fra Iris",
            "task": "Fullfør oppgaven",
            "questions": "Svar på spørsmålene",
            "code": "Løs koden",
            "sorting": "Sorter ikonene i riktig boks"
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