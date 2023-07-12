import Experience from '../Experience.js'
import _s from '../Utils/Strings.js'
import _gl from '../Utils/Globals.js'
import _e from '../Utils/Events.js'

import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'

let instance = null
let q = new THREE.Quaternion()

const clock = new THREE.Clock()

export default class MazeGame {
    constructor() {
        instance = this

        this.experience = new Experience()
        this.world = this.experience.world
        this.debug = this.experience.debug
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.resources = this.experience.resources
    }

    toggleGame() {
        instance.program = instance.world.program
        instance.currentStepData = instance.program.getCurrentStepData()

        this.experience.gameIsOn = true
        document.querySelector('.cta').style.display = 'none'

        this.initSettings()
        this.initHtml()
        this.setEventListeners()

        this.time.on('animation', () => {
            this.update()
        })

        this.sizes.on('resize', () => {
            this.resize()
        })
    }

    initSettings() {
        // Options
        this.options = {
            gameState: 'initialize',
            gameLevel: 0,
            gameLevels: 5,
            mainGameEnded: false
        }

        this.player = {
            localVelocity: new CANNON.Vec3(),
            moveDistance: 10,
        }

        this.maze = {
            entrancePosition: [],
            exitPosition: [],
            wallSize: 0.5, // width, height and depth
        }
    }

