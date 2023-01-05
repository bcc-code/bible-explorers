import Experience from '../Experience.js'
import Modal from '../Utils/Modal.js'
import _s from '../Utils/Strings.js'
import _lang from '../Utils/Lang.js'
import _api from '../Utils/Api.js'

let instance = null
const circleSize = 96
export default class PictureAndCode {
    constructor() {
        this.experience = new Experience()
        instance = this
    }

    togglePictureAndCode() {
        if (document.querySelector('.modal')) {
            instance.modal.destroy()
        }
        else {
            instance.world = instance.experience.world
            instance.offline = instance.world.offline
            instance.program = instance.world.program
            instance.selectedChapter = instance.world.selectedChapter
            instance.stepData = instance.program.getCurrentStepData()
            instance.data = instance.stepData.picture_and_code
            instance.circlesVisible = instance.program.gamesData.pictureAndCode.circles.length
            instance.lastKnownScrollPosition = 0
            instance.togglePicture()
        }
    }

    togglePicture() {
        instance.offline.fetchChapterAsset(instance.data, "picture", (data) => this.setPicture(data.picture))

        let html = `<div class="modal__content picture-and-code">
            <div class="picture-and-code__content">
                <img data-src="" class="lazyload">
                <div class="img-loader"></div>
            </div>
        </div>`

        instance.modal = new Modal(html, 'modal__picture-and-code')
        instance.el = document.querySelector('.picture-and-code')

        console.log()

        const title = document.querySelector('.modal__heading--minigame')
        title.innerHTML = `<h3>${instance.stepData.details.title}</h3>`

        const back = document.getElementById("back")
        back.style.display = 'block'
        back.innerText = _s.journey.back
        back.addEventListener('click', (e) => {
            e.stopPropagation()
            instance.modal.destroy()
            instance.program.previousStep()
        })

        const next = document.getElementById("continue")
        next.style.display = 'block'
        next.innerText = _s.task.next
        next.addEventListener("click", () => {
            instance.modal.destroy()
            instance.program.nextStep()
        })

        instance.addExistingCircles()

        document.querySelector('.modal__picture-and-code').addEventListener('scroll', (e) => {
            instance.lastKnownScrollPosition = e.target.scrollTop;
        })

        instance.el.addEventListener('click', instance.addCirclesOnClick)
    }

    setPicture(url) {
        instance.data.picture = url
        instance.el.querySelector('img').setAttribute('data-src', instance.data.picture)
    }

    addExistingCircles() {
        instance.program.gamesData.pictureAndCode.circles.forEach(circle => instance.addCircle(circle.x, circle.y))
    }

    newScrollPosition(scrollPos) {
        return scrollPos
    }

    addCirclesOnClick(event) {
        const maxCirclesToAdd = 4

        if (event.target.classList.contains('circle')) {
            instance.removeCircle(event)
            instance.circlesVisible--
        }
        else if (instance.circlesVisible < maxCirclesToAdd) {
            instance.addCircle(event.x, event.y + instance.lastKnownScrollPosition)
            instance.program.gamesData.pictureAndCode.circles.push({ x: event.x, y: event.y + instance.lastKnownScrollPosition })
            instance.circlesVisible++
        }
    }

    addCircle = (x, y) => {
        const el = document.createElement('div')
        el.classList.add('circle')
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        instance.el.appendChild(el)
    }

    removeCircle = (mouseClick) => {
        mouseClick.target.remove()
        const index = instance.program.gamesData.pictureAndCode.circles.findIndex(circle => instance.intersected(mouseClick, circle))
        instance.program.gamesData.pictureAndCode.circles.splice(index, 1)
    }

    intersected(r1, r2) {
        return !(
            r2.x > r1.x + circleSize ||
            r2.x + circleSize < r1.x ||
            r2.y > r1.y + circleSize ||
            r2.y + circleSize < r1.y
        )
    }
}