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
        this.world = this.experience.world

        this.progress = JSON.parse(localStorage.getItem('progress')) || []
        this.currentStep = this.progress.length
        this.totalSteps = Object.keys(data).length

        this.clickedObject = null
        this.canClick = true
    }

    // Click events
    control(currentIntersect) {
        if (!this.canClick) return

        this.clickedObject = currentIntersect.name

        if (this.isCurrentStep()) {
            this.currentStep++
            this.world.progressBar.refresh()
            this.startAction()
            this.updateLocalStorage()
            this.updateProgressBar()
        }
        else if (this.isPreviousStep()) {
            this.startAction()
        }
    }

    startAction() {
        if (this.clickedObject === 'tv_4x4') {
        }

        if (this.clickedObject === 'tv_4x5') {
        }

        if (this.clickedObject === 'tv_16x10') {
        }

        if (this.clickedObject === 'tv_16x9_5') {
        }

        if (this.clickedObject === 'Panel_Screen') {
            this.timer.setMinutes(5)
            this.codeUnlock.open()
        }
        if (this.clickedObject === 'Portal') {
            if (this.world.video.paused) {
                this.world.video.play()
            } else {
                this.world.video.pause()
            }
        }
    }

    isCurrentStep() {
        return this.currentStep in data &&
            data[this.currentStep].clickableElements.includes(this.clickedObject) 
    }

    isPreviousStep() {
        return this.progress.includes(this.clickedObject)
    }

    updateLocalStorage() {
        this.progress.push(this.clickedObject)
        localStorage.setItem('progress', JSON.stringify([...new Set(this.progress)]))
    }

    updateProgressBar() {

    }
}