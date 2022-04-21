import * as THREE from 'three'
import Experience from '../Experience.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'

export default class Composer {
    constructor() {
        this.experience = new Experience()
        this.renderer = this.experience.renderer
        this.camera = this.experience.camera
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.debug = this.experience.debug

        this.setInstance()
        this.setRenderPass()
        this.setOutlinePass()
        this.setEffectFXAA()
        this.setGammaCorrection()

    }

    setInstance() {
        this.instance = new EffectComposer(this.renderer.instance)
    }

    setRenderPass() {
        this.renderPass = new RenderPass(this.scene, this.camera.instance)
        this.instance.addPass(this.renderPass)

    }

    setEffectFXAA() {
        this.effectFXAA = new ShaderPass(FXAAShader)
        this.effectFXAA.uniforms.resolution.value.set(1 / this.sizes.width, 1 / this.sizes.height)
        this.instance.addPass(this.effectFXAA)
    }

    setGammaCorrection() {
        this.gammeCorrection = new ShaderPass(GammaCorrectionShader)
        this.instance.addPass(this.gammeCorrection)
    }

    setOutlinePass() {
        this.outlinePass = new OutlinePass(new THREE.Vector2(this.sizes.width, this.sizes.height), this.scene, this.camera.instance)
        this.instance.addPass(this.outlinePass)
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.sizes.width, 1 / this.sizes.height)
    }

    update() {
        this.instance.render()
    }
}