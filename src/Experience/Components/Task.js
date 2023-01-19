import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"

export default class Task {
    constructor() {

        instance = this
        instance.experience = new Experience()

        instance.init()
    }

    init() {

    }

}