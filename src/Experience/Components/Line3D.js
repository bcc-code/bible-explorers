import * as THREE from 'three'

export default class Line3D extends THREE.Object3D {
    constructor() {
        super()

        this.drawLine()
    }

    drawLine() {
        this.geometry = new THREE.BufferGeometry().setFromPoints([])
        this.material = new THREE.LineBasicMaterial({
            color: new THREE.Color().setRGB(0.65, 0.792, 0.219)
        })

        this.line = new THREE.Line(this.geometry, this.material)
        this.add(this.line)
    }

    updateLinePos(start, stop) {
        if (!this.line) return

        this.line.geometry.setFromPoints([start, stop])
        this.line.geometry.attributes.position.needsUpdate = true
    }
}