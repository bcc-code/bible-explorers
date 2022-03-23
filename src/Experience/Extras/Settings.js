import Experience from "../Experience.js"

let settings = null

export default class Settings {
    constructor() {
        this.experience = new Experience()
        settings = this

        settings.el = document.getElementById("settings")
        settings.el.addEventListener("mousedown", settings.openSettings)
    }

    openSettings() {
        console.log('Open Settings')
    }
}