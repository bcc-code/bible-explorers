import Experience from '../Experience.js'
import Button from '../Components/Button.js'
import Frame from '../Components/Frame.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

let instance = null

export default class VideoWithQuestion {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.resources = instance.experience.resources
        instance.audio = instance.experience.world.audio
    }

    toggleVideoWithQuestion() {
        instance.world = instance.experience.world
        instance.selectedChapter = instance.world.selectedChapter
        instance.program = instance.world.program
        instance.video = instance.program.video
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.video_with_question

        instance.audio.setOtherAudioIsPlaying(true)
        instance.audio.fadeOutBgMusic()

        const submitBtn = new Button({
            content: _s.task.submit,
            type: 'submit',
        })
        const taskHeading = new Frame({
            content: instance.data.question,
        })
        const taskTextarea = new Frame({
            content: `<textarea class="scroller" placeholder=""></textarea>`,
        })
        const taskContainerFrame = new Frame({
            content: `<div class="task-content">
                    ${instance.data.question ? `<h5 class="task-heading">${taskHeading.getHtml()}</h5>` : ''}
                    <div id="task-tutorial" class="w-[30rem]"></div>
                    <div class="textarea-box input-grid">
                        ${taskTextarea.getHtml()}
                    </div>
                    <div class="task-actions">
                        ${submitBtn.getHtml()}
                    </div>
                </div>`,
        })

        const container = _gl.elementFromHtml(
            `<div class="task-container" id="video-with-question">
                ${taskContainerFrame.getHtml()}
            </div>`
        )

        instance.experience.interface.tasksDescription.append(container)
        instance.experience.setAppView('task-description')

        if (instance.data.video) {
            const videoId = `texture-${instance.data.video}`

            instance.video.load(videoId)
            instance.moveDivToAnotherDiv(videoId, 'task-tutorial')
        }

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`

        const submitQuestion = container.querySelector('.button-grid')
        submitQuestion.addEventListener('click', () => {
            instance.saveAnswers()
            instance.destroy()
            instance.program.nextStep()
        })

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    moveDivToAnotherDiv(sourceDiv, destinationDiv) {
        // Declare a fragment:
        var fragment = document.createDocumentFragment()

        // Append desired element to the fragment:
        fragment.appendChild(document.getElementById(sourceDiv))

        // Append fragment to desired element:
        document.getElementById(destinationDiv).appendChild(fragment)
    }

    toggleQuestion() {
        instance.resources.videoPlayers[instance.data.video].pause()
        document
            .querySelectorAll('#video-with-question .hidden')
            .forEach((item) => item.classList.remove('hidden'))

        instance.experience.navigation.next.addEventListener('click', instance.saveAnswers)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleQuestion)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)
    }

    saveAnswers() {
        const answer = document.querySelector('#video-with-question textarea').value
        if (!answer) return

        const data = {
            taskTitle: instance.stepData.details.title,
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
        const videoId = `texture-${instance.data.video}`
        instance.moveDivToAnotherDiv(videoId, 'video-container')

        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.saveAnswers)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleQuestion)
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)

        instance.experience.navigation.next.innerHTML = ``

        document.getElementById('video-with-question')?.remove()
        instance.experience.setAppView('chapter')

        instance.video.defocus()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()
    }
}
