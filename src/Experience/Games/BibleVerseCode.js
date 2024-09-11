import Offline from '../Utils/Offline.js'
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
        instance.offline = new Offline()
    }

    toggleBibleVerseCode() {
        instance.audio = instance.world.audio
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.bible_verse_code

        instance.experience.setAppView('game')

        instance.bibleVerseCodeHTML()
        instance.useCorrectAssetsSrc()
        instance.setEventListeners()
    }

    bibleVerseCodeHTML() {
        let prompts = ''
        instance.stepData.details.prompts.forEach((p) => {
            prompts += `<p>${p.prompt}</p>`
        })

        const title = instance.stepData.details.title
        const unlockScreen = _gl.elementFromHtml(`
            <div class="bible-verse-code absolute inset-0 task-container" id="bible-verse-code">
                <div class="relative task-container_box">
                    <h5 class="task-container_heading">${title}</h5>
                    <div class="bible-verse-code__prompts">${prompts}</div>
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
                <div id="glitch-character">
                    <video id="glitch-character-idle" src="games/bible-verse-code/Glitch_WEB_Oppgave3_Loop_v002.webm" muted autoplay loop></video>
                    <video id="glitch-character-popup" src="games/bible-verse-code/Glitch_WEB_Oppgave3_Start_v002.webm" muted loop></video>
                </div>
                <div id="open-guide" class="cursor-pointer">Trenger dere hjelp? Klikk her!</div>
                <div id="glitch-guide">Dere skjønner kanskje selv at dere mangler noe for å finne hele koden. Sjekk i versken som mentoren bærer med seg!</div>
            </div>
        `)

        instance.experience.interface.gameContainer.append(unlockScreen)
        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = `button button-arrow-skip`

        instance.data.book.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-book').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-book-${index + 1}" maxlength="1" class="type1" />
                    <label for="bible-book-${index + 1}"><img src="${number.icon}" /></label>
                </div>`)
            )
        })
        instance.data.chapter.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-chapter').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-chapter-${index + 1}" maxlength="1" class="type2" />
                    <label for="bible-chapter-${index + 1}"><img src="${number.icon}" /></label>
                </div>`)
            )
        })
        instance.data.verse_from.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-verse-from').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-verse-from-${index + 1}" maxlength="1" class="type3" />
                    <label for="bible-verse-from-${index + 1}"><img src="${number.icon}" /></label>
                </div>`)
            )
        })
        instance.data.verse_to.forEach(function (number, index) {
            unlockScreen.querySelector('.bible-verse-to').append(
                _gl.elementFromHtml(`<div class="flex text-center flex-col">
                    <input type="number" id="bible-verse-to-${index + 1}" maxlength="1" class="type3" />
                    <label for="bible-verse-to-${index + 1}"><img src="${number.icon}" /></label>
                </div>`)
            )
        })
    }

    useCorrectAssetsSrc() {
        instance.data.book.forEach((option, index) => {
            instance.offline.fetchChapterAsset(option, 'icon', (data) => {
                document.querySelector('.bible-book label[for="bible-book-' + (index + 1) + '"] img').src =
                    data.icon
            })
        })

        instance.data.chapter.forEach((option, index) => {
            instance.offline.fetchChapterAsset(option, 'icon', (data) => {
                document.querySelector(
                    '.bible-chapter label[for="bible-chapter-' + (index + 1) + '"] img'
                ).src = data.icon
            })
        })

        instance.data.verse_from.forEach((option, index) => {
            instance.offline.fetchChapterAsset(option, 'icon', (data) => {
                document.querySelector(
                    '.bible-verse-from label[for="bible-verse-from-' + (index + 1) + '"] img'
                ).src = data.icon
            })
        })

        instance.data.verse_to.forEach((option, index) => {
            instance.offline.fetchChapterAsset(option, 'icon', (data) => {
                document.querySelector(
                    '.bible-verse-to label[for="bible-verse-to-' + (index + 1) + '"] img'
                ).src = data.icon
            })
        })
    }

    setEventListeners() {
        document.querySelector('#check-code').addEventListener('click', instance.checkCode)
        document.querySelector('#glitch-character').addEventListener('click', instance.showOpenGuide)
        document.querySelector('#glitch-character').addEventListener('mouseover', () => {
            const characterPopup = document.querySelector('#glitch-character-popup')
            characterPopup.currentTime = 0
            characterPopup.play()
        })
        document.querySelector('#open-guide').addEventListener('click', instance.popGlitchGuide)
        instance.goToNextInputListener()
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    checkCode() {
        document.querySelectorAll('.bible-verse-code__input input').forEach((input) => {
            input.classList.remove('correct', 'wrong')
        })

        document.querySelectorAll('.bible-book input').forEach((input, index) => {
            input.classList.add(input.value != instance.data.book[index].number ? 'wrong' : 'correct')
        })

        document.querySelectorAll('.bible-chapter input').forEach((input, index) => {
            input.classList.add(input.value != instance.data.chapter[index].number ? 'wrong' : 'correct')
        })

        document.querySelectorAll('.bible-verse-from input').forEach((input, index) => {
            input.classList.add(input.value != instance.data.verse_from[index].number ? 'wrong' : 'correct')
        })

        document.querySelectorAll('.bible-verse-to input').forEach((input, index) => {
            input.classList.add(input.value != instance.data.verse_to[index].number ? 'wrong' : 'correct')
        })

        if (document.querySelectorAll('input.wrong').length > 0) {
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

    goToNextInputListener() {
        document.querySelectorAll('.bible-verse-code__input input').forEach((input) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length > e.target.maxLength) {
                    e.target.value = e.target.value.slice(0, e.target.maxLength)
                }
            })
        })

        document.getElementById('bible-book-1').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength) document.getElementById('bible-book-2').focus()
        })

        document.getElementById('bible-book-2').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength)
                document.getElementById('bible-chapter-1').focus()
        })

        document.getElementById('bible-chapter-1').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength)
                document.getElementById('bible-verse-from-1').focus()
        })

        document.getElementById('bible-verse-from-1').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength)
                document.getElementById('bible-verse-from-2').focus()
        })

        document.getElementById('bible-verse-from-2').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength)
                document.getElementById('bible-verse-to-1').focus()
        })

        document.getElementById('bible-verse-to-1').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength)
                document.getElementById('bible-verse-to-2').focus()
        })

        document.getElementById('bible-verse-to-2').addEventListener('input', (e) => {
            if (e.target.value.length == e.target.maxLength) document.getElementById('check-code').focus()
        })
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
