import Offline from '../Utils/Offline.js'
import Experience from "../Experience"
import _s from "../Utils/Strings.js"
import _gl from "../Utils/Globals.js"
import _e from "../Utils/Events.js"
import SortingGame from '../Games/SortingGame.js'
import CableConnectorGame from '../Games/CableConnectorGame.js'
import SimonSaysGame from '../Games/SimonSaysGame.js'
import FlipCards from "../Games/FlipCards.js"
import ChooseNewKing from "../Games/ChooseNewKing.js"
import HeartDefense from '../Games/HeartDefense.js'
import DavidsRefuge from '../Games/DavidsRefugeGame.js'
import MazeGame from '../Games/MazeGame.js'

let instance = null

export default class Task {
    constructor() {
        instance = this

        instance.experience = new Experience()
        instance.debug = instance.experience.debug

        // Setup
        instance.offline = new Offline()
        instance.sortingGame = new SortingGame()
        instance.cableConnectorGame = new CableConnectorGame()
        instance.simonSays = new SimonSaysGame()
        instance.flipCards = new FlipCards()
        instance.chooseNewKing = new ChooseNewKing()
        instance.heartDefense = new HeartDefense()
        instance.davidsRefuge = new DavidsRefuge()
        instance.mazeGame = new MazeGame()

    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.details

        instance.setHtml()

        if (instance.data.tutorial) {
            // Fetch details tutorial from blob or url
            instance.offline.fetchChapterAsset(instance.data, "tutorial", (data) => {
                instance.program.updateAssetInProgramData('details', data)
                document.querySelector('.game-tutorial > *').src = data.tutorial
            })
        }

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHtml() {
        const startGame = _gl.elementFromHtml(`
            <button class="btn default focused pulsate">${_s.miniGames.startGame}</button>
        `)
        startGame.addEventListener('click', instance.startGame)

        const task = _gl.elementFromHtml(`
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
                            ${instance.data.prompts ? instance.data.prompts[0].prompt : ''}
                        </div>
                    </div>
                </div>
                <div class="overlay"></div>
            </section>
        `)

        task.querySelector('.content').append(startGame)
        document.querySelector('.ui-container').append(task)

        instance.experience.navigation.next.classList.remove('focused')

        if (instance.debug.developer || instance.debug.onPreviewMode()) {
            instance.experience.navigation.next.innerHTML = _s.miniGames.skip
            instance.experience.navigation.container.style.display = 'flex'
        } else {
            instance.experience.navigation.container.style.display = 'none'
        }

    }

    startGame() {
        instance.destroy()

        if (instance.program.taskType() == 'cables') {
            instance.cableConnectorGame.toggleCableConnector()
        }

        else if (instance.program.taskType() == 'sorting') {
            instance.sortingGame.toggleSortingGame()
        }

        else if (instance.program.taskType() == 'simon_says') {
            instance.simonSays.toggleSimonSays()
        }

        else if (instance.program.taskType() == 'flip_cards') {
            instance.flipCards.toggleGame()
        }

        else if (instance.program.taskType() == 'choose_new_king') {
            instance.chooseNewKing.toggleGame()
        }

        else if (instance.program.taskType() == 'heart_defense') {
            instance.heartDefense.toggleGame()
        }

        else if (instance.program.taskType() == 'davids_refuge') {
            instance.davidsRefuge.toggleGame()
        }

        else if (instance.program.taskType() == 'labyrinth') {
            instance.mazeGame.toggleGame()
        }
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()

        if (['mp4', 'mov', 'webm'].includes(ext)) return `<video src="" width="100%" height="100%" frameBorder="0" autoplay loop></video>`
        else return `<img src="" width="100%" height="100%" />`
    }

    destroy() {
        document.querySelector('section.task')?.remove()

        instance.experience.navigation.next.classList.add('focused')
        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
    }
}