const ACTIONS = {
    USER_DATA_FETCHED: 'userDataFetched',
    NOTE_PLAYED: 'notePlayed',
    TIME_ELAPSED: 'timeElapsed'
}

const EVENTS = {
    USER_DATA_FETCHED: new Event('userDataFetched'),
    NOTE_PLAYED: new Event('notePlayed'),
    TIME_ELAPSED: new Event('timeElapsed')
}

export default { ACTIONS, EVENTS }