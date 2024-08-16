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
            <div class="absolute inset-0 task-container biex-overlay" id="minefield">
                <div class="task-container_box ">
                    <h5 class="task-container_heading">Minefield</h1>
                    <div id="quiz-content">
                        <div id="quiz__question"></div>
                        <div id="minefield__table" class="ml-auto">
                            <div class="minefield__finish-line"></div>
                            <div class="minefield__cells-wrapper" data-index="${instance.currentQuestionIndex}"></div>
                        </div>
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
                ? `<h3 class="font-bold">${question.question_text}</h3>`
                : `<div class="task-container_image" id="task-image"><img class="max-w-[580px]" src="${question.question_image}" alt="Question Image" /></div>`


        let answersHTML = ''
        const colors = ['button-green.png', 'button-red.png', 'button-blue.png'];

        question.answers.forEach((answer, index) => {
            const bulletIcon = `url('games/minefield/${colors[index % colors.length]}')`;

            answersHTML +=
                question.type === 'text'
                    ? `<div class="flex flex-col justify-center items-center gap-2 lg:gap-4"><div class="w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-cover" style="background-image: ${bulletIcon};"></div> <p class="text-xl lg:text-2xl captialize"> ${answer.answer_text}<p></div>`
                    : `<img class="max-w-[280px]" src="${answer.answer_image}" alt="Answer Image" />`
        })


        const questionHTML = `
            <div class="question">
                ${questionContent}
                <div class="quiz__answers flex my-4 lg:my-6 xl:my-8 gap-4 lg:gap-6 xl:gap-8">${answersHTML}</div>
            </div>`

        const quizContentContainer = document.querySelector('#quiz__question')
        quizContentContainer.innerHTML = questionHTML
    }

    setHTMLForMineField() {
        let tableHTML = ''

        for (let i = 5; i > 0; i--) {
            for (let j = 1; j <= 5; j++) {
                const cellIJ = instance.currentCell().split('')

                tableHTML += `
                    <div class="cell flex justify-center items-center" data-cell="${i}${j}" 
                        ${instance.currentCell() == i.toString() + j.toString() ? 'current-cell' : ''}
                        ${instance.traveledPath.includes(i.toString() + j.toString()) ? 'visited-cell' : ''}
                        ${i == cellIJ[0] && j + 1 == cellIJ[1] ? 'left-cell' : ''}
                        ${i - 1 == cellIJ[0] && j == cellIJ[1] ? 'top-cell' : ''}
                        ${i == cellIJ[0] && j - 1 == cellIJ[1] ? 'right-cell' : ''}
                    >
                        ${instance.traveledPath.includes(i.toString() + j.toString()) &&
                        instance.checkpointCell == i.toString() + j.toString()
                        ? '<img src="games/minefield/star.gif">'
                        : ''
                    }
                    </div>`
            }
        }

        const cellsWrapper = document.querySelector('.minefield__cells-wrapper')
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
        const cellsWrapper = event.target.closest('.minefield__cells-wrapper')

        cellsWrapper.querySelectorAll('.cell').forEach((btn) => (btn.disabled = true))

        if (instance.correctPath[instance.currentQuestionIndex] == selectedCell) {
            instance.audio.playSound('correct')
            instance.experience.celebrate({ particleCount: 100, spread: 160 })
            instance.traveledPath.push(selectedCell)

            setTimeout(() => {
                instance.moveToNextQuestion()
            }, 500)
        } else {
            instance.audio.playSound('wrong')
            event.target.innerHTML = '<img src="games/minefield/haman.gif">'
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

    destroy() {
        document.querySelector('#minefield')?.remove()

        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}
