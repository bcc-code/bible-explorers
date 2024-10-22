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
        let answerFound = false
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.multiple_choice_with_picture

        const multipleChoiceWithPicture = _gl.elementFromHtml(`
            <div id="multiple-choice" class="task-container">
                <div class="corner top-left"></div>
                <div class="edge top"></div>
                <div class="corner top-right"></div>
                <div class="edge left"></div>
                <div class="content">
                    <div class="task-content">
                        ${instance.stepData.details.title ? `<p class="task-prompts">${instance.stepData.details.title}</p>` : ''}
                        ${instance.data.image ? `<div id="task-image" class="task-tutorial !hidden"><img src="${instance.data.image}"/></div>` : ''}
                        <ul class="multiple-choice-answers"></ul>
                    </div>
                </div>
                <div class="edge right"></div>
                <div class="corner bottom-left"></div>
                <div class="edge bottom"></div>
                <div class="corner bottom-right"></div>
            </div>
        `)

        instance.data.choices.forEach((choice, cIdx) => {
            const multipleChoiceWithPictureAnswer = _gl.elementFromHtml(`
                <li class="multiple-choice-answer">
                    <input type="radio" id="answer-${cIdx}" name="multiple-choice" class="sr-only"/>
                    <label for="answer-${cIdx}" class="question-label input-grid">
                        <div class="corner top-left"></div>
                        <div class="edge top"></div>
                        <div class="corner top-right"></div>
                        <div class="edge left"></div>
                        <div class="content">
                            <div class="font-bold button-circle">${cIdx + 1}</div>
                            <h4 class="">${choice.answer}</h4>
                        </div>
                        <div class="edge right"></div>
                        <div class="corner bottom-left"></div>
                        <div class="edge bottom"></div>
                        <div class="corner bottom-right"></div>
                    </label>
                </li>
            `)

            multipleChoiceWithPicture.querySelector('.multiple-choice-answers').append(multipleChoiceWithPictureAnswer)
        })

        multipleChoiceWithPicture.querySelectorAll('.multiple-choice-answers').forEach((a) => {
            const htmlAnswers = a.querySelectorAll('.multiple-choice-answer')
            const objAnswers = instance.data.choices

            htmlAnswers.forEach((a, i) => {
                a.addEventListener('click', () => {
                    a.style.pointerEvents = 'none'

                    if (!objAnswers[i].correct_wrong) {
                        instance.audio.playSound('wrong')

                        a.classList.add('wrong')
                        setTimeout(function () {
                            a.classList.remove('wrong')
                        }, 500)
                    } else {
                        answerFound = true
                        instance.audio.playSound('correct')
                        instance.experience.celebrate({
                            particleCount: 100,
                            spread: 160,
                        })

                        a.classList.add('correct')
                        instance.experience.navigation.next.innerHTML = ''

                        htmlAnswers.forEach((answer) => (answer.style.pointerEvents = 'none'))
                    }
                })
            })
        })

        instance.experience.interface.gameContainer.append(multipleChoiceWithPicture)

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
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

        instance.experience.navigation.next.innerHTML = ''
    }
}
