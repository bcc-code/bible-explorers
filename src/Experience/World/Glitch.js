import * as THREE from 'three'
import Experience from "../Experience.js";
import TWEEN from '@tweenjs/tween.js'

let instance = null

export default class Glitch {

    constructor() {

        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera.instance

        // Setup
        this.resource = this.resources.items.glitch

        this.getViewSize()
        this.setModel()
    }

    setModel() {
        this.model = this.resource.scene

        const baked = this.resources.items.glitch_baked

        this.model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshBasicMaterial({ map: baked })
                child.material.map.flipY = false
            }
        })

        this.model.position.set(-5, 0, -3)
        this.camera.add(this.model)
    }

    getViewSize() {
        this.cameraAspect = this.camera.aspect;
        this.cameraHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
        this.cameraWidth = this.cameraHeight * this.cameraAspect;
    }

    addInView() {
        new TWEEN.Tween(this.model.position)
            .to({ x: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }

    removeFromView() {
        new TWEEN.Tween(this.model.position)
            .to({ x: -5 }, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
    }

    update() {
        this.model.lookAt(this.camera.position)
    }
}

const PIXEL_RATIO = (function () {
    var ctx = document.createElement('canvas').getContext('2d'),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
    return dpr / bsr;
})();


const createRetinaCanvas = function (w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement('canvas');
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + 'px';
    can.style.height = h + 'px';
    can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}