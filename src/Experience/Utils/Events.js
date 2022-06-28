const ACTIONS = {
    NOTE_PLAYED: 'notePlayed',
    TIME_ELAPSED: 'timeElapsed'
}

const EVENTS = {
    NOTE_PLAYED: new Event('notePlayed'),
    TIME_ELAPSED: new Event('timeElapsed')
}

export default { ACTIONS, EVENTS }