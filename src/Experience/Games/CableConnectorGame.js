import Experience from '../Experience.js'
import Konva from 'konva'
import _s from '../Utils/Strings.js'
import Modal from '../Utils/Modal.js'
import Timer from '../Extras/Timer.js'

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
    }

    toggleCableConnector() {
        this.init()
        this.setup()
        this.startTimer()
        this.addEventListeners()
        window.addEventListener('resize', instance.resize)
    }

    init() {
        const spriteW = 180
        const spriteH = 100

        this.data = {
            canvas: {
                width: this.sizes.width,
                height: this.sizes.height
            },
            container: {
                width: this.sizes.width - 500,
                height: this.sizes.height - 450
            },
            outlet: {
                width: 40,
                height: 100
            },
            cable: {
                width: this.sizes.width / 5,
                pin: {
                    width: 40,
                    height: 10,
                    radius: 5,
                },
                plug: {
                    width: 60,
                    height: 60,
                    radius: 30
                }
            },
            color: {
                name: [
                    'lightBlue',
                    'darkBlue',
                    'yellow',
                    'pink',
                    'purple'
                ],
                hex: [
                    "#2c90cf",
                    "#373e93",
                    "#f9c662",
                    "#ff6ea9",
                    "#af4eaa"
                ],
                stroke: [
                    "#2b78c3",
                    "#23307a",
                    "#fcb04e",
                    "#f75b99",
                    "#9f4096",
                ],
                default: '#cccccc',
                defaultStroke: '#bbbbbb'
            },
            sprite: {
                src: {
                    sparkles: 'games/sparkles.png',
                    explosion: 'games/explosion.png'
                },
                width: spriteW,
                height: spriteH,
                animations: {
                    sparkle: [
                        0, 0, spriteW, spriteH,
                        spriteW * 2, 0, spriteW, spriteH,
                        spriteW * 3, 0, spriteW, spriteH,
                    ],
                    explosion: [
                        0, 0, spriteW, spriteH,
                        spriteW * 2, 0, spriteW, spriteH,
                        spriteW * 3, 0, spriteW, spriteH,
                    ]
                }
            },
            itemsLength: 5
        }

        this.cables = []
        this.outlets = []

        this.randomOrder = {
            outlet_l: getRandomOrder(this.data.itemsLength),
            cable: getRandomOrder(this.data.itemsLength),
            outlet_r: getRandomOrder(this.data.itemsLength)
        }

        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "cable-connector")
        gameWrapper.classList.add('miniGame')
        document.body.appendChild(gameWrapper)

        const title = document.createElement('div')
        title.classList.add('heading')
        title.innerHTML = "<h2>" + _s.miniGames.cableConnect + "</h2>"

        const actions = document.createElement('div')
        actions.classList.add('miniGame__actions')

        this.stage = new Konva.Stage({
            container: 'cable-connector',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        instance.program = instance.world.program

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

    setup() {
        const layer = new Konva.Layer()

        const containerObj = new Container({
            x: (this.sizes.width - this.data.container.width) / 2,
            y: 225,
            width: this.data.container.width,
            height: this.data.container.height
        })

        const cablesGroup = new Konva.Group({ name: "cables" })
        const outletsGroup = new Konva.Group({ name: "outlets" })

        this.container = containerObj._draw()
        layer.add(this.container)

        const spaceLeft = containerObj.height - (this.data.outlet.height * this.data.itemsLength)
        const spaceBetween = spaceLeft / (this.data.itemsLength + 1)
        const getY = (index) => spaceBetween + index * (this.data.outlet.height + spaceBetween)
        const cableX = containerObj.width / 2 - this.data.cable.width / 2

        for (let i = 0; i < this.data.itemsLength; i++) {
            const outlet_l = new Outlet({
                color: this.data.color.name[instance.randomOrder.outlet_l[i]],
                x: containerObj.sideWidth,
                y: getY(i),
                width: this.data.outlet.width,
                height: this.data.outlet.height,
                fill: this.data.color.default,
                stroke: this.data.color.defaultStroke,
                name: "left"
            })

            const cable = new Cable({
                color: this.data.color.name[instance.randomOrder.cable[i]],
                x: cableX,
                y: getY(i) + this.data.outlet.height / 2 - this.data.cable.plug.height / 2,
                width: this.data.cable.width,
                fill: this.data.color.default,
                stroke: this.data.color.defaultStroke,
            })

            const outlet_r = new Outlet({
                color: this.data.color.name[instance.randomOrder.outlet_r[i]],
                x: containerObj.width - containerObj.sideWidth,
                y: getY(i),
                width: this.data.outlet.width,
                height: this.data.outlet.height,
                fill: this.data.color.default,
                stroke: this.data.color.defaultStroke,
                name: "right"
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

        const triangle = containerObj.item.findOne('.triangle')


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

                    const wrapper = containerObj.item.findOne('.background')

                    const maxX = plug.getParent().x() - wrapper.x() - containerObj.bandWidth
                    const maxY = plug.getParent().y() - containerObj.strokeWidth

                    const minX = plug.getParent().x() - wrapper.width() - wrapper.x() + containerObj.bandWidth
                    const minY = plug.getParent().y() - wrapper.height() + plug.height() / 2 + containerObj.strokeWidth * 2

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
                                ? correspondingOutlet.position.x + correspondingOutlet.width + cable.strokeWidth
                                : correspondingOutlet.position.x - correspondingOutlet.width - cable.strokeWidth,
                            y: correspondingOutlet.position.y + correspondingOutlet.height / 2 - instance.data.cable.plug.height / 2,
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
                            setTimeout(instance.finishGame, 1000)
                        }
                    }
                    else {
                        let connectedToAnyOtherOutlet = false
                        instance.outlets.filter(o => o.color != cable.color && o.name === direction).forEach(otherOutlet => {
                            if (instance.connectedToOutlet(plugPosition, otherOutlet)) {
                                connectedToAnyOtherOutlet = true
                                instance.playAnimation(otherOutlet, explosionSprite)
                            }

                        })

                        if (connectedToAnyOtherOutlet)
                            instance.audio.playWrongSound()
                    }
                })

            })

        })

        this.outlets.forEach(outlet => {

            outlet.item.on('mouseover', () => {
                document.body.style.cursor = 'pointer'
                outlet.item.shadowBlur(10)
            })

            outlet.item.on('mouseout', () => {
                document.body.style.cursor = 'default'
                outlet.item.shadowBlur(0)
            })

            outlet.item.on('click', () => {
                if (!outlet.canClick) return
                if (outlet.connected) return

                const index = instance.data.color.name.indexOf(outlet.color)

                if (outlet.isVisible) {
                    instance.deselectOutlet(outlet)
                } else {
                    const currentVisible = instance.outlets.find(o => o.isVisible === true && o.colorFound === false)
                    instance.selectOutlet(outlet, index)

                    if (!currentVisible) return

                    if (currentVisible.color === outlet.color) {
                        // Same color. Cable gets colored

                        outlet.colorFound = true
                        currentVisible.colorFound = true
                        instance.audio.playCorrectSound()

                        instance.animateIcon(triangle, 'green', containerObj, layer)

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

                            instance.animateIcon(triangle, 'red', containerObj, layer, () => {
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

    animateIcon(obj, fill, containerObj, layer, callback = () => { }) {
        const amplitude = 5;
        const period = 100;
        const centerX = containerObj.item.width() / 2

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

    startTimer() {
        const currentStep = instance.program.currentStep
        const timerInMinutes = instance.world.selectedChapter.program[currentStep].timer

        if (timerInMinutes > 0) {
            this.timer = new Timer()
            this.timer.setMinutes(timerInMinutes)
            document.addEventListener('timeElapsed', instance.onTimeElapsed)
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
        const direction = obj.item.name()
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
        return Math.abs(plugPosition.x - correspondingOutlet.position.x) < 80
            && Math.abs(plugPosition.y - correspondingOutlet.position.y) < 60
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
                <div class="congrats__chapter-completed">${_s.miniGames.completed.message}!</div>
                <div id="continue_journey" class="button button__continue">
                    <div class="button__content"><span>${_s.miniGames.continue}</span></div>
                </div>
            </div>
        </div>`

        instance.modal = new Modal(html)

        document.querySelector('.modal').classList.add('modal__congrats')
    }

    resize() {
        instance.container.x((instance.sizes.width - instance.data.container.width) / 2)
    }

    destroy() {
        document.getElementById('cable-connector').remove()
        document.body.classList.remove('freeze')
        window.removeEventListener('resize', instance.resize)

        if (instance.timer)
            instance.timer.destroy()
    }
}

class Container {
    constructor({ x, y, width, height }) {
        this.position = { x, y }
        this.width = width
        this.height = height
        this.stroke = "#cbcbcb"
        this.strokeWidth = 10
        this.radius = 30
        this.bandWidth = 50
        this.sideWidth = instance.sizes.width / 10

        this.outlet = {
            width: 40,
            height: 100,
        }
    }

    _draw() {
        this.item = new Konva.Group({
            x: this.position.x,
            y: this.position.y,
            name: "container"
        })

        this.item.add(this._bg())
        this.item.add(this._icon())
        this.item.add(this._side({ x: 0, y: 0 }))
        this.item.add(this._side({ x: this.width, y: 0 }).scaleX(-1))

        return this.item
    }

    _bg() {
        const background = new Konva.Rect({
            x: this.sideWidth,
            width: this.width - this.sideWidth * 2,
            height: this.height,
            fillLinearGradientEndPointY: this.height,
            fillLinearGradientColorStops: [
                0, '#1a1a1a',
                1, '#4d4d4d'
            ],
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            name: "background"
        })

        return background
    }

    _icon() {
        const icon = new Konva.Group({
            x: this.width / 2,
            y: this.height / 2,
            // listening: false,
            name: "warningSign"
        })

        icon.add(new Konva.RegularPolygon({
            sides: 3,
            radius: 200,
            fill: '#fbaf4e',
            stroke: 'black',
            strokeWidth: this.strokeWidth * 2,
            cornerRadius: this.radius,
            rotation: 20,
            opacity: 0.35,
            lineJoin: 'round',
            name: 'triangle'
        }))

        Konva.Image.fromURL('games/volt.svg', image => {
            icon.add(image)
            image.setAttrs({
                width: 80,
                height: 200,
                offset: {
                    x: 33,
                    y: 120
                },
                opacity: 0.35
            })
        })

        return icon
    }

    _side({ x, y }) {
        const side = new Konva.Group({
            x: x,
            y: y,
            listening: false,
            name: "side"
        })

        side.add(new Konva.Rect({
            width: this.sideWidth,
            height: this.height,
            fillLinearGradientEndPointX: this.sideWidth,
            fillLinearGradientColorStops: [
                0, '#989898',
                1, '#666666'
            ],
            cornerRadius: [this.radius, 0, 0, this.radius],
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
        }))

        Konva.Image.fromURL('games/band.png', image => {
            side.add(image)
            image.setAttrs({
                x: instance.sizes.width / 10 - this.bandWidth - this.strokeWidth / 2,
                y: this.strokeWidth / 2,
                width: this.bandWidth,
                height: this.height - this.strokeWidth,
            })
        })

        return side
    }
}

class Outlet {
    constructor({ color, x, y, width, height, fill, stroke, name }) {
        this.color = color
        this.position = { x, y }
        this.width = width
        this.height = height
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = 10
        this.connected = false
        this.isVisible = false
        this.colorFound = false
        this.canClick = true
        this.name = name
        this.item = null
    }

    _draw() {
        const outlet = new Konva.Rect({
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height,
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            name: this.name,
            shadowColor: 'white',
            offset: {
                x: -this.strokeWidth
            }
        })

        this.item = outlet
        return outlet
    }

    _update() {
        this.item.fill(this.fill)
        this.item.stroke(this.stroke)
    }
}

class Cable {
    constructor({ color, x, y, width, fill, stroke }) {
        this.color = color
        this.position = { x, y }
        this.width = width
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = 10
        this.item = null
    }

    _draw() {
        const cable = new Konva.Group({
            x: this.position.x,
            y: this.position.y
        })

        this.plug_l = this._plug({ x: 0, y: 0 }, "left")
        this.controlOne = this._controlPoint({ x: this.width / 4, y: instance.data.cable.plug.height / 2 }, "one")
        this.controlTwo = this._controlPoint({ x: this.width / 1.33, y: instance.data.cable.plug.height / 2 }, "two")
        this.plug_r = this._plug({ x: this.width, y: 0 }, "right").scaleX(-1)

        this.cord = this._cord([
            this.plug_l.x() + instance.data.cable.plug.width, instance.data.cable.plug.height / 2,
            this.plug_l.x() + instance.data.cable.plug.width + 60, instance.data.cable.plug.height / 2,
            (this.plug_l.x() + this.plug_r.x()) / 2, instance.data.cable.plug.height / 2,
            this.plug_r.x() - instance.data.cable.plug.width - 60, instance.data.cable.plug.height / 2,
            this.plug_r.x() - instance.data.cable.plug.width, instance.data.cable.plug.height / 2
        ])

        this.bezierLine = this._bezierLine()

        this.item = cable
        cable.add(this.plug_l, this.cord, this.bezierLine, this.plug_r)
        return cable
    }

    _plug({ x, y }, position) {
        const plug = new Konva.Group({
            x,
            y,
            width: 100,
            height: 100,
            name: 'plug_' + position
        })

        // Add cable pins
        plug.add(new Konva.Rect({
            x: -instance.data.cable.pin.width,
            y: 10,
            width: instance.data.cable.pin.width,
            height: instance.data.cable.pin.height,
            stroke: "#dcdcdc",
            strokeWidth: this.strokeWidth,
            cornerRadius: [instance.data.cable.pin.radius, 0, 0, instance.data.cable.pin.radius],
            name: 'pin'
        }))
        plug.add(new Konva.Rect({
            x: -instance.data.cable.pin.width,
            y: 40,
            width: instance.data.cable.pin.width,
            height: instance.data.cable.pin.height,
            stroke: "#dcdcdc",
            strokeWidth: this.strokeWidth,
            cornerRadius: [instance.data.cable.pin.radius, 0, 0, instance.data.cable.pin.radius],
            name: 'pin'
        }))

        // Add cable plug
        plug.add(new Konva.Rect({
            width: instance.data.cable.plug.width,
            height: instance.data.cable.plug.height,
            fill: this.fill,
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            cornerRadius: [0, instance.data.cable.plug.radius, instance.data.cable.plug.radius, 0],
            name: 'plug'
        }))

        return plug
    }

    _controlPoint({ x, y }, id) {
        return new Konva.Group({
            x, y,
            name: 'controlPoint_' + id
        })
    }

    _cord() {
        return new Konva.Shape({
            stroke: this.stroke,
            strokeWidth: this.strokeWidth,
            name: 'cord',
            sceneFunc: (ctx, shape) => {
                const b = this._getBezierPoints()
                ctx.beginPath()
                ctx.moveTo(b.x1, b.y1)
                ctx.bezierCurveTo(b.x2, b.y2, b.x3, b.y3, b.x4, b.y4)
                ctx.fillStrokeShape(shape)
            },
        })
    }

    _bezierLine() {
        const b = this._getBezierPoints()
        return new Konva.Line({
            points: [b.x1, b.y1, b.x2, b.y2, b.x3, b.y3, b.x4, b.y4],
        })
    }

    _updateDottedLines() {
        const b = this._getBezierPoints()
        this.bezierLine.points([b.x1, b.y1, b.x2, b.y2, b.x3, b.y3, b.x4, b.y4])
    }

    _getBezierPoints() {
        return {
            x1: this.plug_l.x() + instance.data.cable.plug.width,
            y1: this.plug_l.y() + instance.data.cable.plug.height / 2,
            x2: (this.plug_l.x() + this.plug_r.x()) / 4,
            y2: this.plug_l.y() + instance.data.cable.plug.height / 2,
            x3: (this.plug_l.x() + this.plug_r.x()) / 1.33,
            y3: this.plug_r.y() + instance.data.cable.plug.height / 2,
            x4: this.plug_r.x() - instance.data.cable.plug.width,
            y4: this.plug_r.y() + instance.data.cable.plug.height / 2
        }
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