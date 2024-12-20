import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import Button from '../Components/Button.js'
import Frame from '../Components/Frame.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'
import gsap from 'gsap'

let instance = null

export default class MineField {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.offline = new Offline()
        instance.isFirstRender = true
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.minefield
        instance.currentCell = () => instance.traveledPath[instance.traveledPath.length - 1]
        instance.traveledPath = ['31']
        instance.correctPath = ['41', '42', '43', '33', '34', '24', '14', '15']

        instance.isCorrectCell = (selectedCell) =>
            instance.correctPath[instance.currentQuestionIndex] == selectedCell
        instance.isLastCorrectCell = (selectedCell) =>
            selectedCell == instance.correctPath[instance.correctPath.length - 1]

        instance.experience.setAppView('task-description')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`

        instance.setHTML()

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHTML() {
        instance.currentQuestionIndex = 0

        if (!document.querySelector('#quiz-content')) {
            const mineFieldLeftFrame = new Frame({
                content: `<h5 class="game-title">${_s.miniGames.minefield}</h5>
                    <div class="minefield__content">
                        <div class="minefield__grid" data-index="${instance.currentQuestionIndex}"></div>
                        <div class="finish-line">
                            <div class="finish-left"></div>
                            <div class="finish-middle"></div>
                            <div class="finish-right"></div>
                        </div>
                    </div>`,
            })
            const mineFieldRightFrame = new Frame({
                content: `<div id="quiz-content">
                        <div id="quiz__question"></div>
                    </div>`,
            })
            const staticHTML = `<div class="minefield" id="minefield">
                <div class="task-container left">
                    ${mineFieldLeftFrame.getHtml()}
                </div>
                <div class="task-container right">
                    ${mineFieldRightFrame.getHtml()}
                </div>
            </div>`

            instance.experience.interface.tasksDescription.innerHTML = staticHTML
        }

        if (!instance.data.length) return

        instance.setHTMLForQuestion(instance.currentQuestionIndex)
        instance.setHTMLForMineField(instance.currentQuestionIndex)
        instance.useCorrectAssetsSrc(instance.currentQuestionIndex)
        instance.attachEventListeners()
    }

    setHTMLForQuestion(index) {
        const question = instance.data[index]
        const questionContent =
            question.type === 'text' || question.type === 'text_image'
                ? `<p>${question.question_text}</p>`
                : `<div id="task-image"><img src="${question.question_image}" alt="Question Image" /></div>`

        let answersHTML = ''
        const colors = ['button-green.png', 'button-red.png', 'button-blue.png']

        question.answers.forEach((answer, index) => {
            const bulletIcon = `url('games/minefield/${colors[index % colors.length]}')`

            if (question.type === 'text') {
                answersHTML += `<div><div class="bg-cover" style="background-image: ${bulletIcon};"></div> <p>${answer.answer_text}<p></div>`
            } else if (question.type === 'image') {
                answersHTML += `<img src="${answer.answer_image}" alt="Answer Image" />`
            } else if (question.type === 'text_image') {
                answersHTML += `<div><div class="bg-cover" style="background-image: ${bulletIcon};"></div><img src="${answer.answer_image}" alt="Answer Image" /></div>`
            }
        })

        const questionHTML = `
            <div class="question">
                ${questionContent}
                <div class="quiz__answers">${answersHTML}</div>
            </div>`

        const quizContentContainer = document.querySelector('#quiz__question')
        quizContentContainer.innerHTML = questionHTML
    }

    setHTMLForMineField() {
        let tableHTML = ''

        const currentCell = instance.currentCell()

        instance.cellColors = {}

        // Get coordinates of the current cell
        const row = parseInt(currentCell[0])
        const col = parseInt(currentCell[1])

        // Find adjacent cells (right, top, bottom, left)
        let adjacentCells = {
            right: `${row}${col + 1}`, // forward (red)
            top: `${row - 1}${col}`, // top (green)
            bottom: `${row + 1}${col}`, // bottom (blue)
            left: `${row}${col - 1}`, // fallback (green or blue)
        }

        // Filter out invalid cells and prioritize forward movement (right, top, bottom)
        let availableCells = []
        Object.keys(adjacentCells).forEach((key) => {
            const cell = adjacentCells[key]
            if (isValidCell(cell) && !instance.traveledPath.includes(cell)) {
                availableCells.push({ position: key, cell })
            }
        })

        // If there are fewer than 3 unvisited cells, include visited cells
        if (availableCells.length < 3) {
            Object.keys(adjacentCells).forEach((key) => {
                const cell = adjacentCells[key]
                if (isValidCell(cell) && !availableCells.find((item) => item.cell === cell)) {
                    availableCells.push({ position: key, cell })
                }
            })
        }

        // Assign colors based on priority
        availableCells.forEach((available) => {
            if (available.position === 'right') {
                instance.cellColors[available.cell] = 'cell-red'
            } else if (available.position === 'top') {
                instance.cellColors[available.cell] = 'cell-green'
            } else if (available.position === 'bottom') {
                instance.cellColors[available.cell] = 'cell-blue'
            } else {
                // If neither top nor bottom is available, choose between blue and green
                const fallbackColor = instance.cellColors[adjacentCells.top] ? 'cell-blue' : 'cell-green'
                instance.cellColors[available.cell] = fallbackColor
            }
        })

        // Limit available cells to 3
        availableCells = availableCells.slice(0, 3)

        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 5; j++) {
                const currentCell = i.toString() + j.toString()

                tableHTML += `
                    <div class="cell flex justify-center items-center ${availableCells.find((item) => item.cell === currentCell) ? 'available-cell ' + (instance.cellColors[currentCell] || '') : ''}" 
                         data-cell="${currentCell}" 
                         ${instance.currentCell() == currentCell ? 'current-cell' : ''}
                         ${instance.traveledPath.includes(currentCell) ? 'visited-cell' : ''}
                    >
                    </div>`
            }
        }

        const cellsWrapper = document.querySelector('.minefield__grid')
        cellsWrapper.innerHTML = tableHTML

        if (instance.isFirstRender) {
            animateTiles()
            instance.isFirstRender = false
        }
    }

    useCorrectAssetsSrc(index) {
        const question = instance.data[index]

        if (question.question_image) {
            instance.offline.fetchChapterAsset(question, 'question_image', (data) => {
                const taskImage = document.querySelector('#task-image img')
                if (taskImage) taskImage.src = data.question_image
            })
        }

        question.answers.forEach((answer, index) => {
            if (!answer.answer_image) return

            instance.offline.fetchChapterAsset(answer, 'answer_image', (data) => {
                const answerAssetSelector =
                    question.type === 'image'
                        ? '.quiz__answers img:nth-child(' + (index + 1) + ')'
                        : '.quiz__answers div:nth-child(' + (index + 1) + ') img'

                const answer_image = document.querySelector(answerAssetSelector)
                if (answer_image) answer_image.src = data.answer_image
            })
        })
    }

    handleAnswer = (event) => {
        event.stopPropagation()

        const selectedCell = event.target.getAttribute('data-cell')
        const cellsWrapper = event.target.closest('.minefield__grid')

        cellsWrapper.querySelectorAll('.cell').forEach((btn) => (btn.disabled = true))

        // Ensure the selected answer matches the correct path for the current question index
        if (instance.isCorrectCell(selectedCell)) {
            instance.audio.playSound('correct')
            instance.traveledPath.push(selectedCell)

            if (instance.isLastCorrectCell(selectedCell)) {
                instance.experience.celebrate({ particleCount: 100, spread: 160 })

                // Repeat confetti every second
                const repeatConfetti = setInterval(() => {
                    instance.experience.celebrate({ particleCount: 100, spread: 160 })
                }, 1000)

                // Stop confetti after 5 seconds
                setTimeout(() => {
                    clearInterval(repeatConfetti)
                }, 5000)
            } else {
                instance.experience.celebrate({ particleCount: 100, spread: 160 })
            }

            setTimeout(() => {
                if (instance.isLastCorrectCell(selectedCell)) {
                    instance.setHTMLForMineField()
                    instance.handleQuizCompletion()
                } else {
                    instance.moveToNextQuestion()
                }
            }, 500)
        } else {
            instance.audio.playSound('minefield/haman')
            event.target.innerHTML = '<img src="games/minefield/haman.gif">'

            cellsWrapper.querySelectorAll('.cell').forEach((btn) => {
                btn.disabled = true
                btn.style.pointerEvents = 'none'
            })

            instance.showRestartButton()
        }
    }

    attachEventListeners() {
        // Attach event listeners to the available cells
        document.querySelectorAll('.available-cell').forEach((cell) =>
            cell.addEventListener('click', (event) => {
                instance.handleAnswer(event)
            })
        )
    }

    moveToNextQuestion() {
        instance.currentQuestionIndex += 1

        if (instance.currentQuestionIndex < instance.data.length) {
            instance.setHTMLForQuestion(instance.currentQuestionIndex)
            instance.setHTMLForMineField()
            instance.useCorrectAssetsSrc(instance.currentQuestionIndex)
            instance.attachEventListeners()
        } else {
            instance.handleQuizCompletion()
        }
    }

    handleQuizCompletion() {
        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = `<h2 class="text-center">${_s.miniGames.winRound}!</h2>`

        // Remove all colored cells (available-cell classes) at the end of the game
        const allCells = document.querySelectorAll('.available-cell')
        allCells.forEach((cell) => {
            cell.classList.remove('available-cell', 'cell-blue', 'cell-red', 'cell-green')
        })

        instance.experience.navigation.next.innerHTML = ''
    }

    showRestartButton() {
        const tryAgainBtn = new Button({
            content: _s.miniGames.tryAgain,
            id: 'restart-quiz',
        })
        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = tryAgainBtn.getHtml()

        document.getElementById('restart-quiz').addEventListener('click', () => {
            instance.restartQuiz()
        })
    }

    restartQuiz() {
        instance.currentQuestionIndex = instance.traveledPath.length - 1 // Adjust the question index based on where they resume

        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = '<div id="quiz__question"></div>'

        instance.setHTMLForQuestion(instance.currentQuestionIndex)
        instance.setHTMLForMineField()
        instance.useCorrectAssetsSrc(instance.currentQuestionIndex)
        instance.attachEventListeners()
    }

    destroy() {
        document.querySelector('#minefield')?.remove()

        instance.experience.setAppView('chapter')
        instance.isFirstRender = true

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}

// Helper function to check if a cell is valid (inside the grid)
function isValidCell(cell) {
    const row = parseInt(cell[0])
    const col = parseInt(cell[1])
    return row >= 1 && row <= 5 && col >= 1 && col <= 5
}

function animateTiles() {
    const cells = document.querySelectorAll('.cell')

    const tl = gsap.timeline()

    tl.fromTo(
        cells,
        { opacity: 0, scale: 0 }, // starting state: hidden and scaled down
        {
            opacity: 1,
            scale: 1, // final state: fully visible and normal size
            duration: 0.1, // Shorter duration for each animation
            stagger: {
                grid: [5, 5], // 5x5 grid
                from: 'start', // start from top-left
                amount: 0.8, // Shorter total stagger duration for a faster effect
            },
            ease: 'power2.out', // Smooth easing for the animation
        }
    )
}
