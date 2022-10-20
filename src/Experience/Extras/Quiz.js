import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'

let quiz = null

export default class Quiz {
    constructor() {
        this.experience = new Experience()
        quiz = this
    }

    toggleQuiz() {
        if (document.querySelector('.modal__quiz')) {
            quiz.modal.destroy()
        }
        else {
            quiz.correctAnswers = 0

            let world = this.experience.world
            let debug = this.experience.debug
            let program = world.program
            let currentStep = program.currentStep
            let selectedChapter = world.selectedChapter

            const questions = selectedChapter.program[currentStep].quiz

            let html = `<div class="modal__content quiz">
                            <div class="quiz__content">`
            questions.forEach((q, qIdx) => {
                html += `<div class="question" data-index="${qIdx + 1}">
                            <div class="question__heading">
                                <div class="question__headingTop">
                                    <span class="question__label">Question ${qIdx + 1} / ${questions.length}</span>
                                    <div class="quiz__progressBar">
                                        <div class="quiz__progressLine"></div>
                                    </div>
                                </div>
                                <p class="question__title">${q.question}</p>
                            </div>
                            <div class="question__form">`

                if (q.answers.length) {
                    q.answers.forEach((a, aIdx) => {
                        html += `<div class="question__input">
                                    <input type="radio" id="question-${qIdx}_answer-${aIdx}" name="question-${qIdx}"/>
                                    <label for="question-${qIdx}_answer-${aIdx}">
                                        <span></span>
                                        ${a.answer}
                                        <div></div>
                                    </label>
                                </div>`
                    })
                }
                else {
                    html += `<div class="question__input">
                                <textarea id="quizTextarea" class="question__textarea" rows="8" placeholder="${q.placeholder}"></textarea>
                            </div>`
                }

                html += `</div>`

                if (q.picture) {
                    html += `<div class="question__picture" ><img src="${q.picture}"></div>`
                }

                html += `</div>`
            })

            html += `</div>
                        <div class="quiz__footer ${questions.length == 1 ? "hide - nav" : ""}">
                            <button id="prev" class="button width height border--5 border--solid border--transparent bg--secondary rounded--full | icon-arrow-left-long-solid"></button>
                            <button id="next" class="button width height border--5 border--solid border--transparent bg--secondary rounded--full pulsate | icon-arrow-right-long-solid"></button>
                        </div>
                    </div>`

            quiz.modal = new Modal(html, 'modal__quiz')

            const title = document.createElement('h3')
            title.className = 'modal__heading--minigame'
            title.innerText = 'Quiz'
            document.querySelector('.modal__quiz').prepend(title)

            const topbar = document.createElement('div')
            topbar.className = 'quiz__topbar'
            topbar.innerHTML = '<button class="archive button width height bg--secondary border--5 border--solid border--transparent rounded--full pulsate | icon-folder-solid"></button>'
            document.querySelector('.modal__quiz').prepend(topbar)

            const quizProgressBar = document.querySelectorAll('.quiz__progressLine')
            const quizStepWidth = 100 / questions.length

            quiz.htmlQuestions = document.querySelectorAll('.question')
            quiz.htmlQuestions[0].classList.add('visible')

            const quizContent = document.querySelector('.quiz__content')
            const quizStepsContainer = document.createElement('div')
            quizStepsContainer.className = 'quiz__steps'

            questions.forEach((q, i) => {
                const quizStep = document.createElement('div')
                quizStep.className = 'quiz__step'
                quizStep.innerText = i + 1
                quizStep.setAttribute('step-index', i + 1)
                quizStepsContainer.append(quizStep)
            })

            quizContent.prepend(quizStepsContainer)

            const quizSteps = document.querySelectorAll('.quiz__step')
            quizSteps[0].classList.add('active')

            quiz.archiveBtn = document.querySelector('.button.archive')
            quiz.archiveBtn.addEventListener("click", () => {
                document.getElementById('archive').click()
            })
            const openArchive = document.querySelector('.openArchive')
            if (openArchive) {
                openArchive.addEventListener("click", () => {
                    document.getElementById('archive').click()
                })
            }
            showArchiveBtnIfNecessary()

            const back = document.getElementById("back")
            back.style.display = 'block'
            back.innerText = _s.journey.back
            back.addEventListener('click', (e) => {
                quiz.modal.destroy()
                world.program.taskDescription.toggleTaskDescription()
            })

            const prevButton = document.getElementById('prev')
            prevButton.setAttribute('disabled', '')
            prevButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                const currentStep = document.querySelector('.quiz__step.active')

                current.classList.remove('visible')
                currentStep.classList.remove('active')
                current.previousElementSibling?.classList.add('visible')
                currentStep.previousElementSibling?.classList.add('active')

                if (current.previousElementSibling.querySelector('input:checked')) {
                    nextButton.removeAttribute('disabled')
                }

                if (current.getAttribute('data-index') == 2) {
                    prevButton.setAttribute('disabled', '')
                }

                showArchiveBtnIfNecessary()
            })

