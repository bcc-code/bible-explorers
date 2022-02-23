import * as THREE from 'three'
import Experience from "../Experience.js";

export default class Video {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        const video = document.getElementById('video')

        // Setup
        this.setInstance()
    }

    setInstance() {
        const geometry = new THREE.PlaneGeometry(1, 1)
        const material = new THREE.MeshMatcapMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide
        })

        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(0, 2, 0)
        this.scene.add(plane)
    }
}