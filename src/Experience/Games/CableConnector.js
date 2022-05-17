import Experience from '../Experience.js'
import Konva from 'konva'

let instance = null

export default class CableConnector {
    constructor() {
        this.experience = new Experience()
        this.world = this.experience.world
        this.sizes = this.experience.sizes

        this.data = {
            box: {
                width: this.sizes.width - 200,
                height: this.sizes.height - 200,
                cornerRadius: 28,
                strokeWidth: 10,
                strokeColor: '#cbcbcb',
                gradientColor: [
                    0, '#1a1a1a',
                    1, '#4d4d4d'
                ],
                gradientColorSides: [
                    0, '#989898',
                    1, '#666666'
                ],
            },
            side: {
                width: 300,
            },
            default: {
                strokeWidth: 6,
            },
            outlet: {
                width: 40,
                height: 100,
                items: []
            },
            plugin: {
                width: 106,
                height: 66,
                items: []
            },
            colors: [
                "#989898",
                "#373e93",
                "#f9c662",
                "#ff6ea9",
                "#af4eaa"
            ],
            strokeColors: [
                "#878787",
                "#23307a",
                "#fcb04e",
                "#f75b99",
                "#9f4096",
            ]
        }
        instance = this

        this.init()
        this.createAllLayers()
    }

    createAllLayers() {
        this.layer = new Konva.Layer()

        const box = this.box(this.data.side.width, 0, this.data.box.width, this.data.box.height)
        const boxLeft = this.side(0, 0, this.data.side.width, this.data.box.height)
        const boxRight = this.side(this.wrapper.width(), 0, this.data.side.width, this.data.box.height, -1)

        this.wrapper.add(box, boxLeft, boxRight)

        box.add(this.outlet(5, 20, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth))
        box.add(this.outlet(5, 220, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth))
        box.add(this.outlet(5, 420, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth))
        box.add(this.outlet(5, 620, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth))
        box.add(this.outlet(5, 820, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth))

        box.add(this.outlet(box.width(), 20, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 220, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 420, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 620, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth, -1))
        box.add(this.outlet(box.width(), 820, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth, -1))

        box.add(this.plugIn(20, 40, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 220, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 420, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 620, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth))
        box.add(this.plugIn(20, 820, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth))

        box.add(this.plugIn(box.width() - 40, 40, this.data.colors[4], this.data.strokeColors[4], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() / 2, 220, this.data.colors[0], this.data.strokeColors[0], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 420, this.data.colors[3], this.data.strokeColors[3], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 620, this.data.colors[1], this.data.strokeColors[1], this.data.default.strokeWidth, -1))
        box.add(this.plugIn(box.width() - 40, 820, this.data.colors[2], this.data.strokeColors[2], this.data.default.strokeWidth, -1))

        const item = this.data.plugin.items[0]
        const itemEnd = this.data.plugin.items[6]

        const line1 = this.connector(
            item.x() + item.width(), item.y() + item.height() / 2,
            item.width() * 2, item.height() * 2,
            itemEnd.x() - itemEnd.width(), itemEnd.y() + itemEnd.height() / 2,
            this.data.strokeColors[0])

        box.add(line1)

        this.data.plugin.items.forEach(item => {

            item.on('dragmove', () => {
                line1.attrs.points[4] = item.x() - item.width()
                line1.attrs.points[5] = item.y() + item.height() / 2
            })
        })

        this.layer.add(this.wrapper)
        this.stage.add(this.layer)
    }

    init() {
        const gameWrapper = document.createElement('div')
        gameWrapper.setAttribute("id", "cable-connector")
        document.body.appendChild(gameWrapper)

        this.stage = new Konva.Stage({
            container: 'cable-connector',
            width: this.sizes.width,
            height: this.sizes.height,
        })

        this.wrapper = new Konva.Group({
            x: 100,
            y: 100,
            width: this.data.box.width,
            height: this.data.box.height,
        })

        document.body.classList.add('freeze')
    }

