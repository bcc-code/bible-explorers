import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'
import SortingGame from '../Games/SortingGame.js'
import CableConnectorGame from '../Games/CableConnectorGame.js'
import SimonSaysGame from '../Games/SimonSaysGame.js'
import FlipCards from '../Games/FlipCards.js'
import ChooseNewKing from '../Games/ChooseNewKing.js'
import HeartDefense from '../Games/HeartDefense.js'
import DavidsRefuge from '../Games/DavidsRefugeGame.js'
import MazeGame from '../Games/MazeGame.js'
import DuckGame from '../Games/DuckGame.js'
import CodeUnlock from './CodeUnlock.js'
import PianoTiles from '../Games/PianoTiles.js'

let instance = null

export default class GameDescription {
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
        instance.duckGame = new DuckGame()
        instance.codeUnlock = new CodeUnlock()
        instance.pianoTiles = new PianoTiles()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.details

        instance.experience.setAppView('task-description')

        instance.setHtml()

        if (instance.data.tutorial) {
            instance.useCorrectAssetsSrc()
        }

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHtml() {
        const container = _gl.elementFromHtml(
            `<div class="task-container" id="task-container">
                <div class="corner top-left"></div>
                <div class="edge top"></div>
                <div class="corner top-right"></div>
                <div class="edge left"></div>
                <div class="content">
                    <div class="task-content">
                        <h5 class="task-heading">
                            <div class="corner top-left"></div>
                            <div class="edge top"></div>
                            <div class="corner top-right"></div>
                            <div class="edge left"></div>
                            <div class="content">${instance.data.title}</div>
                            <div class="edge right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="edge bottom"></div>
                            <div class="corner bottom-right"></div>
                        </h5>
                        ${instance.data.prompts ? `<p class="task-prompts">${instance.data.prompts[0].prompt}</p>` : ''}
                        ${instance.data.tutorial ? `<div class="task-tutorial">${instance.getDomElement(instance.data.tutorial)}</div>` : ''}
                        <div class="task-actions">
                            <button class="button-grid">
                                <div class="corner top-left"></div>
                                <div class="edge top"></div>
                                <div class="corner top-right"></div>
                                <div class="edge left"></div>
                                <div class="content">${_s.miniGames.startGame}</div>
                                <div class="edge right"></div>
                                <div class="corner bottom-left"></div>
                                <div class="edge bottom"></div>
                                <div class="corner bottom-right"></div>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>`
        )

        const startGame = container.querySelector('button')
        startGame.addEventListener('click', instance.startGame)

        instance.experience.interface.tasksDescription.append(container)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
    }

    startGame() {
        instance.destroy()

        if (instance.program.taskType() == 'cables') {
            instance.cableConnectorGame.toggleCableConnector()
        } else if (instance.program.taskType() == 'sorting') {
            instance.sortingGame.toggleSortingGame()
        } else if (instance.program.taskType() == 'simon_says') {
            instance.simonSays.toggleSimonSays()
        } else if (instance.program.taskType() == 'flip_cards') {
            instance.flipCards.toggleGame()
        } else if (instance.program.taskType() == 'choose_new_king') {
            instance.chooseNewKing.toggleGame()
        } else if (instance.program.taskType() == 'heart_defense') {
            instance.heartDefense.toggleGame()
        } else if (instance.program.taskType() == 'davids_refuge') {
            instance.davidsRefuge.toggleGame()
        } else if (instance.program.taskType() == 'labyrinth') {
            instance.mazeGame.toggleGame()
        } else if (instance.program.taskType() == 'duck_game') {
            instance.duckGame.toggleGame()
        } else if (instance.program.taskType() == 'code_to_unlock') {
            instance.codeUnlock.toggleCodeUnlock()
        } else if (instance.program.taskType() == 'piano_tiles') {
            instance.pianoTiles.toggleGame()
        }
    }

    getDomElement(url) {
        const ext = url.split('.').pop().toLowerCase()
        if (['mp4', 'mov', 'webm'].includes(ext))
            return `<video src="${url}" width="100%" height="100%" frameBorder="0" autoplay loop></video>`
        else return `<img src="${url}" id="task-image" />`
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'tutorial', (data) => {
            const imageElement = document.querySelector('#task-image')
            if (imageElement) {
                // Check if the element exists
                imageElement.src = data.tutorial
            }
        })
    }

    destroy() {
        document.querySelector('#task-container')?.remove()
        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
