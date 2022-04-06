import _lang from '../Utils/Lang.js'

const strings = {
    "no": {
        "journey": {
            "start": "Start tidsreise",
            "continue": "Fortsett tidsreise", 
            "restart": "Start reise på nytt",
            "congratulations": "Du har fullført tidsreisen for dette temaet!",
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