import Experience from '../Experience.js'
import Konva from 'konva'
import _s from '../Utils/Strings.js'
import Modal from '../Utils/Modal.js'
import Timer from '../Extras/Timer.js'
import { update } from '@tweenjs/tween.js'
import { RedFormat } from 'three'

let instance = null

export default class CableConnector {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.program = this.world.program
        this.audio = this.world.audio
        this.sizes = this.experience.sizes
        this.debug = this.experience.debug

        instance = this

        this.data = {
            stage: {
                width: 1175,
                height: 548
            },
            assets: {
                outlet_blue: 'outlet_blue.png',
                outlet_lightblue: 'outlet_lightblue.png',
                outlet_yellow: 'outlet_yellow.png',
                outlet_purple: 'outlet_purple.png',
                outlet_pink: 'outlet_pink.png',
                plug_blue: 'plug_blue.png',
                plug_lightblue: 'plug_lightblue.png',
                plug_yellow: 'plug_yellow.png',
                plug_purple: 'plug_purple.png',
                plug_pink: 'plug_pink.png',
                side_left: 'side_left.png',
                side_right: 'side_right.png',
                background: 'background.png',
                warning_sign: 'warning_sign.png',
                warning_sign_wrong: 'warning_sign_wrong.png',
                explosion: 'explosion.png',
                sparkles: 'sparkles.png',
            },
            items: {
                name: [
                    'darkBlue',
                    'lightBlue',
                    'yellow',
                    'purple',
                    'pink'
                ],
                color: [
                    "#23307a",
                    "#2b78c3",
                    "#fcb04e",
                    "#9f4096",
                    "#f75b99"
                ]
            },
            animation: {
                width: 180,
                height: 100,
                steps: []
            },
            itemsLength: 5
        }

        this.data.animation.steps = [
            0, 0, this.data.animation.width, this.data.animation.height,
            this.data.animation.width * 2, 0, this.data.animation.width, this.data.animation.height,
            this.data.animation.width * 3, 0, this.data.animation.width, this.data.animation.height,
        ]

        this.cables = []
        this.outlets = []

