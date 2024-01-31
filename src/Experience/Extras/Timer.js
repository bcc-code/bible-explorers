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

        const time = timer.getMinutesAndSeconds(minutes * 60)

        timer.htmlEl = _gl.elementFromHtml(`
            <div class="game-timer absolute bottom-4 2xl:bottom-8 left-1/2 -translate-x-1/2 button-normal">
                <span class="minutes">${time.minutes}</span>
                <div>:</div>
                <span class="seconds">${time.seconds}</span>
            </div>
        `)

        document.querySelector(container).appendChild(timer.htmlEl)

        timer.el = {
            minutes: timer.htmlEl.querySelector('.minutes'),
            seconds: timer.htmlEl.querySelector('.seconds'),
        }

        timer.start(minutes)
    }

    getMinutesAndSeconds(thisTimer = timer.remainingSeconds) {
        return {
            minutes: Math.floor(thisTimer / 60)
                .toString()
                .padStart(2, '0'),
            seconds: (thisTimer % 60).toString().padStart(2, '0'),
        }
    }

    updateInterfaceTime() {
        const time = timer.getMinutesAndSeconds()
        timer.el.minutes.textContent = time.minutes
        timer.el.seconds.textContent = time.seconds
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

            if (timer.remainingSeconds < 10) {
                document.dispatchEvent(_e.EVENTS.TIME_LAST_SECONDS)
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
