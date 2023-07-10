import Experience from '../Experience.js'
import _gl from '../Utils/Globals.js'
import _s from '../Utils/Strings.js'

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

        if (instance.showSkipBtn()) {
            const skipVideo = document.createElement('div')
            skipVideo.className = 'skip-video btn default next pulsate'
            skipVideo.innerText = _s.miniGames.skip

            skipVideo.addEventListener('click', () => {
                container.querySelector('video').pause()
                skipVideo.remove()
                container.querySelectorAll('.hidden').forEach(item => item.classList.remove('hidden'))
            })

            container.querySelector('.video').appendChild(skipVideo)
        }

        const submitQuestion = container.querySelector('[aria-label="submit question"')
        submitQuestion.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })
    }

    showSkipBtn() {
        return instance.debug.developer || instance.debug.onPreviewMode()
    }

    destroy() {
        document.getElementById('video-with-question')?.remove()
    }
}