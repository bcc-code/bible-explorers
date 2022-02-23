import Experience from "../Experience.js"
import Archive from '../Extras/Archive.js'
import Timer from '../Extras/Timer.js'
import CodeUnlock from '../Extras/CodeUnlock.js'
import data from "./program.json";

export default class Program {
    constructor() {
        this.experience = new Experience()
        this.archive = new Archive()
        this.timer = new Timer()
        this.codeUnlock = new CodeUnlock()
        this.video = this.experience.video

        this.progress = JSON.parse(localStorage.getItem('progress')) || []
        this.currentStep = this.progress.length
        this.totalSteps = Object.keys(data).length

        this.clickedObject = null
        this.canClick = false
    }

    // Click events
    control(currentIntersect) {
        if (!this.canClick) return

        this.clickedObject = currentIntersect

        if (this.isCurrentStep()) {
            this.currentStep++
            this.experience.progressBar.update()
            this.startAction()
            this.updateLocalStorage()
            this.updateProgressBar()
        }
        else if (this.isPreviousStep()) {
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
        return this.currentStep in data &&
            data[this.currentStep].clickableElements.includes(this.clickedObject.name) 
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