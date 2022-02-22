import Experience from "./Experience.js"
import Archive from './Archive.js'
import Timer from './Timer.js'
import CodeUnlock from './CodeUnlock.js'
import program from "./program.json";

export default class Program {
    constructor() {
        this.experience = new Experience()
        this.archive = new Archive()
        this.timer = new Timer()
        this.codeUnlock = new CodeUnlock()
        this.video = this.experience.video

        this.progress = JSON.parse(localStorage.getItem('progress')) || []
        this.currentStep = this.progress.length
        this.clickedObject = null
        this.canClick = true
    }

    // Click events
    control(currentIntersect) {
        if (!this.canClick) return

        this.clickedObject = currentIntersect
        console.log(currentIntersect.name);

        if (this.isCurrentStep(currentIntersect.name)) {
            console.log('isCurrentStep')
            this.currentStep++
            this.startAction()
            this.updateLocalStorage()
            this.updateProgressBar()
        }
        else if (this.isPreviousStep()) {
            console.log('isPreviousStep')
            this.startAction()
        }
    }

    startAction() {
        if (this.clickedObject.name === 'tv_4x4_screen') {
        }

        if (this.clickedObject.name === 'tv_4x5_screen') {
        }

        if (this.clickedObject.name === 'tv_16x9_5') {
        }

        if (this.clickedObject.name === 'Panel_Screen') {
            this.timer.setMinutes(5)
            this.codeUnlock.open()
        }

        if (this.clickedObject.name === 'Portal') {
            if (this.video.paused) {
                this.video.play()
            } else {
                this.video.pause()
            }
        }
    }

    isCurrentStep() {
        return program[this.currentStep].clickableElements.includes(this.clickedObject.name) 
    }

    isPreviousStep() {
        return this.progress.includes(this.clickedObject.name)
    }

    updateLocalStorage() {
        this.progress.push(this.clickedObject.name)
        localStorage.setItem('progress', JSON.stringify([...new Set(this.progress)]))
    }

    updateProgressBar() {

    }
}