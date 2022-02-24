import * as THREE from 'three'
import Experience from "../Experience.js";

export default class PointsOfInterests {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.camera = this.experience.camera

        this.pointsOfInterests = []

        // Setup
        this.setPOI()
    }


    // Set points of interest (POI)
    setPOI() {
        const panelScreen = {
            name: 'Panel_Screen',
            position: new THREE.Vector3(1.6, 1.2, 0.01),
            element: document.querySelector('.point-0')
        }

        this.pointsOfInterests.push(panelScreen)
    }

    update() {
        for (const point of this.pointsOfInterests) {
            const screenPosition = point.position.clone()
            screenPosition.project(this.camera.instance)

            const translateX = screenPosition.x * this.sizes.width * 0.5
            const translateY = - screenPosition.y * this.sizes.height * 0.5

            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
            point.element.classList.add('visible')
        }
    }
}