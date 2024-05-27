import Experience from '../Experience.js'
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
        instance.debug = instance.experience.debug
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

        const container = _gl.elementFromHtml(
            `<div class="absolute inset-0 task-container" id="video-with-question">
                <div class="task-container_box">
                    ${instance.data.question ? `<h5 class="task-container_heading">${instance.data.question}</h1>` : ''}
                    <div id="task-container_video" class="w-[30rem]"></div>
                    <div class="textarea-box">
                        <textarea class="scroller"></textarea>
                    </div>
                    <div class="task-container_actions">
                        <button class="button button-task_action" type="submit">${_s.task.submit}</button>
                    </div>
                </div>
            </div>
            `
        )

        instance.experience.interface.tasksDescription.append(container)
        instance.experience.setAppView('task-description')

        if (instance.data.video) {
            const videoId = `texture-${instance.data.video}`

            instance.video.load(videoId)
            instance.moveDivToAnotherDiv(videoId, 'task-container_video')
        }

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`
        instance.experience.navigation.next.className = `button button-arrow-skip`

        const submitQuestion = container.querySelector('button')
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
        document.querySelectorAll('#video-with-question .hidden').forEach((item) => item.classList.remove('hidden'))

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
        instance.experience.navigation.next.className = `button button-arrow`
        document.getElementById('video-with-question')?.remove()
        instance.experience.setAppView('chapter')

        instance.video.defocus()

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()
    }
}
