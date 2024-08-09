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
                <video id="glitch-character" src="textures/glitch_idle_v2.mp4" muted autoplay loop></video>
                <div id="open-guide">Trenger dere hjelp? Klikk her!</div>
                <div id="glitch-guide">Dere skjønner kanskje selv at dere mangler noe for å finne hele koden. Sjekk i versken som mentoren bærer med seg!</div>
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

    setEventListeners() {
        document.querySelector('#check-code').addEventListener('click', instance.checkCode)
        document.querySelector('#glitch-character').addEventListener('click', instance.showOpenGuide)
        document.querySelector('#open-guide').addEventListener('click', instance.popGlitchGuide)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
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

    showOpenGuide() {
        document.querySelector('#glitch-character').classList.add('active')
        document.querySelector('#open-guide').style.display = 'block'
    }

    popGlitchGuide() {
        document.querySelector('#open-guide').style.display = 'none'
        document.querySelector('#glitch-guide').style.display = 'block'
    }

    destroy() {
        document.querySelector('#bible-verse-code')?.remove()

        instance.experience.setAppView('chapter')

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }
}