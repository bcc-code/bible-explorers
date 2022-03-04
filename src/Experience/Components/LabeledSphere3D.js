import * as THREE from 'three'
import { Text } from 'troika-three-text'

export default class LabeledSphere3D extends THREE.Object3D {
    constructor({ labelText, size, color }) {

        super()

        this.label = new Text()
        // Setup
        this.setInstance(size, color)
        this.label.text = labelText
        this.updateText()
    }

    setInstance(size, color) {
        this.geometry = new THREE.SphereBufferGeometry(size, 16, 16)
        this.material = new THREE.MeshBasicMaterial({ color })
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.add(this.mesh)
    }

    setPosition(newPos) {
        this.mesh.position.set(newPos.x, newPos.y, newPos.z)
        this.label.position.x = newPos.x
        this.label.position.y = newPos.y + 0.3
        this.label.position.z = newPos.z
    }

    updateText() {
        this.label.anchorY = 'bottom'
        this.label.anchorX = 'center'
        this.label.fontSize = 0.1
        this.label.color = 0xffffff
        this.label.outlineColor = 0x000000
        this.label.outlineWidth = '4%'
        this.add(this.label)
    }

}