    addInstructions() {
        const texture = this.resources.items.instructions

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true
        })
        const geometry = new THREE.PlaneGeometry(0.3, 0.5)

        const mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.x = this.maze.entrancePosition[0] - 0.75
        mesh.position.y = 0.1
        mesh.position.z = this.maze.entrancePosition[1]
        this.scene.add(mesh)
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        const newLevel = document.querySelector('#new-level')
        newLevel.addEventListener('click', () => {
            instance.options.gameState = 'initialize'
            instance.newLevel()
        })

        const skipBTN = document.querySelector('[aria-label="skip-button"]')
        skipBTN.addEventListener('click', () => {
            instance.destroy()
            instance.program.nextStep()
        })

        if (this.debug.developer || this.debug.onPreviewMode())
            skipBTN.style.display = 'flex'
    }

    initHtml() {
        const game = _gl.elementFromHtml(`
        <section class="game maze-game">
            <div class="container">
                <button class="btn default" aria-label="skip-button" style="display: none">${_s.miniGames.skip}</button>
                <div class="game-rounds">${_s.miniGames.level} ${this.options.gameLevel + 1}</div>

                <div class="game-popup">
                    <h1>${_s.miniGames.completed.title}</h1>
                    <div class="buttons">
                        <button id="new-level" class="btn default next pulsate">${_s.miniGames.nextRound}</button>
                    </div>
                </div>

                <div class="game-labels">
                    <span id="start-label"></span>
                    <span id="exit-label"></span>
                </div>
            </div>
            <div class="overlay"></div>
            <div id="maze-canvas" class="game-canvas"></div>
        </section>`)

        document.querySelector('.ui-container').append(game)
        document.querySelector('.game-popup').style.display = 'none'
    }

    initScene() {
        this.scene = new THREE.Scene()

        this.addCamera()
        this.addLight()
        this.addRenderer()

        // add elements
        this.addFloor()
        this.addMaze(
            this.options.gameLevel,
            this.maze.wallSize
        )

        this.addPlayer()
        this.addBox()

        if (this.options.gameLevel == 0)
            this.addInstructions()

    }

    initCannon() {
        this.cannon = new CANNON.World()
        this.cannon.broadphase = new CANNON.SAPBroadphase(this.cannon)
        this.cannon.gravity = new CANNON.Vec3(0, -9.82, 0)
    }

    initCannonDebugger() {
        this.cannonDebugger = new CannonDebugger(this.scene, this.cannon, {
            // options...
        })
    }

    addCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100)
        this.camera.position.set(1, 1.5, 1)
        this.camera.lookAt(new THREE.Vector3(1, 0, 1))
    }

    addLight() {
        this.light = new THREE.PointLight('#ffffff', 2, 5)
        // this.light = new THREE.AmbientLight('#ffffff')
        this.light.position.set(0, 0.65, 0)
        this.scene.add(this.light)
    }

    addFloor() {
        const texture = this.resources.items.floor
        texture.flipY = false
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);

        const geometry = new THREE.PlaneGeometry(50, 50)
        const material = new THREE.MeshStandardMaterial({ map: texture })
        this.groundMesh = new THREE.Mesh(geometry, material)
        this.groundMesh.rotation.x = -Math.PI * 0.5 // make it face up
        this.groundMesh.receiveShadow = true
        this.scene.add(this.groundMesh)

        this.groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() })
        this.groundBody.quaternion.setFromEuler(-Math.PI * 0.5, 0, 0) // make it face up
        this.cannon.addBody(this.groundBody)
    }

    addPlayer() {
        const texture = this.resources.items.glitch_baked
        texture.flipY = false
        texture.colorSpace = THREE.SRGBColorSpace

        const material = new THREE.MeshBasicMaterial({ map: texture })

        this.playerMesh = this.resources.items.glitch.scene
        this.playerMesh.traverse((child) => {
            child.material = material
        })

        this.playerMesh.position.x = this.maze.entrancePosition[0]
        this.playerMesh.position.y = this.maze.wallSize
        this.playerMesh.position.z = this.maze.entrancePosition[1]
        this.playerMesh.rotation.x = -Math.PI / 4
        this.scene.add(this.playerMesh)

        const boundingBox = new THREE.Box3().setFromObject(this.playerMesh)
        const size = boundingBox.getSize(new THREE.Vector3())

        const shape = new CANNON.Sphere(size.x / 2)
        this.playerBody = new CANNON.Body({
            mass: 1,
            shape,
            linearDamping: 0.25,
            angularDamping: 1,
        })
        this.playerBody.position.copy(this.playerMesh.position)
        this.cannon.addBody(this.playerBody)
    }

    addBox() {
        const texture = this.resources.items.mazeBoxBaked
        texture.flipY = false
        texture.colorSpace = THREE.SRGBColorSpace

        const material = new THREE.MeshBasicMaterial({ map: texture })

        this.boxMesh = this.resources.items.mazeBox.scene
        this.boxMesh.traverse((child) => {
            child.material = material
        })

        this.boxMesh.position.x = this.maze.exitPosition[0]
        this.boxMesh.position.y = 0.15
        this.boxMesh.position.z = this.maze.exitPosition[1]
        this.scene.add(this.boxMesh)

        const boundingBox = new THREE.Box3().setFromObject(this.boxMesh)
        const boxSize = boundingBox.getSize(new THREE.Vector3())

        const shape = new CANNON.Box(new CANNON.Vec3(boxSize.x / 2, boxSize.y / 2, boxSize.z / 2))
        this.boxBody = new CANNON.Body({
            mass: 0,
            shape,
            isTrigger: true
        })
        this.boxBody.position.copy(this.boxMesh.position)
        this.cannon.addBody(this.boxBody)

    }

    addMaze(idx, wallSize) {

        const textureSide = this.resources.items.cubeMapSide
        const textureTop = this.resources.items.cubeMapTop

        const materialCube = [
            new THREE.MeshStandardMaterial({
                map: textureSide
            }),
            new THREE.MeshStandardMaterial({
                map: textureSide
            }),
            new THREE.MeshStandardMaterial({
                map: textureTop
            }),
            new THREE.MeshStandardMaterial({
                map: textureSide
            }),
            new THREE.MeshStandardMaterial({
                map: textureSide
            }),
            new THREE.MeshStandardMaterial({
                map: textureSide
            })
        ]

        const geometries = []

        this.mazeBody = new CANNON.Body({ mass: 0 })

        mazeArr[idx].forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell == 1) {
                    const dummy = new THREE.BoxGeometry(wallSize, wallSize, wallSize)
                    dummy.translate(c * wallSize, wallSize * 0.5, r * wallSize)
                    geometries.push(dummy)

                    const shape = new CANNON.Box(new CANNON.Vec3(wallSize * 0.5, wallSize * 0.5, wallSize * 0.5))
                    this.mazeBody.addShape(shape, new CANNON.Vec3(c * wallSize, wallSize * 0.5, r * wallSize))
                }

                if (cell == 2) {
                    const shape = new CANNON.Box(new CANNON.Vec3(wallSize * 0.5, wallSize * 0.5, wallSize * 0.5))
                    // If entrance on left
                    if (c == 0) {
                        this.mazeBody.addShape(shape, new CANNON.Vec3(c * wallSize - wallSize, wallSize * 0.5, r * wallSize))
                    }

                    // If entrance on top
                    if (r == 0) {
                        this.mazeBody.addShape(shape, new CANNON.Vec3(c * wallSize, wallSize * 0.5, r * wallSize - wallSize))
                    }

                    // If entrance on bottom
                    if (r == row.length - 1) {
                        this.mazeBody.addShape(shape, new CANNON.Vec3(c * wallSize, wallSize * 0.5, r * wallSize + wallSize))
                    }

                    // If entrance on right
                    if (c == row.length - 1) {
                        this.mazeBody.addShape(shape, new CANNON.Vec3(c * wallSize + wallSize, wallSize * 0.5, r * wallSize))
                    }

                    this.maze.entrancePosition = [c * wallSize, r * wallSize]
                }

                if (cell == 3) {
                    this.maze.exitPosition = [c * wallSize, r * wallSize]
                }
            })
        })

        const texture = this.resources.items.cubeMapTop
        const material = new THREE.MeshStandardMaterial({ map: texture })
        const geometry = BufferGeometryUtils.mergeGeometries(geometries, false)
        this.mazeMesh = new THREE.Mesh(geometry, material)
        this.mazeMesh.castShadow = true
        this.scene.add(this.mazeMesh)

        this.mazeBody.position.copy(this.mazeMesh.position)
        this.cannon.addBody(this.mazeBody)
    }

    addRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(this.sizes.pixelRatio)
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.querySelector('#maze-canvas').appendChild(this.renderer.domElement)
        this.renderer.domElement.classList.add('maze-webgl')
    }

    resize() {
        if (document.querySelector('#maze-canvas')) {
            this.camera.aspect = this.sizes.width / this.sizes.height
            this.camera.updateProjectionMatrix()

            this.renderer.setSize(this.sizes.width, this.sizes.height)
            this.renderer.setPixelRatio(this.sizes.pixelRatio)
        }
    }

    destroy() {
        document.querySelector('.game')?.remove()
        instance.experience.gameIsOn = false
    }

    newLevel() {
        // Traverse the whole scene
        this.scene.traverse((child) => {

            // Test if it's a mesh
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose()

                // Loop through the material properties
                for (const key in child.material) {
                    const value = child.material[key]

                    // Test if there is a dispose function
                    if (value && typeof value.dispose === 'function') {
                        value.dispose()
                    }
                }
            }
        })

        this.renderer.dispose()

        document.querySelector('.maze-webgl')?.remove()
    }

    updateWorld() {
        this.cannon.fixedStep()
        // this.cannonDebugger.update()

        const elapsedTime = clock.getElapsedTime()

        this.playerMesh.position.copy(this.playerBody.position)

        this.boxMesh.position.copy(this.boxBody.position)
        this.boxMesh.rotation.y = elapsedTime

        this.player.localVelocity.set(this.player.moveDistance * 0.2, 0, this.player.moveDistance * 0.2);
        const cannonVelocity = this.playerBody.quaternion.vmult(this.player.localVelocity);

        if (this.options.gameState === 'fade out') {
            q.setFromAxisAngle(new THREE.Vector3(1, 0, 0).normalize(), THREE.MathUtils.degToRad(-75))
        } else {
            q.setFromAxisAngle(new THREE.Vector3(1, 0, 0).normalize(), THREE.MathUtils.degToRad(-35))
        }

        if (keys.arrowleft || keys.a) {
            this.playerBody.velocity.x = -cannonVelocity.x
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(-90));
        }

        if (keys.arrowright || keys.d) {
            this.playerBody.velocity.x = cannonVelocity.x
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(90));
        }

        if (keys.arrowup || keys.w) {
            this.playerBody.velocity.z = -cannonVelocity.z;
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(180));
        }

        if (keys.arrowdown || keys.s) {
            this.playerBody.velocity.z = cannonVelocity.z;
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(0));
        }

        if (keys.arrowleft && keys.arrowup || keys.a && keys.w) {
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(225));
        }

        if (keys.arrowright && keys.arrowup || keys.d && keys.w) {
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(135));
        }

        if (keys.arrowleft && keys.arrowdown || keys.a && keys.s) {
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(-45));
        }

        if (keys.arrowright && keys.arrowdown || keys.d && keys.s) {
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), THREE.MathUtils.degToRad(45));
        }

        this.playerMesh.quaternion.slerp(q, 0.2);

        this.camera.position.x = this.playerMesh.position.x
        this.camera.position.z = this.playerMesh.position.z

        this.light.position.x = this.playerMesh.position.x
        this.light.position.z = this.playerMesh.position.z
    }

    update() {
        switch (this.options.gameState) {
            case 'initialize':
                // Setup
                this.initCannon()
                this.initScene()
                this.initCannonDebugger()

                this.playerMesh.visible = false
                this.light.intensity = 0

                document.querySelector('.maze-game').classList.remove('popup-visible')
                document.querySelector('.game-popup').style.display = 'none'

                if (this.options.gameLevel == this.options.gameLevels) {
                    this.options.mainGameEnded = true
                }

                if (this.options.mainGameEnded) {
                    document.querySelector('.game-rounds').style.display = 'none'
                } else {
                    document.querySelector('.game-rounds').innerHTML = `${_s.miniGames.level} ${this.options.gameLevel + 1}`
                }

                if (this.options.gameLevel < mazeArr.length - 1) {
                    this.options.gameLevel++
                } else {
                    this.options.gameLevel = 1
                }

                this.options.gameState = 'fade in'
                break;

            case 'fade in':
                this.updateWorld()

                this.playerMesh.visible = true
                this.light.intensity += 0.1 * (1.0 - this.light.intensity);
                if (Math.abs(this.light.intensity - 1.0) < 0.05) {
                    this.light.intensity = 1.0;
                    this.options.gameState = 'play'
                }

                this.renderer.render(this.scene, this.camera)
                break;

            case 'play':
                this.updateWorld()

                // Check for victory
                this.boxBody.addEventListener('collide', (e) => {
                    if (e.body === this.playerBody) {
                        this.mazeMesh.visible = false
                        this.boxMesh.visible = false
                        this.options.gameState = 'fade out'
                    }
                }, false)

                this.renderer.render(this.scene, this.camera)
                break;

            case 'fade out':
                this.updateWorld()

                this.light.intensity += 0.1 * (0.0 - this.light.intensity);
                if (Math.abs(this.light.intensity - 0.0) < 0.1) {
                    this.light.intensity = 0.2;

                    if (this.options.gameLevel < this.options.gameLevels) {
                        this.options.gameState = 'congrats'
                    } else {
                        this.options.gameState = 'end game'
                    }
                }

                this.renderer.render(this.scene, this.camera)
                break;

            case 'congrats':
                document.querySelector('.maze-game')?.classList.add('popup-visible')

                if (document.querySelector('.game-popup'))
                    document.querySelector('.game-popup').style.display = 'block'

                break;

            case 'end game':
                document.querySelector('.maze-game')?.classList.add('popup-visible')

                if (document.querySelector('.game-popup'))
                    document.querySelector('.game-popup').style.display = 'block'

                document.querySelector('.cta').style.display = 'flex'

                break;
        }
    }
}

const mazeArr = [
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [2, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 3],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 3],
        [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        [2, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 3],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [2, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [2, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [2, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 3],
        [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
        [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
        [2, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 3],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
]

// Movement keys
let keys = {
    arrowleft: false,
    arrowdown: false,
    arrowright: false,
    arrowup: false,
    a: false,
    s: false,
    d: false,
    w: false,
}

document.body.addEventListener('keydown', (e) => {
    const key = e.code.replace('Key', '').toLowerCase()
    if (keys[key] !== undefined) keys[key] = true
})

document.body.addEventListener('keyup', (e) => {
    const key = e.code.replace('Key', '').toLowerCase()
    if (keys[key] !== undefined) keys[key] = false
})

