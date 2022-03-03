import * as THREE from 'three'
import Experience from "../Experience.js";
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

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
        this.cssRenderer()

        const video = this.createElement('xBOqwRRj82A', 0, 0, 0, 0)

        this.scene.add(video);

        this.blocker()

        const light = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(light);

    }

    createElement(id, x, y, z, ry) {
        const div = document.createElement('div')
        div.style.width = '480px'
        div.style.height = '360px'
        div.style.backgroundColor = '#f00'

        const iframe = document.createElement('iframe')
        iframe.style.width = '480px'
        iframe.style.height = '360px'
        iframe.style.border = '0px'
        iframe.src = ['https://www.youtube.com/embed/', id, '?rel=0'].join('')
        div.appendChild(iframe)

        const object = new CSS3DObject(div)
        object.position.set(x, y, z)
        object.rotation.y = ry

        return object
    }

    setPlane() {
        const planeGeometry = new THREE.PlaneGeometry(16, 9)
        const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

        planeMesh.position.set(17, 3, 0)
        planeMesh.rotation.y = Math.PI * 0.5
        this.scene.add(planeMesh);
    }

    blocker() {
        const blocker = document.getElementById('blocker')
        blocker.style.display = 'none';

        this.controls.addEventListener('start', () => {
            blocker.style.display = '';
        });
        this.controls.addEventListener('end', () => {
            blocker.style.display = 'none';
        });
    }

    cssRenderer() {
        this.rendererCSS = new CSS3DRenderer()
        this.rendererCSS.setSize(this.sizes.width, this.sizes.height)
        this.rendererCSS.domElement.style.position = 'absolute'
        this.rendererCSS.domElement.style.top = 0
        document.body.appendChild(this.rendererCSS.domElement)
    }

    resize() {
        this.rendererCSS.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.rendererCSS.render(this.scene, this.camera.instance);
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

    play(id) {
        this.texture = this.mediaItems[id].item
        this.material.map = this.texture
        this.plane.material = this.material
        this.scene.add(this.plane)
    }
}