            const nextButton = document.getElementById('next')
            nextButton.setAttribute('disabled', '')
            nextButton.addEventListener("click", () => {
                const current = document.querySelector('.question.visible')
                const currentStep = document.querySelector('.quiz__step.active')

                current.classList.remove('visible')
                currentStep.classList.remove('active')

                current.nextElementSibling?.classList.add('visible')
                currentStep.nextElementSibling?.classList.add('active')

                if (current.nextElementSibling.querySelector('input:checked')) {
                    nextButton.removeAttribute('disabled')
                } else {
                    nextButton.setAttribute('disabled', '')
                }
                prevButton.removeAttribute('disabled')

                if (current.nextElementSibling.getAttribute('data-index') == questions.length) {
                    nextButton.setAttribute('disabled', '')
                }

                showArchiveBtnIfNecessary()
            })

            if (debug.developer || debug.onQuickLook()) {
                const skip = document.getElementById('skip')
                skip.style.display = 'block'
                skip.innerText = _s.miniGames.skip
                skip.addEventListener("click", () => {
                    quiz.modal.destroy()
                    program.advance()
                })
            }

            const submitButton = document.getElementById('continue')
            submitButton.innerText = _s.task.submit
            submitButton.addEventListener("click", quiz.completeQuiz)

            let questionsAnswered = 0
            let quizProgress = 0

            let quizUpdate = (questionsAnswered) => {
                quizProgress = quizStepWidth * questionsAnswered + '%'
                quizProgressBar.forEach(bar => bar.style.width = quizProgress)
            }

            quiz.htmlQuestions.forEach((q, i) => {
                const htmlAnswers = q.querySelectorAll('label')
                const objAnswers = questions[i].answers

                htmlAnswers.forEach((a, i) => {
                    a.addEventListener('click', () => {
                        htmlAnswers.forEach(a => {
                            a.parentNode.classList.remove('wrong')
                            a.style.pointerEvents = 'none'
                        })

                        questionsAnswered++
                        quizUpdate(questionsAnswered)

                        const correctIndex = objAnswers.findIndex(a => a.correct_wrong)
                        htmlAnswers[correctIndex].parentNode.classList.add('correct')

                        if (!objAnswers[i].correct_wrong) {
                            a.parentNode.classList.add('wrong')
                        } else {
                            quiz.correctAnswers++
                        }

                        if (q.getAttribute('data-index') == questions.length) {
                            skip.style.display = "none"
                            submitButton.style.display = "block"
                        }
                        else {
                            nextButton.removeAttribute('disabled')
                        }
                    })
                })
            })

            const textArea = document.getElementById('quizTextarea')
            if (textArea) {
                textArea.addEventListener('input', (e) => {
                    if (e.target.value.length > 1) return

                    if (e.target.value.length > 0) {
                        questionsAnswered = questions.length
                        quizUpdate(questionsAnswered)
                        skip.style.display = "none"
                        submitButton.style.display = "block"
                    }
                    else {
                        questionsAnswered = questions.length - 1
                        quizUpdate(questionsAnswered)
                        skip.style.display = "block"
                        submitButton.style.display = "none"
                    }
                })
            }

            function showArchiveBtnIfNecessary() {
                const currentQuestion = document.querySelector('.question.visible')
                const openArchive = currentQuestion.querySelector('.openArchive')

                if (openArchive) {
                    quiz.archiveBtn.style.opacity = '1'
                    quiz.archiveBtn.style.visibility = 'visible'
                }
                else {
                    quiz.archiveBtn.style.opacity = '0'
                    quiz.archiveBtn.style.visibility = 'hidden'
                }
            }
        }
    }

    completeQuiz() {
        quiz.experience.world.audio.playTaskCompleted()
        quiz.summary(quiz.correctAnswers + (document.getElementById('quizTextarea') ? 1 : 0), quiz.htmlQuestions.length)
    }

    summary(correctAnswers, numberOfQuestions) {
        document.querySelector('.modal').classList.add('completed')
        document.querySelector('.quiz__content').style.display = 'none'
        document.querySelector('.quiz__footer').style.display = 'none'
        back.style.display = 'none'

        const parent = document.querySelector('.quiz')
        const container = document.createElement('div')
        container.classList.add('quiz__summary')

        const heading = document.createElement('h2')
        heading.innerText = _s.miniGames.completed.title

        const phrase = document.createElement('h3')
        phrase.innerHTML = correctAnswers + ' / ' + numberOfQuestions + ' ' + _s.miniGames.correctAnswers

        container.appendChild(heading)
        container.appendChild(phrase)
        parent.appendChild(container)

        const submitButton = document.getElementById('continue')
        submitButton.innerText = _s.miniGames.continue

        submitButton.removeEventListener("click", quiz.completeQuiz)
        submitButton.addEventListener('click', () => {
            quiz.modal.destroy()
            quiz.experience.world.program.advance()
        })
    }
}