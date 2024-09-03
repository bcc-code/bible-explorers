import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class MineField {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
        instance.offline = new Offline()
    }

    show() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.audio = instance.world.audio
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.minefield
        instance.currentCell = () => instance.traveledPath[instance.traveledPath.length - 1]
        instance.traveledPath = ['13']
        instance.correctPath = ['14', '24', '34', '33', '43', '42', '41', '51']
        instance.checkpointCell = '43'
        instance.finalCellReached = false;

        instance.experience.setAppView('task-description')
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = 'button button-arrow-skip'

        instance.setHTML()

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    setHTML() {
        instance.currentQuestionIndex = 0

        if (!document.querySelector('#quiz-content')) {
            const staticHTML = `
            <div class="absolute inset-0 task-container minefield biex-overlay" id="minefield">
                <div class="task-container_left">
                    <h5 class="game-title">Minefield</h5>
                    <div class="minefield__content">
                        <div class="finish-line">
                            <div class="finish-left"></div>
                            <div class="finish-middle"></div>
                            <div class="finish-right"></div>
                        </div>
                        <div class="minefield__grid" data-index="${instance.currentQuestionIndex}"></div>
                    </div>
                </div>
                <div class="task-container_right">
                    <div id="quiz-content">
                        <div id="quiz__question"></div>
                    </div>
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
            question.type === 'text'
                ? `<p>${question.question_text}</p>`
                : `<div id="task-image"><img src="${question.question_image}" alt="Question Image" /></div>`

        let answersHTML = ''
        const colors = ['button-green.png', 'button-red.png', 'button-blue.png']

        question.answers.forEach((answer, index) => {
            const bulletIcon = `url('games/minefield/${colors[index % colors.length]}')`

            answersHTML +=
                question.type === 'text'
                    ? `<div class=""><div class="bg-cover" style="background-image: ${bulletIcon};"></div> <p> ${answer.answer_text}<p></div>`
                    : `<img src="${answer.answer_image}" alt="Answer Image" />`
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

        for (let i = 5; i > 0; i--) {
            for (let j = 1; j <= 5; j++) {
                const cellIJ = instance.currentCell().split('')
                const currentCell = i.toString() + j.toString();

                tableHTML += `
                    <div class="cell flex justify-center items-center" data-cell="${currentCell}" 
                        ${instance.currentCell() == currentCell ? 'current-cell' : ''}
                        ${instance.traveledPath.includes(currentCell) ? 'visited-cell' : ''}
                        ${!instance.finalCellReached && i == cellIJ[0] && j + 1 == cellIJ[1] ? 'left-cell' : ''}
                        ${!instance.finalCellReached && i - 1 == cellIJ[0] && j == cellIJ[1] ? 'top-cell' : ''}
                        ${!instance.finalCellReached && i == cellIJ[0] && j - 1 == cellIJ[1] ? 'right-cell' : ''}
                    >
                        ${
                            instance.traveledPath.includes(currentCell) &&
                            instance.checkpointCell == currentCell
                                ? '<img src="games/minefield/star.gif">'
                                : ''
                        }
                    </div>`
            }
        }

        const cellsWrapper = document.querySelector('.minefield__grid')
        cellsWrapper.innerHTML = tableHTML
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
                const answer_image = document.querySelector(
                    '.quiz__answers img:nth-child(' + (index + 1) + ')'
                )
                if (answer_image) answer_image.src = data.answer_image
            })
        })
    }

    handleAnswer = (event) => {
        event.stopPropagation()

        const selectedCell = event.target.getAttribute('data-cell')
        const cellsWrapper = event.target.closest('.minefield__grid')

        cellsWrapper.querySelectorAll('.cell').forEach((btn) => (btn.disabled = true))

        if (instance.correctPath[instance.currentQuestionIndex] == selectedCell) {
            instance.audio.playSound('correct')
            instance.experience.celebrate({ particleCount: 100, spread: 160 })
            instance.traveledPath.push(selectedCell)

            setTimeout(() => {
                if (selectedCell === '51') {
                    instance.finalCellReached = true; 
                    instance.setHTMLForMineField(); 
                    instance.handleQuizCompletion(); 
                } else {
                    instance.moveToNextQuestion();
                }
            }, 500)
        } else {
            instance.audio.playSound('wrong')
            event.target.innerHTML = '<img src="games/minefield/haman.gif">'

            cellsWrapper.querySelectorAll('.cell').forEach((btn) => {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
            });

            instance.showRestartButton()
        }
    }

    attachEventListeners() {
        document.querySelectorAll('.cell[left-cell], .cell[top-cell], .cell[right-cell]').forEach((cell) =>
            cell.addEventListener('click', (event) => {
                instance.handleAnswer(event)
                cell.removeEventListener('click', instance.handleAnswer)
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
        quizContentContainer.innerHTML = '<h2 class="text-2xl text-center">Game completed!</h2>'

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = 'button button-arrow'
    }

    showRestartButton() {
        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = `
            <div class="text-center mt-4">
                <h2 class="text-2xl text-center mb-4">Try again!</h2>
                <button class="button button-rectangle-wide" id="restart-quiz">Restart Quiz</button>
            </div>
        `

        document.getElementById('restart-quiz').addEventListener('click', () => {
            instance.restartQuiz()
        })
    }

    restartQuiz() {
        // Reset necessary variables
        instance.currentQuestionIndex = 0
        instance.traveledPath = ['13'] // Reset traveled path to start

        const quizContentContainer = document.querySelector('#quiz-content')
        quizContentContainer.innerHTML = '<div id="quiz__question"></div>'

        instance.setHTMLForQuestion(instance.currentQuestionIndex)
        instance.setHTMLForMineField(instance.currentQuestionIndex)
        instance.useCorrectAssetsSrc(instance.currentQuestionIndex)
        instance.attachEventListeners()
    }

    destroy() {
        document.querySelector('#minefield')?.remove()

        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
