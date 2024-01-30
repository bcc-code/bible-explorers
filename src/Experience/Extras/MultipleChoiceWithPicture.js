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
            <div id="multiple-choice" class="p-8 h-full flex flex-col items-center justify-center overflow-y-auto">
                <div id="task-image"><img src="${instance.data.image}" class="multiple-choice-image w-[280px]" alt="picture" /></div>
                <h1 class="text-4xl font-semibold">${instance.stepData.details.title}</h1>
                <ul class="multiple-choice-answers mt-8"></ul>
            </div>
        `)

        instance.data.choices.forEach((choice, cIdx) => {
            const multipleChoiceWithPictureAnswer = _gl.elementFromHtml(`
                <li class="multiple-choice-answer mb-2 rounded-md">
                    <div class="label text-xl leading-normal bg-white/10 rounded-md">
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
                        a.parentNode.classList.add('wrong')
                    } else {
                        answerFound = true
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

        instance.experience.interface.smallScreen.append(multipleChoiceWithPicture)
        instance.experience.interface.smallScreen.setAttribute('data-view', '')

        instance.experience.navigation.next.innerHTML = _s.miniGames.skip
        instance.experience.navigation.next.className = 'button-normal less-focused'
        instance.experience.navigation.next.disabled = false
    }

    useCorrectAssetsSrc() {
        instance.offline.fetchChapterAsset(instance.data, 'image', (data) => {
            document.querySelector('img.multiple-choice-image').src = data.image
        })
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.getElementById('multiple-choice')?.remove()
        document.getElementById('task-image')?.remove()

        instance.experience.navigation.next.className = 'button-normal shadow-border'
        instance.experience.navigation.next.innerHTML = instance.experience.icons.next
    }
}
