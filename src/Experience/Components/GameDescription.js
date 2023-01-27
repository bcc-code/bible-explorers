import Offline from '../Utils/Offline.js'
import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"
import SortingGame from '../Games/SortingGame.js'
import CableConnectorGame from '../Games/CableConnectorGame.js'
import SimonSaysGame from '../Games/SimonSaysGame.js'
import FlipCards from "../Games/FlipCards.js"
import HeartDefense from '../Games/HeartDefense.js'
import DavidsRefuge from '../Games/DavidsRefugeGame.js'

let instance = null

export default class Task {
    constructor() {
        instance = this
        instance.offline = new Offline()
        instance.experience = new Experience()
        instance.sortingGame = new SortingGame()
        instance.cableConnectorGame = new CableConnectorGame()
        instance.simonSays = new SimonSaysGame()
        instance.flipCards = new FlipCards()
        instance.heartDefense = new HeartDefense()
        instance.davidsRefuge = new DavidsRefuge()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.details

        instance.setHtml()
        instance.setEventListeners()

        if (instance.data.tutorial) {
            // Fetch details tutorial from blob or url
            instance.offline.fetchChapterAsset(instance.data, "tutorial", (data) => {
                instance.program.updateAssetInProgramData('details', data)
                document.querySelector('.game-tutorial > *').src = data.tutorial
            })
        }
    }

    setHtml() {
        document.querySelector('.ui-container').append(
            _gl.elementFromHtml(`
                <section class="task">
                    <div class="container">
                        <div class="content">
                            <header class="game-header">
                                <h2>${instance.data.title}</h2>
                            </header>
                            <div class="game-tutorial">
                                ${instance.data.tutorial != '' ? instance.getDomElement(instance.data.tutorial) : ''}
                            </div>
                            <div class="game-description">
                                ${instance.data.prompts[0].prompt}
                            </div>
                        </div>
                    </div>
                </section>
            `)
        )
    }

    setEventListeners() {
        instance.experience.navigation.prev.addEventListener("click", instance.prevListeners)
        instance.experience.navigation.next.addEventListener("click", instance.nextListeners)
    }

    prevListeners() {
        instance.destroy()
        instance.program.previousStep()
    }

    nextListeners() {
        instance.destroy()
        instance.startGame()
    }

    startGame() {
        if (instance.program.taskType() == 'cables') {
            this.cableConnectorGame.toggleCableConnector()
        }

        else if (instance.program.taskType() == 'sorting') {
            this.sortingGame.toggleSortingGame()
        }

        else if (instance.program.taskType() == 'simon_says') {
            this.simonSays.toggleSimonSays()
        }

        else if (instance.program.taskType() == 'flip_cards') {
            this.flipCards.toggleGame()
        }

        else if (instance.program.taskType() == 'heart_defense') {
            this.heartDefense.toggleGame()
        }

        else if (instance.program.taskType() == 'davids_refuge') {
            this.davidsRefuge.toggleGame()
        }
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()

        if (['mp4', 'mov', 'webm'].includes(ext)) return `<video src="" width="100%" height="100%" style="position:absolute" frameBorder="0" autoplay loop></video>`
        else return `<img src="" width="100%" height="100%" style="position:absolute" />`
    }

    removeEventListeners() {
        instance.experience.navigation.prev.removeEventListener("click", instance.prevListeners)
        instance.experience.navigation.next.removeEventListener("click", instance.nextListeners)
    }

    destroy() {
        document.querySelector('.ui-container > .task')?.remove()
        instance.removeEventListeners()
    }
}