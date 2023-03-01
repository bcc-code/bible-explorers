const ACTIONS = {
    USER_DATA_FETCHED: 'userDataFetched',
    AUDIO_TASK_DESCRIPTION_ENDED: 'audioTaskDescriptionEnded',
    NOTE_PLAYED: 'notePlayed',
    TIME_ELAPSED: 'timeElapsed',
    STEP_TOGGLED: 'stepToggled'
}

const EVENTS = {
    USER_DATA_FETCHED: new Event('userDataFetched'),
    AUDIO_TASK_DESCRIPTION_ENDED: new Event('audioTaskDescriptionEnded'),
    NOTE_PLAYED: new Event('notePlayed'),
    TIME_ELAPSED: new Event('timeElapsed')
}

export default { ACTIONS, EVENTS }