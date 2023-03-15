import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'

let timer = null

export default class Timer {
    constructor() {
        timer = this
        timer.interval = null
        timer.remainingSeconds = 0
    }

    setMinutes(minutes, container) {
        if (document.querySelector('.timer')) return

        timer.minutes = minutes

        timer.htmlEl = _gl.elementFromHtml(`
            <div class="game-timer">
                <span class="minutes">${timer.minutes}</span>
                <div>:</div>
                <span class="seconds">00</span>
            </div>
        `)

        document.querySelector(container).appendChild(timer.htmlEl)

        timer.el = {
            minutes: timer.htmlEl.querySelector(".minutes"),
            seconds: timer.htmlEl.querySelector(".seconds")
        }

        timer.start(minutes)
    }

    updateInterfaceTime() {
        const minutes = Math.floor(timer.remainingSeconds / 60)
        const seconds = timer.remainingSeconds % 60

        timer.el.minutes.textContent = minutes.toString().padStart(2, "0")
        timer.el.seconds.textContent = seconds.toString().padStart(2, "0")
    }

    start(minutes) {
        if (timer.remainingSeconds === 0) {
            timer.remainingSeconds = minutes * 60
        }

        timer.interval = setInterval(() => {
            timer.remainingSeconds--
            timer.updateInterfaceTime()

            if (timer.remainingSeconds === 0) {
                timer.stop()
                document.dispatchEvent(_e.EVENTS.TIME_ELAPSED)
            }
        }, 1000)
    }

    stop() {
        clearInterval(timer.interval)
        timer.interval = null
    }

    destroy() {
        if (!timer) return
        timer.stop()
        timer.remainingSeconds = 0
        timer.htmlEl.remove()
    }

}