    box(x, y, w, h) {
        const item = new Konva.Group({
            x: x,
            y: y,
            width: w - this.data.side.width * 2,
            height: h,
        })

        item.add(new Konva.Rect({
            width: item.width(),
            height: item.height(),
            fillLinearGradientEndPointY: this.data.box.height,
            fillLinearGradientColorStops: this.data.box.gradientColor,
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth,
            shadowForStrokeEnabled: false,
            listening: false
        }))

        const icon = new Konva.Group({
            x: item.width() / 2,
            y: item.height() / 2,
        })

        icon.add(new Konva.RegularPolygon({
            sides: 3,
            radius: 200,
            fill: '#fbaf4e',
            stroke: 'black',
            strokeWidth: 20,
            shadowForStrokeEnabled: false,
            cornerRadius: 28,
            rotation: 20,
            opacity: 0.35,
            lineJoin: 'round',
            listening: false
        }))

        Konva.Image.fromURL('games/arrow.svg', image => {
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

        item.add(icon)

        return item
    }

    side(x, y, w, h, position = 1) {
        const item = new Konva.Group({
            x: x,
            y: y,
            width: w,
            height: h,
            scaleX: position,
            listening: false
        })

        item.add(new Konva.Rect({
            width: item.width(),
            height: item.height(),
            fillLinearGradientEndPointX: 300,
            fillLinearGradientColorStops: this.data.box.gradientColorSides,
            cornerRadius: [this.data.box.cornerRadius, 0, 0, this.data.box.cornerRadius],
            stroke: this.data.box.strokeColor,
            strokeWidth: this.data.box.strokeWidth,
            shadowForStrokeEnabled: false
        }))

        Konva.Image.fromURL('games/band.svg', image => {
            item.add(image)
            image.setAttrs({
                x: item.width(),
                y: 5,
                width: 50,
                height: item.height() - 10,
                scaleX: -1
            })
        })

        return item
    }

    outlet(x, y, fill, strokeColor, strokeWidth, position = 1) {
        const item = new Konva.Rect({
            x: x,
            y: y,
            width: this.data.outlet.width,
            height: this.data.outlet.height,
            fill: fill,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            shadowForStrokeEnabled: false,
            scaleX: position,
            name: 'outlet'
        })

        this.data.outlet.items.push(item)
        return item
    }

    plugIn(x, y, fill, strokeColor, strokeWidth, position = 1) {
        const item = new Konva.Group({
            x: x,
            y: y,
            width: this.data.plugin.width,
            height: this.data.plugin.height,
            scaleX: position,
            name: 'plugin',
            draggable: true
        })

        const pinHeight = item.height() / 4

        for (let i = 0; i < 2; i++) {
            item.add(new Konva.Rect({
                y: i * pinHeight * 2, // calc ?!?
                width: item.width() / 2,
                height: pinHeight,
                stroke: '#dcdcdc',
                strokeWidth: strokeWidth,
                offsetX: - item.width() / 4 + 10,
                offsetY: - pinHeight / 2,
                shadowForStrokeEnabled: false,
                cornerRadius: 8
            }))

        }

        item.add(new Konva.Rect({
            x: item.width() / 2,
            width: item.width() - 40,
            height: item.height(),
            fill: fill,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            shadowForStrokeEnabled: false,
            cornerRadius: [0, 28, 28, 0]
        }))

        this.data.plugin.items.push(item)
        return item
    }

    connector(x1, y1, x2, y2, x3, y3, fill) {
        const item = new Konva.Line({
            points: [
                x1, y1,
                x2, y2,
                x3, y3
            ],
            stroke: fill,
            strokeWidth: this.data.default.strokeWidth,
            shadowForStrokeEnabled: false,
            lineCap: 'round',
            lineJoin: 'round',
            tension: 0.5
        })
        return item
    }
    
}