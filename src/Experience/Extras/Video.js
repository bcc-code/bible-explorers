import * as THREE from 'three'
import Experience from "../Experience.js";

export default class Video {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.mediaItems = this.resources.mediaItems

        // Setup
        this.setInstance()
        this.setControls()
    }

    setInstance() {

        this.texture = this.mediaItems[0].item
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter

        this.geometry = new THREE.PlaneGeometry(16, 9)
        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide
        })
        const plane = new THREE.Mesh(this.geometry, this.material)
        plane.position.set(17, 3, 0)
        plane.rotation.y -= Math.PI * 0.5
        this.scene.add(plane)
    }

    setControls() {
        document.onkeydown = (e) => {
            if (e.key === 'p') {
                 this.texture.image.play()
            }
            else if (e.key === ' ') {
                 this.texture.image.pause()
            }
            else if (e.key === 's') {
                 this.texture.image.pause()
                 this.texture.image.currentTime = 0
            }
            else if (e.key === 'r') {
                 this.texture.image.currentTime = 0
            }
        }
    }
}