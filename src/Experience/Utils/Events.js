const ACTIONS = {
    USER_DATA_FETCHED: 'userDataFetched',
    AUDIO_TASK_DESCRIPTION_ENDED: 'audioTaskDescriptionEnded',
    NOTE_PLAYED: 'notePlayed',
    TIME_ELAPSED: 'timeElapsed',
    TIME_LAST_SECONDS: 'timeLastSeconds',
    STEP_TOGGLED: 'stepToggled',
    GO_HOME: 'goHome',
}

const EVENTS = {
    USER_DATA_FETCHED: new Event('userDataFetched'),
    AUDIO_TASK_DESCRIPTION_ENDED: new Event('audioTaskDescriptionEnded'),
    NOTE_PLAYED: new Event('notePlayed'),
    TIME_ELAPSED: new Event('timeElapsed'),
    TIME_LAST_SECONDS: new Event('timeLastSeconds'),
    STEP_TOGGLED: new Event('stepToggled'),
    GO_HOME: new Event('goHome'),
}

export default { ACTIONS, EVENTS }
