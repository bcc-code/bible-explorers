import * as THREE from 'three'
import Experience from "../Experience.js";
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export default class Video {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.camera = this.experience.camera
        this.renderer = this.experience.renderer
        this.controls = this.experience.camera.controls

        this.css3Renderer = new CSS3DRenderer()
        this.customCamera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1 )

        // this.mediaItems = this.resources.mediaItems

        // Setup
        // this.setInstance()
        // this.setControls()


        this.cssScene = null
        this.rendererCSS = null
        this.init()
    }

    init() {
        // let container = document.getElementById('container');
        // this.css3Renderer.setSize( window.innerWidth, window.innerHeight );
        // container.appendChild(this.css3Renderer.domElement);

        // const btvVideo = this.createElement('series/1680', 50, 10, 0, -1 * Math.PI * 0.5);
        // this.scene.add(btvVideo);



        var planeMaterial   = new THREE.MeshBasicMaterial({opacity: 0 });
        var planeWidth = 16;
        var planeHeight = 9;
        var planeGeometry = new THREE.PlaneGeometry(16, 9)
        var planeMesh= new THREE.Mesh( planeGeometry, planeMaterial );
        planeMesh.position.set(17, 3, 0)
        planeMesh.rotation.y -= Math.PI * 0.5
        this.scene.add(planeMesh);
        
        // create a new scene to hold CSS
        this.cssScene = new THREE.Scene();
        // create the iframe to contain webpage
        var element	= document.createElement('iframe')
        // webpage to be loaded into iframe
        element.src = 'https://brunstad.tv/series/1680'

        // width of iframe in pixels
        var elementWidth = 1024;
        // force iframe to have same relative dimensions as planeGeometry
        var aspectRatio = planeHeight / planeWidth;
        var elementHeight = elementWidth * aspectRatio;
        element.style.width  = elementWidth + "px";
        element.style.height = elementHeight + "px";
        element.style.position = 'relative'
        element.style.zIndex = '3'
        
        // create a CSS3DObject to display element
        var cssObject = new CSS3DObject( element );
        // synchronize cssObject position/rotation with planeMesh position/rotation 
        cssObject.position.copy(planeMesh.position)
        cssObject.rotation.copy(planeMesh.rotation)
        // resize cssObject to same size as planeMesh (plus a border)
        var percentBorder = 0.05;
        cssObject.scale.x /= (1 + percentBorder) * (elementWidth / planeWidth);
        cssObject.scale.y /= (1 + percentBorder) * (elementWidth / planeWidth);
        this.cssScene.add(cssObject);
        
        // create a renderer for CSS
        this.rendererCSS	= new CSS3DRenderer();
        this.rendererCSS.setSize( window.innerWidth, window.innerHeight );
        this.rendererCSS.domElement.style.position = 'absolute';
        this.rendererCSS.domElement.style.top	  = 0;
        this.rendererCSS.domElement.style.margin	  = 0;
        this.rendererCSS.domElement.style.padding  = 0;
        this.rendererCSS.domElement.style.transformStyle  = "preserve-3d";
        document.body.appendChild( this.rendererCSS.domElement );
    
        this.rendererCSS.domElement.appendChild( this.renderer.instance.domElement );
    }

    createElement(id, x, y, z, ry) {
        const div = document.createElement('div')
        div.style.width = '480px'
        div.style.height = '360px'
        div.style.backgroundColor = '#fff'

        const iframe = document.createElement('iframe')
        iframe.style.width = '480px'
        iframe.style.height = '360px'
        iframe.style.border = '0px'
        iframe.src = 'https://brunstad.tv/' + id
        div.appendChild(iframe)

        const object = new CSS3DObject(div)
        object.position.set(x, y, z)
        object.rotation.y = ry

        return object
    }

    update() {
        if (this.rendererCSS) {
            this.rendererCSS.render( this.cssScene, this.camera.instance );
        }
    }

    setInstance() {
        this.texture = this.mediaItems[0].item
        this.geometry = new THREE.PlaneGeometry(16, 9)
        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            side: THREE.DoubleSide
        })
        this.plane = new THREE.Mesh(this.geometry, this.material)
        this.plane.position.set(17, 3, 0)
        this.plane.color = new THREE.Color({ color: '0xff0000' })
        this.plane.rotation.y -= Math.PI * 0.5
        this.scene.add(this.plane)
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