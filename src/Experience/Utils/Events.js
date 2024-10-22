const ACTIONS = {
    USER_DATA_FETCHED: 'userDataFetched',
    CHAPTER_STARTED: 'chapterStarted',
    VIDEO_LOADED: 'videoLoaded',
    STEP_TOGGLED: 'stepToggled',
    NOTE_PLAYED: 'notePlayed',
    TIME_ELAPSED: 'timeElapsed',
    TIME_LAST_SECONDS: 'timeLastSeconds',
    ROUTE_CHANGED: 'routeChanged',
    LOADING_SONG: 'loadingSong',
    SONG_LOADED: 'songLoaded',
    SONG_ENDED: 'songEnded',
    BG_MUSIC_LOADED: 'bgMusicLoaded',
    GO_HOME: 'goHome',
}

const EVENTS = {
    USER_DATA_FETCHED: new Event('userDataFetched'),
    CHAPTER_STARTED: new Event('chapterStarted'),
    VIDEO_LOADED: new Event('videoLoaded'),
    STEP_TOGGLED: new Event('stepToggled'),
    NOTE_PLAYED: new Event('notePlayed'),
    TIME_ELAPSED: new Event('timeElapsed'),
    TIME_LAST_SECONDS: new Event('timeLastSeconds'),
    ROUTE_CHANGED: (query) => new CustomEvent('routeChanged', { detail: query }),
    LOADING_SONG: new Event('loadingSong'),
    SONG_LOADED: new Event('songLoaded'),
    SONG_ENDED: new Event('songEnded'),
    BG_MUSIC_LOADED: new Event('bgMusicLoaded'),
    GO_HOME: new Event('goHome'),
}

export default { ACTIONS, EVENTS }
