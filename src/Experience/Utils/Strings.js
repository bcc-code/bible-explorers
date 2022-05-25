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
        "conceptDescription": "Join our time travels and explore the book that can answer all questions",
        "introduction": "Children between 6-12 years old can now go unto fantastic journeys and experience the Bible in a completely new way - with Explorers.",
        "journey": {
            "start": "Start journey",
            "continue": "Continue journey",
            "restart": "Restart journey",
            "congrats": "Congratulations!",
            "completed": "You have completed chapter",
            "back": "Back",
            "attachments": "Attachments",
            "homescreen": "Go to homescreen"
        },
        "task": {
            "codeUnlock": "Code unlock",
            "taskDescription": "Task description",
            "questions": "Questions",
            "getTask": "Ready",
            "submit": "Submit",
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
            "video": "Play video",
            "iris": "Talk to Iris",
            "task": "Complete the task",
            "questions": "Answer the questions",
            "code": "Break the code",
            "sorting": "Sort the icons in the correct box"
        },
        "miniGames": {
            "sortingIcons": {
                "title": "Sort the icons in the correct box",
                "completed": {
                    "title": "Well done!",
                    "message": "You have completed the task! You can continue your journey"
                }
            },
            "cableConnect": {
                "title": "Cable connect game"
            },
            "reset": "Reset game",
            "continue": "Continue journey",
            "skip": "Skip"
        }
    },
    "no": {
        "loading": "Laster",
        "qualities": {
            "title": "Velg kvalitet",
            "low": "Lav (270p)",
            "medium": "Medium (540p)",
            "high": "Høy (1080p)"
        },
        "conceptDescription": "Bli med på tidsreisen og utforsk boka som kan besvare alle spørsmål",
        "introduction": "Nå kan barn i alderen 6-12 år bli med på fantastiske tidsreiser og oppleve Bibelen på en helt ny måte - med Explorers.",
        "journey": {
            "start": "Start tidsreise",
            "continue": "Fortsett tidsreise",
            "restart": "Start reise på nytt",
            "congrats": "Gratulerer!",
            "completed": "Du har fullført",
            "back": "Tilbake",
            "attachments": "Vedlegg",
            "homescreen": "Gå hjem"
        },
        "task": {
            "codeUnlock": "Skriv riktig tall",
            "taskDescription": "Oppgavebeskrivelse",
            "questions": "Spørsmål",
            "getTask": "Gå til oppgave",
            "submit": "Send",
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
            "video": "Spill av video",
            "iris": "Snakk med Iris",
            "task": "Fullfør oppgaven",
            "questions": "Svar på spørsmålene",
            "code": "Løs koden",
            "sorting": "Sorter ikonene i riktig boks"
        },
        "miniGames": {
            "sortingIcons": {
                "title": "Sorter ikonene i riktig boks",
                "completed": {
                    "title": "Bra jobba!",
                    "message": "Du har fullført oppgaven! Du kan nå gå videre i tidsreisen"
                }
            },
            "cableConnect": {
                "title": "Kabel spill"
            },
            "reset": "Start spill på nytt",
            "continue": "Fortsett reisen",
            "skip": "Fullfør"
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