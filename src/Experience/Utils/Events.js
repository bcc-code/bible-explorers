const ACTIONS = {
    USER_DATA_FETCHED: 'userDataFetched',
    AUDIO_TASK_DESCRIPTION_ENDED: 'audioTaskDescriptionEnded',
    NOTE_PLAYED: 'notePlayed',
    TIME_ELAPSED: 'timeElapsed',
    TIME_LAST_SECONDS: 'timeLastSeconds',
    STEP_TOGGLED: 'stepToggled',
    GO_HOME: 'goHome',
    VIDEO_LOADED: 'videoLoaded',
    ROUTE_CHANGED: 'routeChanged',
    SONG_LOADED: 'songLoaded',
    SONG_ENDED: 'songEnded',
}

const EVENTS = {
    USER_DATA_FETCHED: new Event('userDataFetched'),
    AUDIO_TASK_DESCRIPTION_ENDED: new Event('audioTaskDescriptionEnded'),
    NOTE_PLAYED: new Event('notePlayed'),
    TIME_ELAPSED: new Event('timeElapsed'),
    TIME_LAST_SECONDS: new Event('timeLastSeconds'),
    STEP_TOGGLED: new Event('stepToggled'),
    GO_HOME: new Event('goHome'),
    VIDEO_LOADED: new Event('videoLoaded'),
    ROUTE_CHANGED: (query) => new CustomEvent('routeChanged', { detail: query }),
    SONG_LOADED: new Event('songLoaded'),
    SONG_ENDED: new Event('songEnded'),
}

export default { ACTIONS, EVENTS }
