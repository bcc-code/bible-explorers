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
        this.currentVideo = this.currentStep in data ? data[this.currentStep].video : null
        this.totalSteps = Object.keys(data).length

        this.clickedObject = null
        this.canClick = true

        console.log(this.currentStep);
        console.log(this.currentStep in data);

    }

    // Click events
    control(currentIntersect) {
        if (!this.canClick) return

        this.clickedObject = currentIntersect.name

        if (this.isNextStep()) {
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

    isNextStep() {
        return this.currentStep in data &&
            data[this.currentStep].clickableElements.includes(this.clickedObject) 
    }

    isPreviousStep() {
        return this.progress.includes(this.clickedObject)
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
            this.toggleVideo()
        }

        if (this.clickedObject === 'Panel_Green_button') {
            let video = this.getVideo()
            if (video) video.play()
        }

        if (this.clickedObject === 'Panel_Red_button') {
            let video = this.getVideo()
            if (video) video.pause()
        }
    }

    toggleVideo() {
        
        let video = this.getVideo()

        if (video && video.paused) {
            video.play()
        } else {
            video.pause()
        }
    }

    getVideo() {
        return this.currentVideo
            ? this.world.video.mediaItems[0].item.image
            : null
    }

    updateLocalStorage() {
        this.progress.push(this.clickedObject)
        localStorage.setItem('progress', JSON.stringify([...new Set(this.progress)]))
    }

    updateProgressBar() {

    }
}