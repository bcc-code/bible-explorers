import * as THREE from 'three'
import Experience from "../Experience.js";

export default class Video {
    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.canvas = this.experience.canvas
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera 
        this.renderer = this.experience.renderer
        this.controls = this.experience.camera.controls

        // Setup
        this.setPlane()
    }

    setPlane() {
        this.planeGeometry = new THREE.PlaneGeometry(16, 9)
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial)

        this.planeMesh.name = "Video_Screen"
        this.planeMesh.position.set(17, 3, 0)
        this.planeMesh.rotation.y = -Math.PI * 0.5
        this.scene.add(this.planeMesh)
    }

    play(id) {
        // Pause initial video
        if (this.texture && !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path))
            this.texture.image.pause()

        // Update video on screen (set initial or replace if it's a new video)
        if (!this.texture || !this.texture.image.currentSrc.includes(this.resources.mediaItems[id].item.path)) {
            this.texture = this.resources.mediaItems[id].item
            this.planeMesh.material.map = this.texture
            this.planeMesh.material.needsUpdate = true
        }
       
        // Play the new video
        this.texture.image.play()
    }

    stop() {
        this.texture.image.pause()
        this.texture.image.currentTime = 0
        this.planeMesh.material.map = null
    }

    togglePlay() {
        if (!this.texture.image) return

        if (this.texture.image.paused) {
            this.texture.image.play()
        } else {
            this.texture.image.pause()
        }
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
                this.experience.world.program.advance()
            }
            else if (e.key === 'r') {
                this.texture.image.currentTime = 0
            }
        }
    }
}