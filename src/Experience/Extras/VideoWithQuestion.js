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

        if (instance.data.video) {
            instance.video.load('texture-' + instance.data.video)
            instance.video.play()
        }

        const content = _gl.elementFromHtml(
            `<div id="video-with-question" class="p-8 h-full flex flex-col items-center justify-center overflow-y-auto">
                <h1 class="text-4xl font-semibold">${instance.data.question}</h1>
                <textarea class="w-full text-bke-purple px-3 py-2 rounded-md outline-none my-8 text-xl"></textarea>
                <button class="button-normal w-full" type="submit" aria-label="submit question">${_s.task.submit}</button>
            </div>
            `
        )

        instance.experience.interface.smallScreen.append(content)
        instance.experience.interface.smallScreen.setAttribute('data-view', 'game-description')

        const submitQuestion = content.querySelector('[aria-label="submit question"')
        submitQuestion.addEventListener('click', () => {
            instance.saveAnswers()
            instance.destroy()
            instance.program.nextStep()
        })

        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    toggleQuestion() {
        instance.resources.videoPlayers[instance.data.video].pause()
        document.querySelectorAll('#video-with-question .hidden').forEach((item) => item.classList.remove('hidden'))

        instance.experience.navigation.next.addEventListener('click', instance.saveAnswers)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleQuestion)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)
        instance.experience.navigation.next.className = 'button-normal less-focused'
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
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.saveAnswers)
        instance.experience.navigation.next.removeEventListener('click', instance.toggleQuestion)
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)
        document.getElementById('video-with-question')?.remove()
        document.getElementById('video-question')?.remove()
        instance.experience.navigation.next.className = 'button-normal shadow-border'

        instance.audio.setOtherAudioIsPlaying(false)
        instance.audio.fadeInBgMusic()
    }
}
