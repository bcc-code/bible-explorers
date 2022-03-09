import * as THREE from 'three'

export default class Model3D extends THREE.Object3D {
    constructor() {
        super()

        this.modelMaterial = null
    }

    setModel(el) {
        this.model = el
        this.add(this.model)
    }

    setMaterial(material) {
        this.modelMaterial = material
    }
}