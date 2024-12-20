import Experience from '../Experience.js'
import Timer from '../Extras/Timer.js'
import Button from '../Components/Button.js'
import Frame from '../Components/Frame.js'
import _s from '../Utils/Strings.js'
import _e from '../Utils/Events.js'
import _gl from '../Utils/Globals.js'
import Konva from 'konva'

let instance = null

export default class CableConnector {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.program = this.world.program
        this.audio = this.world.audio

        instance = this
    }

    toggleCableConnector() {
        this.init()
        this.startTimerIfNecessary()
        this.setup()
        this.setEventListeners()
    }

    init() {
        instance.program = instance.world.program
        instance.currentStepData = instance.program.getCurrentStepData()

        const game = _gl.elementFromHtml(`
            <section class="game cable-connect">
                <div class="container"></div>
                <div class="overlay"></div>
                <div id="cable-connect" class="game-canvas"></div>
            </section>`)

        instance.experience.interface.gameContainer.append(game)
        instance.experience.setAppView('game')

        instance.experience.navigation.next.innerHTML = `<span>${_s.miniGames.skip}</span>`

        const spriteW = 180
        const spriteH = 100

        this.data = {
            canvas: {
                width: 1000,
                height: 500,
            },
            cable: {
                width: 0,
                pin: {
                    width: 30,
                    height: 15,
                    radius: 100,
                },
                plug: {
                    width: 60,
                    height: 60,
                    radius: 1000,
                },
            },
            color: {
                name: ['lightBlue', 'darkBlue', 'yellow', 'pink', 'purple'],
                hex: ['#2c90cf', '#373e93', '#f9c662', '#ff6ea9', '#af4eaa'],
                stroke: ['#2b78c3', '#23307a', '#fcb04e', '#f75b99', '#9f4096'],
                default: '#cccccc',
                defaultStroke: '#bbbbbb',
            },
            sprite: {
                src: {
                    sparkles: 'games/sparkles.png',
                    explosion: 'games/explosion.png',
                },
                width: spriteW,
                height: spriteH,
                animations: {
                    sparkle: [
                        0,
                        0,
                        spriteW,
                        spriteH,
                        spriteW * 2,
                        0,
                        spriteW,
                        spriteH,
                        spriteW * 3,
                        0,
                        spriteW,
                        spriteH,
                    ],
                    explosion: [
                        0,
                        0,
                        spriteW,
                        spriteH,
                        spriteW * 2,
                        0,
                        spriteW,
                        spriteH,
                        spriteW * 3,
                        0,
                        spriteW,
                        spriteH,
                    ],
                },
            },
            itemsLength: 5,
        }

        this.cables = []
        this.outlets = []

        this.randomOrder = {
            outlet_l: getRandomOrder(this.data.itemsLength),
            cable: getRandomOrder(this.data.itemsLength),
            outlet_r: getRandomOrder(this.data.itemsLength),
        }

        this.stage = new Konva.Stage({
            container: 'cable-connect',
            width: instance.data.canvas.width,
            height: instance.data.canvas.height,
        })

        this.correspondingOutlet = null
    }

    setup() {
        const layer = new Konva.Layer()
        const dragLayer = new Konva.Layer()

        const containerObj = new Container({
            x: 0,
            y: 0,
            width: this.data.canvas.width,
            height: this.data.canvas.height,
        })

        const cablesGroup = new Konva.Group({ name: 'cables' })
        const outletsGroup = new Konva.Group({ name: 'outlets' })

        this.container = containerObj._draw()
        layer.add(this.container)

        this.triangle = containerObj.item.findOne('.triangle')
        const background = containerObj.item.findOne('.background')
        const outletWidth = background.width() / 12 / 2.5
        const outletHeight = background.height() / 5 - 30
        const cableWidth = background.width() / 2

        this.data.cable.plug.height = (outletHeight * 4) / 6
        this.data.cable.plug.width = outletWidth * 2
        this.data.cable.pin.height = outletHeight / 6
        this.data.cable.pin.width = outletWidth - 4

        const spaceLeft = containerObj.height - outletHeight * this.data.itemsLength
        const spaceBetween = spaceLeft / (this.data.itemsLength + 1)
        const getY = (index) => spaceBetween + index * (outletHeight + spaceBetween)
        const cableX = containerObj.width / 2 - cableWidth / 2

        for (let i = 0; i < 5; i++) {
            const outlet_l = new Outlet({
                color: this.data.color.name[instance.randomOrder.outlet_l[i]],
                // color: this.data.color.name[1],
                x: containerObj.sideWidth,
                y: getY(i),
                width: outletWidth,
                height: outletHeight,
                fill: this.data.color.default,
                name: 'left',
            })

            const outlet_r = new Outlet({
                color: this.data.color.name[instance.randomOrder.outlet_r[i]],
                // color: this.data.color.name[1],
                x: containerObj.width - containerObj.sideWidth,
                y: getY(i),
                width: outletWidth,
                height: outletHeight,
                fill: this.data.color.default,
                name: 'right',
            })

            const cable = new Cable({
                color: this.data.color.name[instance.randomOrder.cable[i]],
                // color: this.data.color.name[1],
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

        this.cables.forEach((cable) => {
            cable.item.on('dragstart', () => {
                cable.item.moveTo(dragLayer)
            })

            cable.item.children
                .filter((c) => c.name().includes('plug'))
                .forEach((plug) => {
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

                        const minX =
                            plug.getParent().x() -
                            containerObj.width +
                            containerObj.sideWidth +
                            containerObj.bandWidth
                        const minY = plug.getParent().y() - containerObj.height + plug.height() - spaceBetween

                        plug.x(Math.min(Math.max(plug.x(), -maxX), -minX))
                        plug.y(Math.min(Math.max(plug.y(), -maxY), -minY))
                    })

                    plug.on('dragend', () => {
                        if (instance.timerWithTimeElapsed()) return
                        cable.item.moveTo(cablesGroup)

                        const direction = plug.name().replace('plug_', '')
                        const plugPosition = {
                            x: cable.item.x() + plug.x(),
                            y: cable.item.y() + plug.y(),
                        }
                        instance.correspondingOutlet = instance.outlets.find(
                            (o) => o.color == cable.color && o.name === direction
                        )

                        if (instance.connectedToOutlet(plugPosition, instance.correspondingOutlet)) {
                            instance.audio.playSound('correct')
                            instance.playAnimation(instance.correspondingOutlet, sparkleSprite)

                            const plugInPosition = {
                                x:
                                    direction == 'left'
                                        ? instance.correspondingOutlet.position.x +
                                          instance.correspondingOutlet.width
                                        : instance.correspondingOutlet.position.x -
                                          instance.correspondingOutlet.width,
                                y:
                                    instance.correspondingOutlet.position.y +
                                    instance.correspondingOutlet.height / 2 -
                                    instance.data.cable.plug.height / 2,
                            }

                            plug.move({
                                x: plugInPosition.x - plugPosition.x,
                                y: plugInPosition.y - plugPosition.y,
                            })

                            plug.draggable(false)
                            plug.zIndex(0)
                            instance.correspondingOutlet.connected = true

                            if (instance.bothPlugsConnected(cable)) {
                                cable.item.zIndex(0)
                            }

                            if (instance.allCablesConnected()) {
                                instance.stopTimerIfNecessary()
                                setTimeout(instance.finishGame, 1000)
                            }
                        } else {
                            let outletConnectedTo = null
                            instance.outlets
                                .filter((o) => o.color != cable.color && o.name === direction)
                                .forEach((otherOutlet) => {
                                    if (instance.connectedToOutlet(plugPosition, otherOutlet))
                                        outletConnectedTo = otherOutlet
                                })

                            if (outletConnectedTo) {
                                instance.audio.playSound('wrong')
                                instance.playAnimation(outletConnectedTo, explosionSprite)
                            }
                        }
                    })
                })
        })

        this.outlets.forEach((outlet) => {
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
                } else {
                    const currentVisible = instance.outlets.find(
                        (o) => o.isVisible === true && o.colorFound === false
                    )
                    instance.selectOutlet(outlet, index)

                    if (!currentVisible) return

                    if (currentVisible.color === outlet.color) {
                        // Same color. Cable gets colored
                        outlet.canClick = false
                        currentVisible.canClick = false
                        outlet.colorFound = true
                        currentVisible.colorFound = true
                        instance.audio.playSound('correct')

                        instance.colorCable(this.cables.find((c) => c.color === outlet.color))
                    } else {
                        // Different colors
                        if (outlet.name === currentVisible.name) {
                            instance.deselectOutlet(currentVisible)
                        } else {
                            // Opposite sides. Show wrong animation
                            instance.stopOutletClick()
                            instance.audio.playSound('wrong')

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
        this.stage.add(dragLayer)
    }

    animateIcon(obj, fill, layer, callback = () => {}) {
        const amplitude = 5
        const period = 100
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
            },
        })

        this.tween.play()
    }

    timerWithTimeElapsed() {
        return instance.currentStepData.timer && instance.timer.remainingSeconds == 0
    }

    startTimerIfNecessary() {
        const timerInMinutes = instance.currentStepData.timer
        // const timerInMinutes = 0.1

        if (timerInMinutes > 0) {
            this.timer = new Timer()
            this.timer.setMinutes(timerInMinutes, '.cable-connect .container')
            document.addEventListener(_e.ACTIONS.TIME_ELAPSED, instance.onTimeElapsed)
        }
    }

    stopTimerIfNecessary() {
        const timerInMinutes = instance.currentStepData.timer

        if (timerInMinutes > 0) {
            this.timer.destroy()
            document.removeEventListener(_e.ACTIONS.TIME_ELAPSED, instance.onTimeElapsed)
        }
    }

    onTimeElapsed() {
        instance.toggleTryAgain()

        instance.cables.forEach((cable) => {
            cable.item.find('.plug').forEach((plug) => plug.stopDrag())
        })
    }

    colorCable(cable) {
        const index = instance.data.color.name.indexOf(cable.color)
        const plugs = cable.item.find('.plug')
        const cord = cable.item.findOne('.cord')

        plugs.forEach((plug) => {
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
        instance.outlets.forEach((o) => (o.canClick = false))
    }

    startOutletClick() {
        instance.outlets.forEach((o) => (o.canClick = true))
    }

    playAnimation(obj, spriteObj) {
        const direction = obj.name
        const newPosition = {
            x: direction == 'left' ? obj.position.x + obj.width + 15 : obj.position.x - obj.width - 15,
            y: obj.position.y + obj.height / 2,
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
                y: this.data.sprite.height / 2,
            },
        })
    }

    connectedToOutlet(plugPosition, correspondingOutlet) {
        return (
            Math.abs(plugPosition.x - correspondingOutlet.position.x) < correspondingOutlet.width + 20 &&
            Math.abs(plugPosition.y - correspondingOutlet.position.y) < correspondingOutlet.height / 2
        )
    }

    bothPlugsConnected(cable) {
        return instance.outlets.filter((o) => o.color == cable.color && o.connected).length == 2
    }

    allCablesConnected() {
        return instance.outlets.filter((o) => o.connected).length == instance.data.itemsLength * 2
    }

    setEventListeners() {
        document.addEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)
    }

    toggleTryAgain() {
        instance.timer?.destroy()

        const gameContentFrame = new Frame({
            content: `<h1>${_s.miniGames.oops}</h1>
                <p>${_s.miniGames.timeElapsed.message}</p>
                <div class="buttons"></div>`,
        })
        const gameOverHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                ${gameContentFrame.getHtml()}
            </div>
        `)

        const playAgainBtn = new Button({
            content: _s.miniGames.playAgain,
        })
        const resetBTN = _gl.elementFromHtml(playAgainBtn.getHtml())
        gameOverHTML.querySelector('.buttons').append(resetBTN)

        document.querySelector('.cable-connect .container').append(gameOverHTML)
        document.querySelector('.cable-connect').classList.add('popup-visible')

        // Add event listeners
        resetBTN.addEventListener('click', () => {
            instance.destroy()
            instance.toggleCableConnector()
        })
    }

    finishGame() {
        instance.timer?.destroy()

        instance.toggleGameComplete()
        instance.audio.playSound('task-completed')
    }

    toggleGameComplete() {
        const gamePopup = new Frame({
            content: `<h1>${_s.miniGames.completed.title}</h1>
                <p>${_s.miniGames.completed.message}</p>`,
        })
        const congratsHTML = _gl.elementFromHtml(`
            <div class="game-popup">
                ${gamePopup.getHtml()}
            </div>
        `)

        instance.experience.navigation.next.innerHTML = ''

        document.querySelector('.cable-connect .container').append(congratsHTML)
        document.querySelector('.cable-connect').classList.add('popup-visible')

        instance.audio.playSound('task-completed')
        instance.experience.celebrate({
            particleCount: 100,
            spread: 160,
        })
    }

    resizeBreakpoint(x, callback, callback2) {
        if (x.matches) {
            // If media query matches
            callback
        } else {
            callback2
        }
    }

    destroy() {
        instance.timer?.destroy()
        document.querySelector('.game')?.remove()

        instance.experience.navigation.next.innerHTML = ''

        document.removeEventListener(_e.ACTIONS.STEP_TOGGLED, instance.destroy)

        instance.experience.setAppView('chapter')
    }
}

class Container {
    constructor({ x, y, width, height }) {
        this.position = { x, y }
        this.width = width
        this.height = height
        this.stroke = '#cbcbcb'
        this.radius = 30
        this.sideWidth = (width * 1.5) / 12
        this.bandWidth = this.sideWidth / 4
    }

    _draw() {
        this.item = new Konva.Group({
            x: this.position.x,
            y: this.position.y,
            name: 'container',
        })

        this.item.add(this._bg())
        this.item.add(this._icon())
        this.item.add(this._side({ x: 0, y: 0 }))
        this.item.add(this._side({ x: this.width, y: 0 }).scaleX(-1))

        return this.item
    }

    _bg() {
        const background = new Konva.Rect({
            x: this.width / 12,
            width: (this.width * 10) / 12,
            height: this.height,
            fillLinearGradientEndPointY: this.height,
            fillLinearGradientColorStops: [0, '#1a1a1a', 1, '#4d4d4d'],
            name: 'background',
        })

        return background
    }

    _icon() {
        const icon = new Konva.Group({
            x: this.width / 2,
            y: this.height / 2,
            name: 'warningSign',
        })

        const triangle = new Konva.RegularPolygon({
            sides: 3,
            radius: this.width / 10,
            fill: '#fbaf4e',
            cornerRadius: this.radius,
            rotation: 20,
            opacity: 0.35,
            lineJoin: 'round',
            name: 'triangle',
        })

        icon.add(triangle)

        Konva.Image.fromURL('games/volt.svg', (image) => {
            icon.add(image)
            image.setAttrs({
                width: triangle.radius() / 2,
                height: triangle.radius() / 0.8,
                opacity: 0.35,
            })

            image.offset({ x: image.width() / 2 - 5, y: image.height() / 2 + 10 })
        })

        return icon
    }

    _side({ x, y }) {
        const side = new Konva.Group({
            x: x,
            y: y,
            name: 'side',
        })

        side.add(
            new Konva.Rect({
                width: this.sideWidth,
                height: this.height,
                fillLinearGradientEndPointX: this.sideWidth,
                fillLinearGradientColorStops: [0, '#989898', 1, '#666666'],
                cornerRadius: [this.radius, 0, 0, this.radius],
            })
        )

        Konva.Image.fromURL('games/band.png', (image) => {
            side.add(image)
            image.setAttrs({
                x: this.sideWidth - this.bandWidth,
                width: this.bandWidth,
                height: this.height,
            })
        })

        return side
    }
}

class Outlet {
    constructor({ color, x, y, width, height, fill, name }) {
        this.color = color
        this.position = { x, y }
        this.width = width
        this.height = height
        this.fill = fill
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
            name: 'outlet_' + this.color,
            cornerRadius: [0, 4, 4, 0],
            shadowColor: 'white',
        })

        this.item = outlet
        return outlet
    }

    _update() {
        this.item.fill(this.fill)
    }
}

class Cable {
    constructor({ color, x, y, width, fill, stroke }) {
        this.color = color
        this.position = { x, y }
        this.width = width
        this.fill = fill
        this.stroke = stroke
        this.strokeWidth = 6
        this.item = null
    }

    _draw() {
        const cable = new Konva.Group({
            x: this.position.x,
            y: this.position.y,
        })

        this.plug_l = this._plug({ x: 0, y: 0 }, 'left')
        this.controlOne = this._controlPoint(
            { x: this.width / 4, y: instance.data.cable.plug.height / 2 },
            'one'
        )
        this.controlTwo = this._controlPoint(
            { x: this.width / 1.33, y: instance.data.cable.plug.height / 2 },
            'two'
        )
        this.plug_r = this._plug({ x: this.width, y: 0 }, 'right').scaleX(-1)

        this.cord = this._cord([
            this.plug_l.x() + instance.data.cable.plug.width,
            instance.data.cable.plug.height / 2,
            this.plug_l.x() + instance.data.cable.plug.width + 60,
            instance.data.cable.plug.height / 2,
            (this.plug_l.x() + this.plug_r.x()) / 2,
            instance.data.cable.plug.height / 2,
            this.plug_r.x() - instance.data.cable.plug.width - 60,
            instance.data.cable.plug.height / 2,
            this.plug_r.x() - instance.data.cable.plug.width,
            instance.data.cable.plug.height / 2,
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
            width: instance.data.cable.plug.width + instance.data.cable.pin.width,
            height: instance.data.cable.plug.height + instance.data.cable.pin.height,
            name: 'plug_' + position,
        })

        // Add cable pins
        const spaceLeft = instance.data.cable.plug.height - instance.data.cable.pin.height * 2 // 2 is item length
        const spaceBetween = spaceLeft / (2 + 1)
        const getY = (index) => spaceBetween + index * (instance.data.cable.pin.height + spaceBetween)

        for (let i = 0; i < 2; i++) {
            plug.add(
                new Konva.Rect({
                    x: -instance.data.cable.pin.width,
                    y: getY(i),
                    width: instance.data.cable.pin.width,
                    height: instance.data.cable.pin.height,
                    fill: '#dcdcdc',
                    cornerRadius: [instance.data.cable.pin.radius, 0, 0, instance.data.cable.pin.radius],
                    name: 'pin',
                })
            )
        }

        // Add cable plug
        plug.add(
            new Konva.Rect({
                width: instance.data.cable.plug.width,
                height: instance.data.cable.plug.height,
                fill: this.fill,
                cornerRadius: [4, instance.data.cable.plug.radius, instance.data.cable.plug.radius, 4],
                name: 'plug',
            })
        )

        return plug
    }

    _controlPoint({ x, y }, id) {
        return new Konva.Group({
            x,
            y,
            name: 'controlPoint_' + id,
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
            y4: this.plug_r.y() + instance.data.cable.plug.height / 2,
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
