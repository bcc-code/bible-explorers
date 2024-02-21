import Offline from '../Utils/Offline.js'
import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class MultipleChoiceWithPicture {
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

        instance.experience.setAppView('game')

        instance.setHtml()
        instance.useCorrectAssetsSrc()
        instance.setEventListeners()
    }

    setHtml() {
        let tries = 0
        let answerFound = false
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.multiple_choice_with_picture

        const multipleChoiceWithPicture = _gl.elementFromHtml(`
            <div id="multiple-choice" class="absolute inset-0 bg-bke-darkpurple grid place-content-center">
                <div class="relative mx-auto max-w-[1980px] px-4 pb-4 pt-24 tv:gap-8 tv:px-8 tv:pt-32">
                    <h1 class="text-2xl tv:text-3xl font-bold text-center mb-4">${instance.stepData.details.title}</h1>
                    ${instance.data.image ? `<div id="task-image"><img src="${instance.data.image}"/></div>` : ''}
                    <ul class="multiple-choice-answers mt-4 tv:mt-8"></ul>
                </div>
            </div>
        `)

        instance.data.choices.forEach((choice, cIdx) => {
            const multipleChoiceWithPictureAnswer = _gl.elementFromHtml(`
                <li class="multiple-choice-answer mb-2">
                    <div class="label tv:text-xl leading-normal bg-bke-purple">
                        <label for="answer-${cIdx}"></label>
                        <input type="radio" id="answer-${cIdx}" name="multiple-choice" class="sr-only"/>
                        <span>${choice.answer}</span>
                    </div>
                </li>
            `)

            multipleChoiceWithPicture.querySelector('.multiple-choice-answers').append(multipleChoiceWithPictureAnswer)
        })

        multipleChoiceWithPicture.querySelectorAll('.multiple-choice-answers').forEach((a) => {
            const htmlAnswers = a.querySelectorAll('.label')
            const objAnswers = instance.data.choices

            htmlAnswers.forEach((a, i) => {
                a.addEventListener('click', () => {
                    tries++
                    a.style.pointerEvents = 'none'

                    if (!objAnswers[i].correct_wrong) {
                        instance.audio.playSound('wrong')
                        a.parentNode.classList.add('shadow-wrong')
                    } else {
                        answerFound = true
                        a.parentNode.classList.add('shadow-correct')
                        instance.audio.playSound('correct')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

                        instance.experience.navigation.next.disabled = false
                        instance.experience.navigation.next.className = 'button-normal shadow-border'
                        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
                    }

                    if (tries == 2 || answerFound) {
                        const correctIndex = objAnswers.findIndex((a) => a.correct_wrong)
                        htmlAnswers[correctIndex].parentNode.classList.add('correct')

                        instance.experience.navigation.next.disabled = false
                        instance.experience.navigation.next.className = 'button-normal shadow-border'
                        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
                    }

                    htmlAnswers.forEach((answer) => {
                        if (tries == 2 || answerFound) answer.style.pointerEvents = 'none'
                    })
                })
            })
        })

        instance.experience.interface.gameContainer.append(multipleChoiceWithPicture)

        instance.experience.navigation.next.innerHTML = _s.miniGames.skip
        instance.experience.navigation.next.className = 'button-normal less-focused'
        instance.experience.navigation.next.disabled = false
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'image', (data) => {
            document.querySelector('#task-image img').src = data.image
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.getElementById('multiple-choice')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.className = 'button-normal shadow-border'
        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
    }
}
