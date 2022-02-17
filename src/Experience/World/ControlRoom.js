import * as THREE from 'three'
import Experience from "../Experience.js"

export default class ControlRoom {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.raycaster = this.experience.raycaster
        this.pointer = this.experience.pointer

        this.currentIntersect = null
        this.modalIsOpen = false

        // Setup
        this.resources = this.resources.items.controlRoom
        this.setModel()
        this.setPoints()

        // Events
        this.mousemove()

    }

    // Events
    mousemove() {
        window.addEventListener('mousemove', (event) => {
            this.pointer.x = (event.clientX / this.sizes.width) * 2 - 1;
            this.pointer.y = - (event.clientY / this.sizes.height) * 2 + 1;
        })
    }

    clickedObject() {
        window.addEventListener('click', (event) => {
            this.raycaster.setFromCamera(this.pointer, this.camera.instance)
            const intersects = this.raycaster.intersectObjects(this.resources.scene.children)

            if (intersects.length) {
                this.currentIntersect = intersects[0].object
            }

            if (this.currentIntersect != null) {
                if (this.currentIntersect.name === 'tv_4x4_screen') {
                    this.openModal('.screen-0')
                }

                if (this.currentIntersect.name === 'Panel_Screen') {
                    this.openModal('.screen-panel')
                }

                if (this.currentIntersect.name === 'Panel_Red_button') {
                    this.openModal('.screen-1')
                }

                if (this.currentIntersect.name === 'Panel_Green_button') {
                    this.openModal('.screen-2')
                }
            }

            this.closeModal(event)
        })
    }

    openModal(modal) {
        document.querySelector(modal).classList.add('visible')
        document.querySelector('.overlay').classList.add('visible')
        this.modalIsOpen = true
    }

    closeModal(event) {
        if (event.target.classList.contains('close') || event.target.classList.contains('overlay')) {
            event.target.closest('article').classList.remove('visible')
            document.querySelector('.overlay').classList.remove('visible')
            this.modalIsOpen = false
        }
    }

    // Set scene
    setModel() {
        this.model = this.resources.scene
        this.model.position.set(0, 0, 0)
        this.scene.add(this.model)
    }

    setPoints() {
        this.points = [
            {
                name: 'Panel_Screen',
                position: new THREE.Vector3(1.6, 1.2, 0.01),
                element: document.querySelector('.point-0')
            },
        ]

        this.scene.traverse((child) => {
            // console.log(child);
        })
    }

    setPointsOnScreen() {

        for (const point of this.points) {
            const screenPosition = point.position.clone()
            screenPosition.project(this.camera.instance)

            const translateX = screenPosition.x * this.sizes.width * 0.5
            const translateY = - screenPosition.y * this.sizes.height * 0.5

            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
            point.element.classList.add('visible')

        }
    }

    update() {
        this.setPointsOnScreen()
    }


}