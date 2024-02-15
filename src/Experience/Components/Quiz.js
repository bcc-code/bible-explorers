import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class Quiz {
    constructor() {
        instance = this
        instance.experience = new Experience()
    }

    toggleQuiz() {
        instance.world = instance.experience.world
        instance.selectedChapter = instance.world.selectedChapter
        instance.debug = instance.experience.debug
        instance.program = instance.world.program
        instance.audio = instance.world.audio

        instance.correctAnswers = 0
        instance.openQuestions = 0
        instance.questions = instance.program.getCurrentStepData().quiz

        instance.experience.navigation.next.innerHTML = _s.miniGames.skip
        instance.experience.navigation.next.className = 'button-normal less-focused'

        instance.quizHTML()
        instance.setEventListeners()
    }

    quizHTML() {
        const quizContainer = _gl.elementFromHtml('<div class="p-2 xl:p-4 tv:p-8 bg-bke-darkpurple h-full relative group/quiz" id="quiz-container"></div>')
        const quizWrapper = _gl.elementFromHtml(`<div id="quiz-wrapper"></div>`)

        quizWrapper.setAttribute('data-question', 0)

        instance.questions.forEach((q, qIdx) => {
            const container = _gl.elementFromHtml(`<div class="quiz-item ${qIdx === 0 ? 'block' : 'hidden'}" data-index="${qIdx}"></div>`)
            const question = _gl.elementFromHtml(`<h1 class="text-2xl tv:text-3xl font-bold">${q.question}</h1>`)

            container.append(question)

            if (q.answers.length) {
                q.answers.forEach((a, aIdx) => {
                    const answer = _gl.elementFromHtml(`
                        <div>
                            <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}" class="sr-only"/>
                            <label for="question-${qIdx}_answer-${aIdx}" class="bg-bke-purple flex items-center gap-2 px-3 py-2 xl:gap-4 xl:px-4 tv:gap-8 tv:px-8 tv:py-4 mt-4 cursor-pointer transition xl:hover:shadow-hover">
                                <div class="text-lg tv:text-2xl font-bold border-2 border-bke-orange rounded-full w-8 h-8 tv:w-12 tv:h-12 grid place-items-center">${aIdx + 1}</div>
                                <p class="text-lg tv:text-2xl">${a.answer}</p>
                            </label>
                        </div>
                    `)

                    container.append(answer)
                })
            } else {
                // Add a textarea when there are no answers
                instance.openQuestions++

                const selfAnswer = _gl.elementFromHtml(`
                    <div>
                        <textarea rows="8" placeholder="${q.placeholder}" class="w-full text-bke-purple px-3 py-2 rounded-md outline-none my-4 xl:my-6 tv:my-8 text-xl tv:text-2xl"></textarea>
                    </div>
                `)

                container.append(selfAnswer)
            }

            quizWrapper.append(container)
        })

        const quizNavigation = _gl.elementFromHtml(`<div id="quiz-navigation" class="${instance.questions.length == 1 ? 'hidden' : 'flex gap-4 xl:gap-6 tv:gap-8 absolute bottom-2 left-2 xl:left-4 xl:bottom-4 tv:left-8 tv:bottom-8'}"></div>`)

        instance.prevQuestion = _gl.elementFromHtml(
            `<button class="button-normal" disabled>
                <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#arrow-left-long-solid" fill="currentColor"></use></svg>
            </button>`
        )

        instance.nextQuestion = _gl.elementFromHtml(
            `<button class="button-normal" disabled>
                <svg class="h-3 w-3 tv:h-5 tv:w-5"><use href="#arrow-right-long-solid" fill="currentColor"></use></svg>
            </button>`
        )

        instance.submitQuiz = _gl.elementFromHtml(`<button type="submit" class="button-normal shadow-border absolute bottom-2 right-2 xl:right-4 xl:bottom-4 tv:right-8 tv:bottom-8" disabled>${_s.task.submit}</button>`)

        quizNavigation.append(instance.prevQuestion)
        quizNavigation.append(instance.nextQuestion)

        quizContainer.append(quizWrapper)
        quizContainer.append(quizNavigation)
        quizContainer.append(instance.submitQuiz)

        instance.experience.interface.bigScreen.append(quizContainer)
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const questionItems = document.querySelectorAll('.quiz-item')

        questionItems.forEach((item) => {
            const options = item.querySelectorAll('label')

            options.forEach((option, idx) => {
                option.addEventListener('click', (e) => {
                    const currentQuestionIdx = e.target.closest('.quiz-item').getAttribute('data-index')
                    const correctAnswerIdx = instance.questions[currentQuestionIdx].answers.findIndex((item) => item.correct_wrong === true)

                    if (idx === correctAnswerIdx) {
                        e.target.closest('div').classList.add('shadow-correct')
                        instance.audio.playSound('correct')
                        instance.correctAnswers++
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

                        e.target.closest('.quiz-item').style.pointerEvents = 'none'

                        instance.nextQuestion.disabled = false
                    } else {
                        instance.audio.playSound('wrong')
                        e.target.closest('div').classList.add('shadow-wrong')

                        setTimeout(() => {
                            e.target.closest('div').classList.remove('shadow-wrong')
                        }, 800)
                    }
                })
            })
        })

        let questionIdx = document.querySelector('#quiz-wrapper').getAttribute('data-question')

        instance.nextQuestion.addEventListener('click', () => {
            const currentQuestion = document.querySelector(`.quiz-item[data-index="${questionIdx}"`)
            currentQuestion.className = 'quiz-item hidden'
            currentQuestion.nextElementSibling.className = 'quiz-item block'

            let isAnswered = false

            currentQuestion.nextElementSibling.querySelectorAll('input').forEach((input) => {
                if (input.checked) isAnswered = true
            })

            if (questionIdx < instance.questions.length) questionIdx++
            if (questionIdx === instance.questions.length - 1 || !isAnswered) instance.nextQuestion.disabled = true
            if (questionIdx > 0) instance.prevQuestion.disabled = false
        })

        instance.prevQuestion.addEventListener('click', () => {
            const currentQuestion = document.querySelector(`.quiz-item[data-index="${questionIdx}"`)
            currentQuestion.className = 'quiz-item hidden'
            currentQuestion.previousElementSibling.className = 'quiz-item block'

            if (questionIdx !== 0) questionIdx--
            if (questionIdx < instance.questions.length) instance.nextQuestion.disabled = false
            if (questionIdx === 0) instance.prevQuestion.disabled = true
        })

        const textarea = document.querySelector('.quiz-item textarea')

        if (textarea)
            textarea.addEventListener('input', (e) => {
                if (e.target.value.length > 0) instance.submitQuiz.disabled = false
            })

        instance.submitQuiz.addEventListener('click', () => {
            instance.saveAnswers()
            instance.destroy()
            instance.program.congrats.toggleSummary()

            // const message = _gl.elementFromHtml(`<p>${instance.correctAnswers + instance.openQuestions + ' / ' + questions.length}</p>`)
            // document.querySelector('.modal .summary').append(message)
        })
    }

    saveAnswers() {
        const answer = document.querySelector('#quiz-container textarea').value
        if (!answer) return

        const data = {
            taskTitle: 'Quiz',
            answer: [answer],
            chapterId: instance.selectedChapter.id,
            chapterTitle: instance.selectedChapter.title,
            language: _lang.getLanguageCode(),
        }

        fetch(_api.saveAnswer(), {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    destroy() {
        document.querySelector('#quiz-container')?.remove()
        instance.experience.navigation.next.className = 'button-normal shadow-border'
        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
    }
}
