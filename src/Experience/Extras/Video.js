import * as THREE from 'three'
import Experience from "../Experience.js";

export default class Video {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.video = document.getElementById('video')
        // Setup
        this.setInstance()
        this.setControls()
    }

    setInstance() {
        this.texture = new THREE.VideoTexture(this.video)
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter

        this.geometry = new THREE.PlaneGeometry(16, 9)
        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide
        })
        const plane = new THREE.Mesh(this.geometry, this.material)
        plane.position.set(20, 3, 0)
        plane.rotation.y -=  Math.PI * 0.5
        this.scene.add(plane)
    }

    setControls() {
        document.onkeydown = (e) => {
            if (e.key === 'p') {
                this.video.play()
            }
            else if (e.key === ' ') {
                this.video.pause()
            }
            else if (e.key === 's') {
                this.video.pause()
                this.video.currentTime = 0
            }
            else if (e.key === 'r') {
                this.video.currentTime = 0
            }
        }
    }
}