        this.randomOrder = {
            outlet_l: getRandomOrder(this.data.itemsLength),
            cable: getRandomOrder(this.data.itemsLength),
            outlet_r: getRandomOrder(this.data.itemsLength)
        }


    }

    toggleCableConnector() {
        this.html()
        this.loadImages(this.data.assets, this.initStage)
        // to decomment
        // this.startTimerIfNecessary()
        // this.setup()
        this.addEventListeners()
        window.addEventListener('resize', instance.resize)
    }

    html() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "cable-connector")
        gameWrapper.classList.add('miniGame')
        document.body.appendChild(gameWrapper)

        const gameContainer = document.createElement('div')
        gameContainer.setAttribute("id", "container")
        gameWrapper.appendChild(gameContainer)

        const title = document.createElement('div')
        title.classList.add('heading')
        title.innerHTML = "<h2>" + _s.miniGames.cableConnect + "</h2>"

        const actions = document.createElement('div')
        actions.classList.add('miniGame__actions')

        gameWrapper.appendChild(title)
        gameWrapper.appendChild(actions)

        actions.appendChild(
            this.addButton('button__back', 'button__default', _s.journey.back)
        )
        actions.appendChild(
            this.addButton('button__reset', 'button__default', _s.miniGames.reset)
        )

        if (instance.debug.active) {
            actions.appendChild(
                this.addButton('button__skip', 'button__default', _s.miniGames.skip)
            )
        }
        document.body.classList.add('freeze')

    }

    loadImages(sources, callback) {
        const assetDir = 'games/cable-connect/assets/'
        const images = {}
        let loadedImages = 0
        let numImages = 0

        for (let src in sources) {
            numImages++
        }

        for (let src in sources) {
            images[src] = new Image()
            images[src].onload = () => {
                if (++loadedImages >= numImages) callback(images)
            }
            images[src].src = assetDir + sources[src]
        }
    }

    initStage(images) {



        instance.program = instance.world.program

        //#region stage

        instance.stage = new Konva.Stage({
            container: 'container',
            width: instance.data.stage.width,
            height: instance.data.stage.height
        })

        const cableWidth = instance.stage.width() / 6
        const outletWidth = 49
        const outletHeight = 74
        const plugWidth = 90.5
        const plugHeight = 66
        const sideWidth = instance.stage.width() / 5.5

        const outlets = []
        const plugs = []

        for (let key in images) {
            const privKey = key
            const item = images[key]

            if (privKey.includes('outlet')) {
                outlets.push(item)
            }

            if (privKey.includes('plug')) {
                plugs.push(item)
            }
        }
        
        const layer = new Konva.Layer()

        const background = new Konva.Image({
            image: images['background'],
            width: instance.stage.width(),
            height: instance.stage.height()
        })
        const sideLeft = new Konva.Image({
            image: images['side_left'],
            width: sideWidth,
            height: instance.stage.height()
        })
        const sideRight = new Konva.Image({
            image: images['side_right'],
            x: instance.stage.width() - sideWidth,
            width: sideWidth,
            height: instance.stage.height()
        })
        layer.add(background, sideLeft, sideRight)

        const positionY = (index, objHeight) => {
            const spaceLeft = instance.stage.height() - (objHeight * instance.data.itemsLength)
            const spaceBetween = spaceLeft / (instance.data.itemsLength + 1)
            return spaceBetween + index * (objHeight + spaceBetween)
        }

        for (let key in plugs) {
            const plugImage = plugs[key]
            const cable = new Konva.Group({ name: 'cable' })

            function buildAnchor(x, y) {
                const anchor = new Konva.Circle({
                    x: x,
                    y: y,
                    // radius: 10,
                    // fill: 'red',
                    // draggable: true
                })
                cable.add(anchor)

                anchor.on('dragmove', () => {
                    updateLines(bezier)
                })

                return anchor
            }

            function buildPlug(x, y, position) {
                const plug = new Konva.Image({
                    image: plugImage,
                    x: x,
                    y: y,
                    width: plugWidth,
                    height: plugHeight,
                    // fill: 'red',
                    shadowColor: '#fff',
                    draggable: true,
                })

                if (position == 'left') {
                    plug.scaleX(-1)
                } else if (position == 'right') {
                    plug.scaleX(1)
                }

                cable.add(plug)

                plug.on('mouseover', () => {
                    document.body.style.cursor = "pointer"
                    plug.shadowBlur(10)
                })

                plug.on('mouseout', () => {
                    document.body.style.cursor = "default"
                    plug.shadowBlur(0)
                })

                plug.on('dragmove', () => {
                    updateLines(bezier)
                })

                return plug
            }

            const bezierLine = new Konva.Shape({
                stroke: instance.data.items.color[key],
                strokeWidth: 20,
                lineCap: 'round',
                name: 'cord',
                sceneFunc: (ctx, shape) => {
                    ctx.beginPath()
                    ctx.moveTo(bezier.start.x(), bezier.start.y() + plugHeight / 2)
                    ctx.bezierCurveTo(
                        bezier.control1.x(),
                        bezier.control1.y(),
                        bezier.control2.x(),
                        bezier.control2.y(),
                        bezier.end.x(),
                        bezier.end.y() + plugHeight / 2
                    )
                    ctx.fillStrokeShape(shape)
                },
            })

            const bezierLinePath = new Konva.Line({
                // stroke: 'red',
                // strokeWidth: 2,
                id: 'bezierLinePath',
                points: [0, 0]
            })

            cable.add(bezierLinePath, bezierLine)

            const posX1 = instance.stage.width() / 2 - cableWidth / 2
            const posX2 = instance.stage.width() / 2 + cableWidth / 2
            const posY = positionY(key, plugHeight)

            const bezier = {
                start: buildPlug(posX1, posY, 'left'),
                control1: buildAnchor(posX1 + 100, posY + plugHeight / 2),
                control2: buildAnchor(posX2 - 100, posY + plugHeight / 2),
                end: buildPlug(posX2, posY, 'right')
            }

            instance.cables.push(cable)
            layer.add(cable)
        }

        for (let key in outlets) {
            const outletImage = outlets[key]

            function buildOutlet(x, y, position) {
                const outlet = new Konva.Image({
                    image: outletImage,
                    x: x,
                    y: positionY(key, outletHeight),
                    width: outletWidth,
                    height: outletHeight,
                    name: position
                })

                instance.outlets.push(outlet)
                layer.add(outlet)

                return outlet
            }

            buildOutlet(sideLeft.width(), positionY(key, outletHeight))
            buildOutlet(sideRight.x() - outletWidth, positionY(key, outletHeight))
        }

        const updateLines = (bezier) => {
            const b = bezier
            const bezierLinePath = layer.findOne("#bezierLinePath")

            bezierLinePath.points([
                b.start.x(),
                b.start.y(),
                b.control1.x(),
                b.control1.y(),
                b.control2.x(),
                b.control2.y(),
                b.end.x(),
                b.end.y()
            ])

        }

        // #endregion

        instance.stage.add(layer)
    }


    setup() {
        const layer = new Konva.Layer()

        const containerObj = new Container({
            x: 0,
            y: 0,
            width: this.data.canvas.width,
            height: this.data.canvas.height
        })

        const cablesGroup = new Konva.Group({ name: "cables" })
        const outletsGroup = new Konva.Group({ name: "outlets" })

        this.container = containerObj._draw()
        layer.add(this.container)

        this.triangle = containerObj.item.findOne('.triangle')
        const background = containerObj.item.findOne('.background')
        const outletWidth = background.width() / 12 / 2.5
        const outletHeight = background.height() / 5 - 30
        const cableWidth = background.width() / 2

        this.data.cable.plug.height = outletHeight * 4 / 6
        this.data.cable.plug.width = outletWidth * 2
        this.data.cable.pin.height = outletHeight / 6
        this.data.cable.pin.width = outletWidth - 4

        const spaceLeft = containerObj.height - (outletHeight * this.data.itemsLength)
        const spaceBetween = spaceLeft / (this.data.itemsLength + 1)
        const getY = (index) => spaceBetween + index * (outletHeight + spaceBetween)
        const cableX = containerObj.width / 2 - cableWidth / 2

        for (let i = 0; i < this.data.itemsLength; i++) {
            const outlet_l = new Outlet({
                color: this.data.color.name[instance.randomOrder.outlet_l[i]],
                x: containerObj.sideWidth,
                y: getY(i),
                width: outletWidth,
                height: outletHeight,
                fill: this.data.color.default,
                name: "left"
            })

            const outlet_r = new Outlet({
                color: this.data.color.name[instance.randomOrder.outlet_r[i]],
                x: containerObj.width - containerObj.sideWidth,
                y: getY(i),
                width: outletWidth,
                height: outletHeight,
                fill: this.data.color.default,
                name: "right"
            })

            const cable = new Cable({
                color: this.data.color.name[instance.randomOrder.cable[i]],
                x: cableX,
                y: getY(i) + outletHeight / 2 - this.data.cable.plug.height / 2,
                width: cableWidth,
                fill: this.data.color.default,
                stroke: this.data.color.defaultStroke,
            })

            this.cables.push(cable)
            this.outlets.push(outlet_l, outlet_r)

            outletsGroup.add(outlet_l._draw())
            outletsGroup.add(outlet_r._draw().scaleX(-1))
            cablesGroup.add(cable._draw())
        }

        containerObj.item.add(cablesGroup)
        containerObj.item.add(outletsGroup)

        const sparkleSprite = this.setSprite(this.data.sprite.src.sparkles, 'sparkle')
        const explosionSprite = this.setSprite(this.data.sprite.src.explosion, 'explosion')
        containerObj.item.add(sparkleSprite)
        containerObj.item.add(explosionSprite)

        this.cables.forEach(cable => {
            cable.item.on('dragstart', () => {
                cable.item.zIndex(4)
            })

            cable.item.children.filter(c => c.name().includes('plug')).forEach(plug => {
                plug.on('mouseover', () => {
                    if (plug.draggable()) {
                        cable.item.opacity(0.98)
                        document.body.style.cursor = 'pointer'
                    }
                })

                plug.on('mouseout', () => {
                    if (plug.draggable()) {
                        cable.item.opacity(1)
                        document.body.style.cursor = 'default'
                    }
                })

                plug.on('dragmove', () => {
                    cable._updateDottedLines()

                    const maxX = plug.getParent().x() - containerObj.sideWidth - containerObj.bandWidth
                    const maxY = plug.getParent().y()

                    const minX = plug.getParent().x() - containerObj.width + containerObj.sideWidth + containerObj.bandWidth
                    const minY = plug.getParent().y() - containerObj.height + plug.height() - spaceBetween

                    plug.x(Math.min(Math.max(plug.x(), -maxX), -minX))
                    plug.y(Math.min(Math.max(plug.y(), -maxY), -minY))
                })

                plug.on('dragend', () => {
                    const direction = plug.name().replace('plug_', '')
                    const plugPosition = {
                        x: cable.item.x() + plug.x(),
                        y: cable.item.y() + plug.y()
                    }
                    let correspondingOutlet = instance.outlets.find(o => o.color == cable.color && o.name === direction)

                    if (instance.connectedToOutlet(plugPosition, correspondingOutlet)) {
                        instance.audio.playCorrectSound()
                        instance.playAnimation(correspondingOutlet, sparkleSprite)

                        const plugInPosition = {
                            x: direction == "left"
                                ? correspondingOutlet.position.x + correspondingOutlet.width
                                : correspondingOutlet.position.x - correspondingOutlet.width,
                            y: correspondingOutlet.position.y + correspondingOutlet.height / 2 - instance.data.cable.plug.height / 2
                        }

                        plug.move({
                            x: plugInPosition.x - plugPosition.x,
                            y: plugInPosition.y - plugPosition.y
                        })

                        plug.draggable(false)
                        plug.zIndex(0)
                        correspondingOutlet.connected = true

                        if (instance.bothPlugsConnected(cable)) {
                            cable.item.zIndex(0)
                        }

                        if (instance.allCablesConnected()) {
                            instance.stopTimerIfNecessary()
                            setTimeout(instance.finishGame, 1000)
                        }
                    }
                    else {
                        let outletConnectedTo = null
                        instance.outlets.filter(o => o.color != cable.color && o.name === direction).forEach(otherOutlet => {
                            if (instance.connectedToOutlet(plugPosition, otherOutlet))
                                outletConnectedTo = otherOutlet
                        })

                        if (outletConnectedTo) {
                            instance.audio.playWrongSound()
                            instance.playAnimation(outletConnectedTo, explosionSprite)
                        }
                    }
                })
            })
        })

        this.outlets.forEach(outlet => {
            outlet.item.on('mouseover', () => {
                if (outlet.colorFound) return
                document.body.style.cursor = 'pointer'
                outlet.item.shadowBlur(10)
            })

            outlet.item.on('mouseout', () => {
                document.body.style.cursor = 'default'
                outlet.item.shadowBlur(0)
            })

            outlet.item.on('touchstart click', (event) => {
                if (!outlet.canClick) return
                if (outlet.colorFound) return
                if (outlet.connected) return

                const index = instance.data.color.name.indexOf(outlet.color)

                if (outlet.isVisible) {
                    instance.deselectOutlet(outlet)
                }
                else {
                    const currentVisible = instance.outlets.find(o => o.isVisible === true && o.colorFound === false)
                    instance.selectOutlet(outlet, index)

                    if (!currentVisible) return

                    if (currentVisible.color === outlet.color) {
                        // Same color. Cable gets colored
                        outlet.canClick = false
                        currentVisible.canClick = false
                        outlet.colorFound = true
                        currentVisible.colorFound = true
                        instance.audio.playCorrectSound()

                        instance.colorCable(this.cables.find(c => c.color === outlet.color))
                    }
                    else {
                        // Different colors
                        if (outlet.name === currentVisible.name) {
                            instance.deselectOutlet(currentVisible)
                        }
                        else {
                            // Opposite sides. Show wrong animation
                            instance.stopOutletClick()
                            instance.audio.playWrongSound()

                            instance.animateIcon(this.triangle, '#fe7968', layer, () => {
                                instance.deselectOutlet(currentVisible)
                                instance.deselectOutlet(outlet)
                                instance.startOutletClick()
                            })
                        }
                    }
                }
            })
        })

        this.stage.add(layer)
    }

    animateIcon(obj, fill, layer, callback = () => { }) {
        const amplitude = 5;
        const period = 100;
        const centerX = 0

        const animation = new Konva.Animation((frame) => {
            obj.x(amplitude * Math.sin((frame.time * 2 * Math.PI) / period) + centerX)
            obj.fill(fill)
            obj.opacity(1)
        }, layer)

        animation.start()

        this.tween = new Konva.Tween({
            node: obj,
            duration: 1,
            easing: Konva.Easings.EaseInOut,
            onFinish: () => {
                obj.fill('#fbaf4e')
                obj.opacity(0.35)
                animation.stop()
                callback()
            }
        })

        this.tween.play()
    }

    startTimerIfNecessary() {
        const currentStep = instance.program.currentStep
        const timerInMinutes = instance.world.selectedChapter.program[currentStep].timer

        if (timerInMinutes > 0) {
            this.timer = new Timer()
            this.timer.setMinutes(timerInMinutes)
            document.addEventListener('timeElapsed', instance.onTimeElapsed)
        }
    }

    stopTimerIfNecessary() {
        const currentStep = instance.program.currentStep
        const timerInMinutes = instance.world.selectedChapter.program[currentStep].timer

        if (timerInMinutes > 0) {
            this.timer.destroy()
            document.removeEventListener('timeElapsed', instance.onTimeElapsed)
        }
    }

    onTimeElapsed() {
        instance.toggleTryAgain()
        document.querySelector('.congrats .button__continue').addEventListener('click', () => {
            instance.modal.destroy()
            instance.destroy()
            instance.toggleCableConnector()
        })
    }

    toggleTryAgain() {
        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title">
                    <h1>${_s.miniGames.timeElapsed.title}</h1>
                </div>
                <div class="congrats__chapter-completed">${_s.miniGames.timeElapsed.message}!</div>
                <div class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.reset}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
    }

    colorCable(cable) {
        const index = instance.data.color.name.indexOf(cable.color)
        const plugs = cable.item.find(".plug")
        const cord = cable.item.findOne(".cord")

        plugs.forEach(plug => {
            plug.fill(instance.data.color.hex[index])
            plug.stroke(instance.data.color.stroke[index])

            plug.getParent().draggable(true)
        })

        cord.stroke(instance.data.color.stroke[index])
    }

    selectOutlet(outlet, index) {
        outlet.item.fill(instance.data.color.hex[index])
        outlet.item.stroke(instance.data.color.stroke[index])
        outlet.isVisible = true
    }

    deselectOutlet(outlet) {
        outlet.item.fill(instance.data.color.default)
        outlet.item.stroke(instance.data.color.defaultStroke)
        outlet.isVisible = false
    }

    stopOutletClick() {
        instance.outlets.forEach(o => o.canClick = false)
    }

    startOutletClick() {
        instance.outlets.forEach(o => o.canClick = true)
    }

    playAnimation(obj, spriteObj) {
        const direction = obj.name
        const newPosition = {
            x: direction == "left"
                ? obj.position.x + obj.width + 15
                : obj.position.x - obj.width - 15,
            y: obj.position.y + obj.height / 2
        }

        spriteObj.position(newPosition)
        const animation = spriteObj

        if (animation.isRunning()) {
            animation.stop()
            animation.frameIndex(0)
        }

        animation.visible(true)
        animation.start()

        animation.on('frameIndexChange.konva', function () {
            if (this.frameIndex() == 2) {
                animation.stop()
                animation.visible(false)
            }
        })
    }

    setSprite(src, animation) {
        const image = new Image()
        image.src = src

        return new Konva.Sprite({
            x: 0,
            y: 0,
            width: this.data.sprite.width,
            height: this.data.sprite.height,
            image: image,
            animation: animation,
            animations: this.data.sprite.animations,
            frameRate: 3,
            frameIndex: 0,
            visible: false,
            offset: {
                x: this.data.sprite.width / 2,
                y: this.data.sprite.height / 2
            }
        })
    }

    connectedToOutlet(plugPosition, correspondingOutlet) {
        return Math.abs(plugPosition.x - correspondingOutlet.position.x) < correspondingOutlet.width + 20
            && Math.abs(plugPosition.y - correspondingOutlet.position.y) < correspondingOutlet.height / 2
    }

    bothPlugsConnected(cable) {
        return instance.outlets.filter(o => o.color == cable.color && o.connected).length == 2
    }

    allCablesConnected() {
        return instance.outlets.filter(o => o.connected).length == instance.data.itemsLength * 2
    }

    addEventListeners() {
        const buttons = document.querySelectorAll('.miniGame .button')
        buttons.forEach(button => {
            if (button.classList.contains('button__back')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.world.program.taskDescription.toggleTaskDescription()
                })
            }

            if (button.classList.contains('button__reset')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.toggleCableConnector()
                })
            }

            if (button.classList.contains('button__skip')) {
                button.addEventListener('click', () => {
                    instance.destroy()
                    instance.program.advance()
                })
            }
        })

        // this.resize()
        // window.addEventListener('resize', this.resize)
    }

    addButton(name, background, label) {
        const button = document.createElement('div')
        button.className = "button " + background + ' ' + name
        button.innerHTML = "<span>" + label + "</span>"

        return button
    }

    finishGame() {
        instance.toggleGameComplete()
        instance.audio.playTaskCompleted()

        document.getElementById('continue_journey').addEventListener('click', () => {
            instance.destroy()
            instance.modal.destroy()
            instance.program.advance()
        })
    }

    toggleGameComplete() {
        let html = `<div class="modal__content congrats congrats__miniGame">
            <div class="congrats__container">
                <div class="congrats__title">
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                    <h1>${_s.miniGames.completed.title}</h1>
                    <i class="icon icon-star-solid"></i>
                    <i class="icon icon-star-solid"></i>
                </div>
                <div class="congrats__chapter-completed">${_s.miniGames.completed.message}</div>
                <div id="continue_journey" class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.continue}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
    }

    destroy() {
        document.getElementById('cable-connector').remove()
        document.body.classList.remove('freeze')
        window.removeEventListener('resize', instance.resize)

        if (instance.timer)
            instance.timer.destroy()
    }
}

function getRandomOrder(length) {
    var randomOrder = []

    while (randomOrder.length < length) {
        var r = Math.floor(Math.random() * length)
        if (randomOrder.indexOf(r) === -1) randomOrder.push(r)
    }

    return randomOrder
}