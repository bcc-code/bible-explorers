import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from "../Utils/Events.js"

let instance = null

export default class VideoWithQuestion {
    constructor() {
        instance = this
        instance.experience = new Experience()
        instance.debug = instance.experience.debug
    }

    toggleVideoWithQuestion() {
        instance.world = instance.experience.world
        instance.program = instance.world.program
        instance.stepData = instance.program.getCurrentStepData()
        instance.data = instance.stepData.video_with_question

        const container = _gl.elementFromHtml(`
            <div class="view" id="video-with-question">
                <div class="container">
                    <div class="row">
                        <div class="video">
                            ${instance.data.video != '' ? '<video src="" width="100%" height="100%" frameBorder="0" autoplay loop></video>' : ''}
                        </div>
                    </div>
                    <div class="row hidden">
                        <div class="col">
                            <span class="title">${instance.data.question}</span>
                        </div>
                        <div class="col">
                            <textarea></textarea>
                            <button class="btn default" type="submit" aria-label="submit question">${_s.task.submit}</button>
                        </div>
                    </div>
                </div>
                <div class="overlay"></div>
            </div>
        `)

        document.querySelector('.ui-container').append(container)

        if (instance.data.video)
            container.querySelector('.video > *').src = instance.experience.resources.customTextureItems[instance.data.video].item?.source.data.src

        container.querySelector('video')
            ?.addEventListener('click', (e) => {
                e.target.paused
                    ? e.target.play()
                    : e.target.pause()
            })
            ?.addEventListener('ended', (e) => {
                container.querySelectorAll('.hidden').forEach(item => item.classList.remove('hidden'))
            })
        
        const submitQuestion = container.querySelector('[aria-label="submit question"')
        submitQuestion.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })

        document.querySelector('.cta').style.display = 'flex'
        instance.experience.navigation.next.removeEventListener('click', instance.program.nextStep)
        instance.experience.navigation.next.addEventListener('click', instance.skipVideo)
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    skipVideo() {
        document.querySelector('#video-with-question video').pause()
        document.querySelectorAll('#video-with-question .hidden').forEach(item => item.classList.remove('hidden'))

        instance.experience.navigation.next.removeEventListener('click', instance.skipVideo)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)
    }

    destroy() {
        console.log('destroy')
        instance.experience.navigation.prev.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.removeEventListener('click', instance.skipVideo)
        instance.experience.navigation.next.removeEventListener('click', instance.destroy)
        instance.experience.navigation.next.addEventListener('click', instance.program.nextStep)
        document.getElementById('video-with-question')?.remove()
    }
}