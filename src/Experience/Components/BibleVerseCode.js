import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class BibleVerseCode {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.world = instance.experience.world
        instance.debug = instance.experience.debug
    }

    toggleBibleVerseCode() {
        instance.audio = instance.world.audio
        instance.program = instance.world.program
        instance.bibleVerseCode = instance.program.getCurrentStepData().bible_verse_code

        instance.experience.setAppView('game')

        instance.bibleVerseCodeHTML()
        instance.setEventListeners()
    }

    bibleVerseCodeHTML() {
        const title = instance.program.getCurrentStepData().details.title
        const unlockScreen = _gl.elementFromHtml(`
            <div class="bible-verse-code absolute inset-0 task-container" id="bible-verse-code">
                <div class="relative task-container_box">
                    <h5 class="task-container_heading">${title}</h1>
                    <div class="bible-verse-code__input">
                        <div class="bible-book"></div>
                        <div class="bible-delimiter">,</div>
                        <div class="bible-chapter"></div>
                        <div class="bible-delimiter">:</div>
                        <div class="bible-verse-from"></div>
                        <div class="bible-delimiter">-</div>
                        <div class="bible-verse-to"></div>
                    </div>
                    <div class="task-container_actions">
                        <button id="check-code" class="button button-task_action" type="submit"><span>Sjekke om koden er riktig</span></button>
                    </div>
                </div>
            </div>
        `)

        instance.experience.interface.gameContainer.append(unlockScreen)
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = `button button-arrow-skip`

        instance.bibleVerseCode.book.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-book').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-book-${index + 1}" min="0" max="9" />
                    <label for="bible-book-${index + 1}">${number.icon}</label>
                </div>`)
            )
        })
        instance.bibleVerseCode.chapter.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-chapter').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-chapter-${index + 1}" min="0" max="9" />
                    <label for="bible-chapter-${index + 1}">${number.icon}</label>
                </div>`)
            )
        })
        instance.bibleVerseCode.verse_from.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-verse-from').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-verse-from-${index + 1}" min="0" max="9" />
                    <label for="bible-verse-from-${index + 1}">${number.icon}</label>
                </div>`)
            )
        })
        instance.bibleVerseCode.verse_to.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-verse-to').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-verse-to-${index + 1}" min="0" max="9" />
                    <label for="bible-verse-to-${index + 1}">${number.icon}</label>
                </div>`)
            )
        })
    }

    checkCode() {
        let wrong = false

        document.querySelectorAll('.bible-book input').forEach((input, index) => {
            if (input.value != instance.bibleVerseCode.book[index].number) {
                console.log('book input ' + (index + 1) + ' is wrong')
                wrong = true
            }
        })

        document.querySelectorAll('.bible-chapter input').forEach((input, index) => {
            if (input.value != instance.bibleVerseCode.chapter[index].number) {
                console.log('chapter input ' + (index + 1) + ' is wrong')
                wrong = true
            }
        })

        document.querySelectorAll('.bible-verse-from input').forEach((input, index) => {
            if (input.value != instance.bibleVerseCode.verse_from[index].number) {
                console.log('verse-from input ' + (index + 1) + ' is wrong')
                wrong = true
            }
        })

        document.querySelectorAll('.bible-verse-to input').forEach((input, index) => {
            if (input.value != instance.bibleVerseCode.verse_to[index].number) {
                console.log('verse-to input ' + (index + 1) + ' is wrong')
                wrong = true
            }
        })

        if (wrong) {
            instance.audio.playSound('wrong')
        } else {
            instance.audio.playSound('task-completed')

            instance.experience.celebrate({
                particleCount: 100,
                spread: 160,
            })
            instance.experience.navigation.next.innerText = ''
            instance.experience.navigation.next.className = `button button-arrow`
        }
    }

    setEventListeners() {
        document.querySelector('#check-code').addEventListener('click', instance.checkCode)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    destroy() {
        document.onkeydown = null
        instance.el.backspace.removeEventListener('click', instance.remove)
        instance.el.confirm.removeEventListener('click', instance.checkCode)

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
        document.querySelector('#bible-verse-code')?.remove()

        instance.experience.setAppView('chapter')

        instance.experience.navigation.next.innerHTML = ''
        instance.experience.navigation.next.className = `button button-arrow`
    }
}
