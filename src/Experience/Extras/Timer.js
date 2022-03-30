let timer = null

export default class Timer {
    constructor() {
        timer = this
        timer.interval = null;
        timer.remainingSeconds = 0;
    }

    setMinutes(minutes) {
        if (document.querySelector('.timer')) return

        timer.minutes = minutes;

        timer.htmlEl = document.createElement("div");
        timer.htmlEl.classList.add("timer");
        timer.htmlEl.innerHTML = Timer.getHTML();
        document.body.appendChild(timer.htmlEl);
    
        timer.el = {
            minutes: timer.htmlEl.querySelector(".timer__part--minutes"),
            seconds: timer.htmlEl.querySelector(".timer__part--seconds"),
            control: timer.htmlEl.querySelector(".timer__btn--control")
        };
    
        timer.el.control.addEventListener("mousedown", () => {
            if (timer.interval === null) {
                timer.start();
            } else {
                timer.stop();
            }
        });

        timer.start(minutes);
    }
  
    updateInterfaceTime() {
        const minutes = Math.floor(timer.remainingSeconds / 60);
        const seconds = timer.remainingSeconds % 60;
    
        timer.el.minutes.textContent = minutes.toString().padStart(2, "0");
        timer.el.seconds.textContent = seconds.toString().padStart(2, "0");
    }
  
    updateInterfaceControls() {
        if (timer.interval === null) {
            timer.el.control.innerHTML = `<i class="fak fa-play-solid"></i>`;
            timer.el.control.classList.add("timer__btn--start");
            timer.el.control.classList.remove("timer__btn--stop");
            timer.el.control.style.opacity = 1;
        } else {
            timer.el.control.innerHTML = `<i class="fak fa-pause-solid"></i>`;
            timer.el.control.classList.add("timer__btn--stop");
            timer.el.control.classList.remove("timer__btn--start");
            timer.el.control.style.opacity = 0;
        }
    }
  
    start(minutes) {
        if (timer.remainingSeconds === 0) {
            timer.remainingSeconds = minutes * 60;
        }
        
        timer.interval = setInterval(() => {
            timer.remainingSeconds--;
            timer.updateInterfaceTime();
    
            if (timer.remainingSeconds === 0) {
                timer.stop();
            }
        }, 1000);
    
        timer.updateInterfaceControls();
    }
  
    stop() {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.updateInterfaceControls();
    }

    destroy() {
        timer.stop()

        setTimeout(function() { 
            timer.remainingSeconds = 0;
            timer.htmlEl.remove();
        }, 2500);
    }
    
    static getHTML() {
        return `
            <button type="button" class="timer__btn timer__btn--control timer__btn--start">
                <span class="material-icons">play_arrow</span>
            </button>
            <div class="timer__container">
                <span class="timer__part timer__part--minutes">0${timer.minutes}</span>
                <span class="timer__part">:</span>
                <span class="timer__part timer__part--seconds">00</span>
            </div>
        `;
    }
}