import _lang from '../Utils/Lang.js'

const strings = {
    "no": {
        "journey": {
            "start": "Start tidsreise",
            "continue": "Fortsett tidsreise", 
            "restart": "Start reise på nytt",
            "congratulations": "Du har fullført tidsreisen for dette temaet!",
        },
        "archive": "Arkiv",
        "info": "Info",
        "settings": "Innstillinger",
        "sound": "Lyd",
        "language": "Språk",
        "feedback": "Tilbakemelding",
        "tooltips": {
            "video": "Se på video",
            "iris": "Hør på oppgavebeskrivelse fra Iris",
            "task": "Fullfør oppgaven",
        }
    },
    "en": {
        "journey": {
            "start": "Start journey",
            "continue": "Continue journey", 
            "restart": "Restart journey",
            "congratulations": "You have completed this theme's journey!",
        },
        "archive": "Archive",
        "info": "Info",
        "settings": "Settings",
        "sound": "Sound",
        "language": "Language",
        "feedback": "Feedback",
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