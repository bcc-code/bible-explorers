import * as THREE from 'three'
import Experience from '../Experience.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

export default class Composer {
    constructor() {
        this.experience = new Experience()
        this.renderer = this.experience.renderer
        this.camera = this.experience.camera
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.debug = this.experience.debug

        this.postprocessing = {}

        this.params = {
            // UnrealBloom
            bloomStrength: 0.19,
            bloomThreshold: 0,
            bloomRadius: 1,

            // Bokeh
            focus: 40.0,
            aperture: 0.7,
            maxblur: 0.01
        }

        this.setInstance()
        this.setRenderPass()
        this.setOutlinePass()
        this.setEffectFXAA()
        this.setUnrealBloomPass()
        this.setBokehPass()

        this.matChanger = () => {
            this.bokehPass.materialBokeh.uniforms['focus'].value = this.params.focus
            this.bokehPass.materialBokeh.uniforms['aperture'].value = this.params.aperture * 0.00001;
            this.bokehPass.materialBokeh.uniforms['maxblur'].value = this.params.maxblur
        }
        
        this.matChanger()

        if (this.debug.active) {
            this.addGUIControls()
        }
    }

    setInstance() {
        this.instance = new EffectComposer(this.renderer.instance)
    }

    setRenderPass() {
        this.renderPass = new RenderPass(this.scene, this.camera.instance)
        this.instance.addPass(this.renderPass)
    }

    setOutlinePass() {
        this.outlinePass = new OutlinePass(new THREE.Vector2(this.sizes.width, this.sizes.height), this.scene, this.camera.instance)
        this.instance.addPass(this.outlinePass)
    }

    setEffectFXAA() {
        this.effectFXAA = new ShaderPass(FXAAShader)
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.sizes.width, 1 / this.sizes.height)
        this.instance.addPass(this.effectFXAA)
    }

    setUnrealBloomPass() {
        this.unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(this.sizes.width, this.sizes.height), 0.19, 0.1, 0)
        this.unrealBloomPass.threshold = this.params.bloomThreshold
        this.unrealBloomPass.strength = this.params.bloomStrength
        this.unrealBloomPass.radius = this.params.bloomRadius
        this.instance.addPass(this.unrealBloomPass)

    }

    setBokehPass() {
        this.bokehPass = new BokehPass(this.scene, this.camera.instance, {
            focus: 1.0,
            aperture: 0.025,
            maxblur: 0.01,

            width: this.sizes.width,
            height: this.sizes.height
        })

        this.instance.addPass(this.bokehPass)
    }

    addGUIControls() {
        const unrealBloomPass = this.debug.ui.addFolder('unrealBloomPass')

        unrealBloomPass.add(this.params, 'bloomThreshold', 0.0, 1.0).onChange((value) => { this.unrealBloomPass.threshold = Number(value) })
        unrealBloomPass.add(this.params, 'bloomStrength', 0.0, 3.0).onChange((value) => { this.unrealBloomPass.strength = Number(value) })
        unrealBloomPass.add(this.params, 'bloomRadius', 0.0, 1.0).onChange((value) => { this.unrealBloomPass.radius = Number(value) })

        const bokehPass = this.debug.ui.addFolder('Depth of field')

        bokehPass.add(this.params, 'focus', 10.0, 100.0, 10).onChange((val) => {
            this.bokehPass.materialBokeh.uniforms['focus'].value = val
        })
        bokehPass.add(this.params, 'aperture', 0, 10, 0.1).onChange((val) => {
            this.bokehPass.materialBokeh.uniforms['aperture'].value = val * 0.00001
        })
        bokehPass.add(this.params, 'maxblur', 0.0, 0.01, 0.001).onChange((val) => {
            this.bokehPass.materialBokeh.uniforms['maxblur'].value = val
        })

        console.log(this.bokehPass);

    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.sizes.width, 1 / this.sizes.height)
    }

    update() {
        this.instance.render()
    }
}